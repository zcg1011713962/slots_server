const log = require("../CClass/class/loginfo").getInstand;
const CacheUtil =  require("../util/cache_util");
const analyse_result = require("./lottery_analyse_result");
const LABA = require("./laba");
const lottery_record = require("./lottery_record");
const TypeEum = require('../util/enum/type');
const StringUtil =  require("../util/string_util");
const dao = require('../util/dao/dao');
const CommonEven = require("./event_util");
const TypeEnum = require("./enum/type");
const CustomException = require("../util/CustomException");
const {getPlayGameCount} = require("./cache_util");

exports.doLottery  = function doLottery(socket, nBetSum, gameInfo){
    const userId = socket.userId;
    if(!gameInfo.userList[userId]){
        log.info('摇奖用户不存在')
        socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
        return;
    }

    // 获取游戏配置
    CacheUtil.getGameConfig(gameInfo.gameName, gameInfo.gameId).then(gameConfig =>{
        // 下注非法
        if (nBetSum % gameConfig.nGameLines.length !== 0 && nBetSum === 0) {
            log.info(userId + "非法下注nBetSum:" + nBetSum + 'nGameLines len:' + gameConfig.nGameLines.length);
            socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
            return;
        }

        // 获取用户数据
        dao.searchUserById(userId, (code, row) =>{
            if(!code){
                return;
            }
            const firstRecharge =  row.firstRecharge
            const currScore =  row.score
            const currBankScore =  row.bankScore
            const totalRecharge =  row.totalRecharge
            const vipLevel =  row.housecard
            const dbNewHandFlag =  row.newHandFlag
            // 是否新手
            newhandProtectControl(userId, totalRecharge, (newHandFlag, newbierPart)=>{
                log.info(userId + '携带金币:' + currScore  + '下注:' + nBetSum + '携带银行金币:' + currBankScore + 'VIP等级:' + vipLevel)
                // 游戏奖池
                CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) =>{
                    // 获取玩家赢分差
                    CacheUtil.getPlayGameWinscore(userId).then(historyWinScore =>{
                        // 获取历史下注记录
                        CacheUtil.getPlayGameBetRecord(userId).then(cf =>{
                            let totalBet = !cf || !cf.totalBet ? 0 : Number(cf.totalBet);
                            let totalBackBet = !cf || !cf.totalBackBet ? 0 : Number(cf.totalBackBet);
                            // 判断玩家是否破产
                            CacheUtil.isBankrupt(currScore, currBankScore, (bankrupt, bustBonus, bustTimes) =>{
                                // 扣费
                                CacheUtil.feeCost(userId, nBetSum, TypeEnum.ScoreChangeType.gameGlodCoin ,(feeSuccess, beforeFreeCount, beforeGoldCoin) =>{
                                    // 获取水位
                                    CacheUtil.getGamblingWaterLevelGold().then(nGamblingWaterLevelGold =>{
                                        // 摇奖前参数获取
                                        const config = preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge, totalBet, totalBackBet, newHandFlag, newbierPart, beforeFreeCount, beforeGoldCoin, nGamblingWaterLevelGold)
                                        if (!Object.values(TypeEnum.GameType).includes(config.gameType)) {
                                            log.info(userId + "不存在的游戏类型" + config.gameType);
                                            socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
                                            return;
                                        }
                                        if(!feeSuccess){
                                            log.info(config.userId + '金币数量不足,当前金币数量:' + beforeGoldCoin + '下注:' + config.nBetSum);
                                            if(config.bankrupt){
                                                log.info(config.userId + "破产了领救济金:" + config.nBetSum);
                                                socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.popDiscount});
                                                return;
                                            }
                                            // 输光,没购买首充弹首充商城
                                            if(!config.firstRecharge){
                                                log.info(config.userId + "输光,没购买首充弹首充商城:" + config.nBetSum);
                                                socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.popFirstRecharge});
                                                return;
                                            }
                                            log.info(config.userId + "输光了弹限时折扣界面:" + config.nBetSum);
                                            socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.popDiscount});
                                            return;
                                        }
                                        // 进行摇奖
                                        Lottery(config, gameInfo, (result) =>{
                                            try {
                                                if(!result){
                                                    socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
                                                    return;
                                                }
                                                log.info(userId + '摇奖结果' + JSON.stringify(result));
                                                log.info(userId + '摇奖结束--------------------------------------------------------------------------');
                                                // 增加用户玩游戏次数
                                                CacheUtil.addPlayGameCount(userId);
                                                // 摇奖成功
                                                socket.emit('lotteryResult', result);
                                                // 判断是否弹首充
                                                winPopFirstRecharge(config, result, gameInfo);
                                                // 判断是否让客户端刷新线注
                                                reflushLineBet(config, gameInfo, dbNewHandFlag, dao)
                                            }catch (e) {
                                                log.err(userId + '摇奖异常' + e);
                                                socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
                                            }
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    });
}

function reflushLineBet(config, gameInfo, dbNewHandFlag){
    if(config.newHandFlag === 0 && dbNewHandFlag === 1){
        CacheUtil.getGameConfig(gameInfo.gameName, gameInfo.gameId).then(gameConfig => {
            try {
                gameInfo.userList[config.userId]._socket.emit('reflushLineBet', {code: 1, data: gameConfig.betsJackpot});
                log.info(config.userId + '新手转非新手推送线注')
            } catch (e) {
                log.err('reflushLineBet' + e)
                gameInfo.userList[config.userId]._socket.emit('', {code: 0, data: []});
            }
        })
        dao.updateNewHandFlag(config.userId, config.newHandFlag, ret =>{
            CacheUtil.updateNewHandFlag(config.userId, config.newHandFlag).then(r =>{});
        })
    }

}

// 是否需要弹首充商品
function winPopFirstRecharge(config, result, gameInfo) {
    CacheUtil.getNewhandProtectConfig().then(cf =>{
        dao.searchFirstRecharge(config.userId, row =>{
            try {
                if(!row) return;

                const winScorePopFirstRecharge = row.winScorePopFirstRecharge;
                const firstRecharge = row.firstRecharge;
                let winJackpot = false;
                if(result.ResultData.viewarray.getJackpot){
                    winJackpot = result.ResultData.viewarray.getJackpot['bFlag'];
                }else if(result.ResultData.dictAnalyseResult){
                    winJackpot = result.ResultData.dictAnalyseResult.getJackpot['bFlag'];
                }

                const currTotalWinScore = StringUtil.addNumbers(config.historyWinScore, result.ResultData.winscore);
                const protectScore = cf.protectScore;
                if(firstRecharge === 1){
                    return;
                }
                if (winJackpot) {
                    CommonEven.pushFirstRecharge(gameInfo.userList[config.userId]._socket, TypeEnum.pushFirstRechargeType.winJackpot)
                }else if(currTotalWinScore > 0 && StringUtil.compareNumbers(protectScore, currTotalWinScore) &&  winScorePopFirstRecharge === 0){
                    // 只弹一次
                    dao.updateWinScorePopFirstRecharge(config.userId, ret =>{
                        if(ret){
                            log.info(config.userId + '总赢金币:' + currTotalWinScore + '大于新手金币保护:' + protectScore)
                            CommonEven.pushFirstRecharge(gameInfo.userList[config.userId]._socket, TypeEnum.pushFirstRechargeType.winScorePop)
                        }
                    })
                }
            }catch (e){
                log.err('是否需要弹首充商品' + e)
            }
        })
    })

}

// 新手保护逻辑
function newhandProtectControl (userId, totalRecharge, callback) {
    CacheUtil.getNewhandProtectConfig().then(newHandConfig => {
        const recharge = newHandConfig.recharge;
        const newbierPart = newHandConfig.newbierPart;
        // 充值数量 < recharge && 新手局数完成
        let newHandFlag = 1;
        CacheUtil.getNewbierPartLengthByUserId(userId).then(length =>{
            length = length === -1 ? newbierPart.length : length
            const newHandCurrCount = (newbierPart.length - length);
            if(totalRecharge > recharge || length === 0){  // 充值大于30或者玩的局数大于新手局数
                newHandFlag = 0;
                log.info('---------------------------------------' + userId + '本局为非新手,总充值:'+ totalRecharge + '剩余新手局数:' + length + '---------------------------------------')
            }else{
               log.info('---------------------------------------' + userId + '新手保护,总充值:'+ totalRecharge+ '新手当前局数:'+ (newHandCurrCount + 1) + '剩余新手局数:' + (length -1) + '---------------------------------------')
                // 未脱离新手保护 不计下注与返奖
                CacheUtil.updatePlayGameBetRecord(userId, JSON.stringify({
                   totalBet: 0,
                   totalBackBet: 0
               }))
           }
            callback(newHandFlag, newbierPart)
        })
    })
}


/**
 * 摇奖前
 * @param userId 用户id
 * @param nBetSum 下注金币
 * @param gameJackpot 游戏奖池
 * @param gameConfig 游戏配置
 * @param jackpotConfig 奖池配置
 * @param historyWinScore 历史赢金币数量
 * @param bankrupt 是否破产
 * @param firstRecharge 是否首充
 * @param totalBet 总下注
 * @param totalBackBet 总回报
 * @param newHandFlag 是否新手
 * @param newbierPart 新手剧本
 * @param beforeFreeCount 扣费前免费次数
 * @param beforeGoldCoin 扣费前金币
 * @param nGamblingWaterLevelGold 水位
 * @returns {{}}
 */
function preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge,totalBet, totalBackBet, newHandFlag, newbierPart, beforeFreeCount, beforeGoldCoin, nGamblingWaterLevelGold){
    const config = {};

    config.nGamblingWaterLevelGold = nGamblingWaterLevelGold;
    config.newHandFlag = newHandFlag;
    config.beforeFreeCount = beforeFreeCount;
    config.beforeGoldCoin = beforeGoldCoin;
    config.newbierPart = newbierPart;
    config.totalBet = totalBet;
    config.totalBackBet = totalBackBet;
    config.firstRecharge = firstRecharge;
    config.bankrupt = bankrupt;
    config.historyWinScore =  historyWinScore ? historyWinScore : 0;
    config.gameType = gameConfig.gameType;
    config.serverId = gameConfig.serverId;
    config.gameName = gameConfig.gameName;
    config.gameId = gameConfig.gameId;

    config.freeRatio = gameConfig.freeRatio ? gameConfig.freeRatio : -1;
    config.bonusRatio = gameConfig.bonusRatio ? gameConfig.bonusRatio : -1;

    config.sendMessage_mul = gameConfig.sendMessage_mul;
    config.gameJackpot = gameJackpot;
    config.userId = userId;
    config.nBetSum = nBetSum;

    config.nGameLines = gameConfig.nGameLines;
    // 多线情况下 每条线下注的金额
    let len = gameConfig.nGameLines.length;
    const nBetItem = nBetSum / len;
    config.nBetList = [];
    for (let i = 0; i < len; i++) {
        config.nBetList.push(nBetItem)
    }

    const baseLine = gameConfig.baseLine;
    // 行
    config.line_count = baseLine.line_count;
    // 列
    config.col_count = baseLine.col_count;
    // 生成图案数量
    config.cardsNumber = config.line_count * config.col_count;
    // 中普通图案出现的最少次数
    config.nGameLineWinLowerLimitCardNumber = baseLine.line_win_lower_limit;
    // 中jackpot出现的最少次数
    config.jackpotCardLowerLimit = baseLine.icon_jackpot_lower_limit;
    // 线的判断方向
    config.nGameLineDirection = parseInt(baseLine.line_direction, 16);
    // 双向判断的情况下，如果两个方向都中奖，取大值或者取小值（True：取大值；False：取小值）
    config.bGameLineRule = baseLine.line_rule;
    // 图案
    config.cards = gameConfig.iconInfos.map(item => item.icon_type);
    // 图案倍数
    config.icon_mul = gameConfig.icon_mul;
    // 图案下标对应的权重值
    config.weight_two_array = gameConfig.colWeight;
    // 配牌
    config.iconTypeBind = gameConfig.iconBind;

    // 免费图案
    config.freeCards = [];
    // 免费卡对应次数
    config.freeTimes = new Map();
    // jackpot图案
    config.jackpotCard  = -1;
    // 万能图案
    config.nGameMagicCardIndex  = -1;
    // 空白图案
    config.blankCard  = -1;
    // 开宝箱牌
    config.openBoxCard = -1;
    for (let i = 0; i < gameConfig.iconInfos.length; i++) {
        if(gameConfig.iconInfos[i].icon_s_type_WILD){
            config.nGameMagicCardIndex = gameConfig.iconInfos[i].icon_type;
        }
        if(gameConfig.iconInfos[i].icon_s_type_blank){
            config.blankCard = gameConfig.iconInfos[i].icon_type;
        }
        if(gameConfig.iconInfos[i].icon_s_type_free){
            config.freeCards.push(gameConfig.iconInfos[i].icon_type)
            config.freeTimes.set(gameConfig.iconInfos[i].icon_type, gameConfig.iconInfos[i].free_times)
        }
        if(gameConfig.iconInfos[i].icon_s_type_jackpot){
            config.jackpotCard = gameConfig.iconInfos[i].icon_type;
        }
        if(gameConfig.iconInfos[i].icon_s_type_openBoxCard){
            config.openBoxCard = gameConfig.iconInfos[i].icon_type;
        }
    }
    // 游戏奖池比例
    config.jackpotRatio = jackpotConfig.game_jackpot_ratio.map(item => item.ratio)
    // 奖池金币数组
    config.jackpotLevelMoney = jackpotConfig.jackpot_level.map(item => item.jackpot)
    // 奖池金币对应的概率
    config.jackpotLevelProb = jackpotConfig.jackpot_level.map(item => item.prop)

    // 下注数组
    config.betJackpotLevelBet = gameConfig.betsJackpot.map(item => item.bet)
    // 下注数组对应的奖池
    config.betJackpotLevelIndex = gameConfig.betsJackpot.map(item => item.jackpotIndex)
    // 四种奖池对应的概率
    config.jackpotPayLevel = jackpotConfig.jackpot_pay_level;

    return config;
}



// 摇奖
function Lottery(config, gameInfo, callback) {
    const user = gameInfo.userList[config.userId];

    // 进入奖池的钱
    const addJackpot = config.nBetSum * parseInt(config.nGamblingWaterLevelGold) / 100;
    // 进入库存的钱
    const addBalance = config.nBetSum - addJackpot;
    // 增加库存和奖池
    CacheUtil.IncrJackpot(addJackpot);
    CacheUtil.IncrGamblingBalanceGold(addBalance);
    CacheUtil.getGamblingBalanceGold().then(currBalance =>{
        CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) =>{
            log.info(config.userId + '水位:' + config.nGamblingWaterLevelGold + '添加库存:' + addBalance +  '添加奖池:' + addJackpot + '当前库存:' + currBalance + '当前游戏奖池:' + gameJackpot);
        })
    })
    let nHandCards = [];
    const result = {
        winFlag: false, // 本局输赢标识
        winItem:{
            win : 0,
            winJackpot: 0,
            openBoxCardWin: 0,
            finVal: 0
        },
        currRtp: 0, // 当前RTP
        expectMulSection: [], // 预期倍数区间
        dictAnalyseResult: analyse_result.initResult(config.nBetSum), // 返回给客户端结果
        resDictList: [],
        newHandFlag: config.newHandFlag // 新手标识
    }

    // 是否击中免费
    let hitFree = StringUtil.luckRandom(0, 100, config.freeRatio)
    // 是否击中bonus玩法
    let hitBonus = StringUtil.luckRandom(0, 100, config.bonusRatio)
    // 是否击中jackpot
    result.winItem.winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney, config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit, config);

    log.info(config.userId + '是否击中免费:' + hitFree + '是否击中bonus玩法:' + hitBonus + '是否击中jackpot:' + result.winItem.winJackpot)

    // 足球游戏适配
    if(gameInfo.gameId === 283){
        footballAdapter(config,  result, gameInfo, callback)
        return;
    }

    // 获取游戏所有倍数
    CacheUtil.getHandCardsMuls(config.gameId).then(currGameMuls =>{
        // 获取倍数最小的图案数组
        CacheUtil.getHandCardsByMul(config.gameId, currGameMuls[0]).then(minMulCards =>{
            // 当前用户出过的图案组合编号
            CacheUtil.getRecordUserHandCards(config.gameId, config.userId, (cardNums) =>{
                log.info(config.userId + '当前游戏所有倍数' + JSON.stringify(currGameMuls))
                log.info(config.userId + '当前用户已经出过的图案编号' + JSON.stringify(cardNums))
                // 新手 根据配置区间索引出倍数区间 || 新手转非新手 上局是免费的情况
                const lastTimeRecord = user.getLastTimeRecord();
                log.info(config.userId + '上局回顾,上局是否免费:' + lastTimeRecord.free + '上局实际倍数:' + lastTimeRecord.actualMul + '本局预期的倍数区间' + JSON.stringify(lastTimeRecord.expectMulSection) + '上局赢的线' + JSON.stringify(lastTimeRecord.nWinLinesDetail));

                if(config.newHandFlag || (!config.newHandFlag && lastTimeRecord.free)){
                    if(lastTimeRecord['free']){  // 新手上局是免费的 || 新手转非新手 上局是免费的情况,这把不使用新手线路，选一个倍数 + 上局实际倍数 <= 预期倍数
                        const lastHandCard = lastTimeRecord['lastHandCard'];
                        let expectMulSection = user.getLastTimeRecord()['expectMulSection'];
                        expectMulSection = expectMulSection.length === 1 ? [expectMulSection[0],expectMulSection[0]] : expectMulSection;

                        const filterMuls = currGameMuls.filter(mul => mul <= expectMulSection[1])
                        const currMul = filterMuls.length > 0 ? Math.max(...filterMuls) : 0;
                        let muls = StringUtil.getRandomMuls(currGameMuls, [0, currMul]);
                        result.expectMulSection = expectMulSection;

                        const freeCount = lastHandCard.filter(element =>  config.freeCards.includes(element)).length;
                        if(freeCount === 1){
                            hitFree = true;
                            log.info('出一个免费,可选倍数区间:' + JSON.stringify(expectMulSection)  + '可选倍数:' + JSON.stringify(muls))
                            if(expectMulSection.length === 1 && expectMulSection[0] === Math.min(...currGameMuls)){
                                // 出了一张免费牌 预期倍数为当前游戏最低倍时 直接中（否者钻石游戏出两个免费会找不到合适的结果）
                                muls = currGameMuls.filter(mul => mul <= expectMulSection[1] && mul >= expectMulSection[0])
                            }
                        }else if(freeCount === 2){
                            muls = currGameMuls.filter(mul => mul <= expectMulSection[1] && mul >= expectMulSection[0])
                            log.info('出两个免费,可选倍数区间:' + JSON.stringify(expectMulSection) + '可选倍数:' + JSON.stringify(muls))
                            hitFree = true;
                        }else if(freeCount === 3){
                            log.info('出三个免费,可选倍数区间:' + JSON.stringify(expectMulSection) + '可选倍数:' + JSON.stringify(muls))
                            hitFree = false;
                        }
                        if(muls.length === 0){
                            muls = []
                        }
                        // 通过多个倍数获取多个图案组合
                        CacheUtil.getHandCardsByMuls(config.gameId, muls).then(cards =>{
                            try{
                                if(cards === null || cards.length === 0){
                                    log.err(config.userId + '区间倍数图案数组为空,取最小倍数图案组合')
                                    cards = minMulCards;
                                }
                                const tMin = expectMulSection[0];
                                log.info(config.userId + '免费局最少还需发的倍数:' + tMin)
                                if(tMin > 0) {
                                    for(let j = 0; j < lastHandCard.length; j++) {
                                        if(config.freeCards.includes(lastHandCard[j])) {
                                            const c = cards.filter(subArray => {
                                                const a = subArray[j] === lastHandCard[j];
                                                const freeCount = subArray.filter(element => element === lastHandCard[j]).length;
                                                return a && freeCount === subArray.length - 1;
                                            });
                                            if(c.length > 0){
                                                cards = c;
                                            }
                                        }
                                    }
                                }else{
                                    for(let j = 0; j < lastHandCard.length; j++){
                                        if(config.freeCards.includes(lastHandCard[j])){
                                            const c = cards.filter(subArray => {
                                                return subArray[j] === lastHandCard[j];
                                            });
                                            if(c.length > 0){
                                                cards = c;
                                            }
                                        }
                                    }
                                }
                                nHandCards = isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards,  config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard, config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex)
                                cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
                                afterLottery(config, nHandCards, gameInfo, result, callback);
                            }catch (e){
                                log.err(config.userId, '摇奖异常', e)
                                callback(0)
                            }
                        });
                        return;
                    }
                    CacheUtil.getNewbierPartMulByUserId(config.userId).then(mulIndex =>{
                        // 走新手路线 获取玩家当局的倍数
                        CacheUtil.getIconValue().then(iconValue =>{
                            log.info(config.userId + '倍数区间二维数组:' + JSON.stringify(iconValue))

                            // 获取倍数区间
                            const mulSection = LABA.getMulByIndex(iconValue, mulIndex);
                            log.info(config.userId + '新手获取玩家当局的倍数区间:' + JSON.stringify(mulSection))
                            // 根据特殊将 从倍数区间过滤出满足的图案倍数
                            let muls = 0;
                            if(mulSection.length === 1){
                                // 最后一项
                                if( mulSection[0] === iconValue[iconValue.length - 1][0] ){
                                    // 找游戏里满足大于此倍数的区间
                                    muls = currGameMuls.filter(mul => mul >= mulSection[0])
                                }else{
                                    muls = mulSection;
                                }
                            }else{
                                muls = StringUtil.getRandomMuls(currGameMuls, mulSection);
                            }
                            log.info(config.userId + '倍数数组:' + JSON.stringify(muls))
                            if(hitFree && muls.length === 1){
                                muls = [0, muls[0]];
                            }
                            result.expectMulSection = mulSection;
                            log.info(config.userId + '满足条件的倍数数组:' + JSON.stringify(muls))
                            // 倍数数组内的图案组合
                            CacheUtil.getHandCardsByMuls(config.gameId, muls).then(cards =>{
                                try{
                                    nHandCards = isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard,  config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex)
                                    cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
                                    afterLottery(config, nHandCards, gameInfo, result, callback);
                                }catch (e){
                                    log.err(config.userId + '摇奖异常' + e)
                                    callback(0)
                                }
                            })
                        })
                    });
                }else{
                    // 获取系统当前库存
                    CacheUtil.getGamblingBalanceGold().then(gamblingBalanceGold =>{
                        if(gamblingBalanceGold < 0){
                            log.info(config.userId + '库存不足,当前库存:' + gamblingBalanceGold + '判定本局为输')
                            // 库存不足 倍数内随机获取图案组合
                            try{
                                result.expectMulSection = [currGameMuls[0]];
                                nHandCards = isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, minMulCards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard,  config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex)
                                cardsHandle(config, nHandCards, result, user)
                                afterLottery(config, nHandCards, gameInfo, result, callback);
                            }catch (e){
                                log.err(config.userId + '摇奖异常' + e)
                                callback(0)
                            }
                        }else{
                            // 库存充足 获取当前玩家RTP 根据RTP出倍数区间 RTP = 总回报/总下注 * 100 %
                            const currRtp = config.totalBet ? StringUtil.divNumbers(config.totalBackBet, config.totalBet, 2) * 100 :  0;
                            log.info(config.userId + '总下注:' + config.totalBet + '总回报:' +  config.totalBackBet + '当前rtp:' + currRtp)
                            // 根据预期RTP获取倍数权重
                            CacheUtil.getControlAwardByRtp(currRtp).then(weights =>{
                                log.info(config.userId + '当前RTP:' + currRtp + '根据RTP获取倍数权重数组' + JSON.stringify(weights))

                                CacheUtil.getIconValue().then(iconValue =>{
                                    log.info(config.userId + '倍数区间二维数组:' + JSON.stringify(iconValue))

                                    // 获取倍数区间
                                    const mulSection = LABA.getMulByWeight(iconValue, weights);
                                    log.info(config.userId + '根据倍数权重出倍区间' + JSON.stringify(mulSection))
                                    let muls = 0;
                                    if(mulSection.length === 1){
                                        // 最后一项
                                        if( mulSection[0] === iconValue[iconValue.length - 1][0] ){
                                            // 找游戏里满足大于此倍数的区间
                                            muls = currGameMuls.filter(mul => mul >= mulSection[0])
                                        }else{
                                            muls = mulSection;
                                        }
                                    }else{
                                        muls = StringUtil.getRandomMuls(currGameMuls, mulSection);
                                    }
                                    result.expectMulSection = mulSection;
                                    log.info(config.userId + '满足条件的倍数数组:' + JSON.stringify(muls))
                                    // 倍数数组内的图案组合
                                    CacheUtil.getHandCardsByMuls(config.gameId, muls).then(cards =>{
                                        try{
                                            nHandCards = isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard, config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex)
                                            cardsHandle(config, nHandCards, result, user)
                                            afterLottery(config, nHandCards, gameInfo, result, callback);
                                        }catch (e){
                                            log.err(config.userId + '摇奖异常' + e)
                                            callback(0)
                                        }
                                    })
                                })
                            })
                        }
                    })
                }
            })
        })
    })
}

function afterLottery(config, nHandCards, gameInfo, result, callback){
    const dictAnalyseResult = result.dictAnalyseResult;
    const win = result.winItem.win;
    const winJackpot = result.winItem.winJackpot;
    const openBoxCardWin = result.winItem.openBoxCardWin;
    const finVal = result.winItem.finVal;

    // 换图案
    replaceCards(config, nHandCards, gameInfo.userList[config.userId], dictAnalyseResult)
    // 记录这把实际倍数和预期倍数
    lastTimeRecord(gameInfo.userList[config.userId], dictAnalyseResult.getFreeTime['bFlag'], nHandCards, config.nGameLines, config.freeCards, dictAnalyseResult.nMultiple, result.expectMulSection, dictAnalyseResult.nWinLinesDetail)

    // 结算
    CacheUtil.getUserInfo(config.userId,  (code, user) => {
        const winscore = StringUtil.addTNumbers(win, winJackpot, openBoxCardWin)
        reduceBalanceGold(config, winscore, win, winJackpot, openBoxCardWin, (r) =>{
            // 本局获得免费次数
            const freeCount = dictAnalyseResult["getFreeTime"]["nFreeTime"];
            // 当前免费次数和金币
            const currFreeCount = parseInt(StringUtil.addNumbers(user.freeCount, freeCount));
            const currGoldCoin = StringUtil.addNumbers(winscore, user.score);
            // 增减金币和免费次数
            CacheUtil.addGoldCoin(config.userId, winscore, TypeEnum.ScoreChangeType.gameGlodCoin, (c) => {
                CacheUtil.addFreeCount(config.userId, freeCount,   (ret) =>{
                    const resultArray = analyse_result.build(config.userId, user.nickname, config.gameName, config.nBetSum, currFreeCount, currGoldCoin, dictAnalyseResult, config.sendMessage_mul);
                    // 日志记录
                    lottery_record.record(gameInfo._Csocket, config.nGameLines.length, config.serverId, config.gameId,
                        config.userId, config.nBetSum, winscore, config.beforeGoldCoin, currGoldCoin, freeCount, config.beforeFreeCount,
                        currFreeCount, gameInfo.lotteryLogList, gameInfo.score_changeLogList, resultArray);
                    // 摇奖次数统计
                    lotteryTimes(config.userId, config.nBetSum, finVal, config.totalBet, config.totalBackBet);
                    // 返回结果
                    const r = analyse_result.lotteryReturn(currGoldCoin, winscore, freeCount, currFreeCount, dictAnalyseResult, result.resDictList, result.newHandFlag);
                    callback(r);
                })
            });
        })
    })

}

function lastTimeRecord(user, free, nHandCards, nGameLines, freeCards, actualMul, expectMulSection, nWinLinesDetail){
    actualMul = StringUtil.divNumbers(actualMul , nGameLines.length, 1);
    expectMulSection = expectMulSection.map(element => element - actualMul);
    user.setLastTimeRecord({free: free, lastHandCard: nHandCards , actualMul: actualMul, expectMulSection: expectMulSection,  nWinLinesDetail: nWinLinesDetail });
}

function isWinHandle(userId, hitFree, hitBonus, winJackpot, cards, freeCards, jackpotCard, blankCard, openBoxCard, iconTypeBind, minMulCards, gameId, cardNums, newHandFlag, result,  nWinLinesDetail, nGameMagicCardIndex){

    if(cards === null || cards.length === 0){
        throw new CustomException('图案数组为空，请检查倍数区间内是否存在图案组合')
    }
    if(iconTypeBind && iconTypeBind.length > 0){
        // 如果开了配牌器
        log.info('配牌器开关已打开,配牌:' + JSON.stringify(iconTypeBind));
        return iconTypeBind;
    }

    if(hitFree){
        const c = cards.filter(subArray => subArray.some((element, index) => index >= 1 &&  freeCards.includes(element)));
        if(c.length > 0){
            cards = c;
            log.info(userId + '中了免费')
        }else{
            log.info(userId + '中了免费，组合型给奖')
        }
    }else{
        // 不中免费，但是图案组合只有一种 不移除免费
        const c = cards.filter(subArray => subArray.every((element, index) => index === 0 || !freeCards.includes(element)));
        if(c.length > 0){
            cards = c;
        }else {
            if(freeCards.length > 0){
                log.info(userId + '不中免费，但是图案只剩带免费组合, 不移除免费')
            }
        }
    }

    if(hitBonus){
        const c = cards.filter(subArray => subArray.some((element, index) => index >= 1 &&  openBoxCard === element));
        if(c.length > 0){
            cards = c;
            log.info(userId + '中了hitBonus')
        }else{
            log.info(userId + '预期中了hitBonus,组合内无hitBonus,移除hitBonus')
        }
    }else {
        let c = [];
        if(openBoxCard > -1){
            c = cards.filter(subArray => subArray.every((element, index) => index === 0 || openBoxCard !== element));
        }else if(blankCard > -1){
            c = cards.filter(subArray => subArray.every((element, index) => index === 0 || blankCard !== element));
        }
        if(c.length > 0){
            cards = c;
        }else{
            if(openBoxCard > -1 || blankCard > -1){
                log.info(userId + '不中hitBonus，但是图案只剩带hitBonus组合, 不移除hitBonus')
            }
        }
    }


    if(winJackpot > 0){
        let c = cards.filter(subArray => subArray.some((element, index) => index >= 1 &&  jackpotCard === element));
        if(c.length > 0){
            cards = c;
            log.info(userId + '中了Jackpot' + winJackpot)
        }else{
            log.info(userId + '中了jackpot,但是倍数组合内无jackpot,移除jackpot')
            result.winItem.winJackpot = 0;
        }
    }else{
        // 没中jackpot直接移除带jackpot组合
        cards = cards.filter(subArray => subArray.every((element, index) => index === 0 || jackpotCard !== element));
    }

    // 过滤出过的线
    if(nWinLinesDetail.length > 0 && conf){
        let c = [...cards]
        for(const it in nWinLinesDetail){
            const nWinLine = nWinLinesDetail[it];
            c = filterTwoDimensionalArray(c, nWinLine, nGameMagicCardIndex);
        }

        if(c.length > 0){
            cards = c;
        }
        console.log(c.length)
    }

    if(cardNums.length > 0){
        const c = cards.filter(subArray => subArray.every((element, index) => index === 0 || !cardNums.includes(element)));
        if(c.length > 0) {
            cards = c
            log.info(userId +'过滤掉出过的图案组合，还有剩余组合,正常出奖')
        }else{
            // 获取当前需要的倍数数组，把记录的编号都移除掉
            const cardNums = cards.map(subArray => subArray[0]);
            log.info(userId +'过滤掉出过的图案组合，无剩余组合，需要重新初始化,本次不过滤')
            CacheUtil.delRecordUserHandCards(gameId, userId, cardNums)
        }
    }

    // 打乱顺序
    cards = StringUtil.shuffleArray(cards);
    let index = StringUtil.RandomNum(0, cards.length - 1)
    let card = cards[index];
    if(card && card.length > 0){
        // 记录用户出过的图案编号
        CacheUtil.recordUserHandCards(gameId, userId, card)
        // 第一个元素代表编号 去掉编号剩下的是图案组合
        const num = card.shift();
        log.info('中奖图案编号' + num)
        return card;
    }

    log.info('找不到合适的图案组合,从最小倍开始里面选一个,过滤掉jackpot奖')
    const mMulCards =  minMulCards.filter(subArray => !subArray.includes(jackpotCard));
    index = StringUtil.RandomNum(0, mMulCards.length - 1)
    card = mMulCards[index];
    // 记录用户出过的图案编号
    CacheUtil.recordUserHandCards(gameId, userId, card)
    const num = card.shift();
    log.info('中奖图案编号' + num)
    return card;
}


function filterTwoDimensionalArray(array, nWinLine, nGameMagicCardIndex) {
    const filteredArray = [];
    for (let i = 0; i < array.length; i++) {
        const subArray = [...array[i]];
        subArray.shift();

        const indices = [...nWinLine];
        const newArray = subArray.filter((element, index) => indices.includes(index + 1));
        if(newArray[0] === newArray[1] && newArray[1] === newArray[2]
            || newArray[0] === newArray[1] && newArray[2] === nGameMagicCardIndex
            || newArray[1] === newArray[2] && newArray[0] === nGameMagicCardIndex
            || newArray[0] === newArray[2] && newArray[1] === nGameMagicCardIndex){
            console.log(subArray)
        }else{
            filteredArray.push(array[i]);
        }
    }
    return filteredArray;
}

function cardsHandle (config, nHandCards, result, user){

    // 按类型类型进行图案分析
    switch(config.gameType){
        case TypeEum.GameType.laba_sequence:
            // 列数判断型（大象）
            LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, result.winItem.winJackpot, config.icon_mul, result);
            break;
        case TypeEum.GameType.laba_normal:
            // 普通判断型 (老虎，轮子，转盘)
            LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, result.winItem.winJackpot, config.freeCards, config.freeTimes, config, result);
            break;
        case TypeEum.GameType.laba_single:
            // 钻石
            LABA.HandCardsAnalyse_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, user, config, result);
            break;
        case TypeEum.GameType.mixFootball:
            footballCardsHandle(nHandCards, config, result, user)
            break;
        default:
            break;
    }

    if(result.winItem.winJackpot > 0){
        // jackpot图案某行中奖
        result.dictAnalyseResult["getJackpot"] = {
            bFlag: true,
            bVal: result.winItem.winJackpot,
            payJpIndex: config.payJpIndex
        }
    }

    if (config.gameName === 'fortunetiger') {
        // 老虎全屏
        LABA.tigerFullScreen(result.dictAnalyseResult, config.nGameLines);
    }else if(config.gameName === 'GrandWheel'){
        // 轮子特殊bouns
        result.winItem['openBoxCardWin'] = LABA.grandWheelOpenBox(result.dictAnalyseResult, nHandCards, config.openBoxCard, config.nBetSum,  result.expectMulSection)
    }

    // 图案连线奖
    result.winItem.win = result.dictAnalyseResult["win"];
    // 图案最终价值
    result.winItem.finVal = StringUtil.addTNumbers(result.winItem.win, result.winItem.winJackpot, result.winItem.openBoxCardWin);
    // 中奖总金币大于等于线注 认为本次为赢
    result.winFlag = result.winItem.finVal >= config.nBetSum;

}


/**
 *
 * @param config
 * @param winscore 赢总金币
 * @param win 赢普通图案金币
 * @param winJackpot 赢jackpot金币
 * @param openBoxCardWin 开宝箱金币
 * @param callback
 */
function reduceBalanceGold(config, winscore, win , winJackpot, openBoxCardWin, callback){
    log.info(config.userId + '下注:' + config.nBetSum + '赢:' + winscore + 'win:'+ win + 'winJackpot:' + winJackpot + 'openBoxCardWin:' + openBoxCardWin);
    if (winscore > 0) { // 赢
        // 减少用户库存
        CacheUtil.DecrGamblingBalanceGold(StringUtil.addNumbers(win, openBoxCardWin)).then(r =>{
            // 减少奖池
            CacheUtil.DecrJackpot(winJackpot).then(r2 =>{
                callback(1)
            })
        });
    } else {  // 输
        CacheUtil.playGameWinscore(config.userId, -config.nBetSum).then(r =>{
            callback(1)
        });
    }
}

function replaceCards(config, nHandCards, user, dictAnalyseResult){
    if(config.gameName === 'BlueDiamond' || config.gameId === 288){
        // 把万能卡存起来
        let list = [];
        for (let i = 0; i < nHandCards.length; i++) {
            // 这局出了万能卡 或者 这局出了万能卡且上一局也出了万能卡
            if (nHandCards[i] === config.nGameMagicCardIndex || (nHandCards.includes(config.nGameMagicCardIndex) && nHandCards[i] === 999)) {
                list.push(true);
            } else {
                list.push(false);
            }
        }
        user.setWildList(list);
        // 把上次替换的特殊卡 变为百变卡 返回给客户端
        for (let i = 0; i < nHandCards.length; i++) {
            if(nHandCards[i] === 999){
                nHandCards[i] = config.nGameMagicCardIndex;
            }
        }
    }

    if(nHandCards) {
        // 手牌加1处理
        dictAnalyseResult["nHandCards"] = [];
        for (let p in nHandCards) {
            dictAnalyseResult["nHandCards"].push(nHandCards[p] + 1)
        }
    }
    // 打印图案排列日志
    LABA.handCardLog(nHandCards, config.col_count, config.line_count);
}


function lotteryTimes (userId, nBetSum, fin_value, totalBet, totalBackBet) {
    const currTotalBet = totalBet + nBetSum;
    const currTotalBackBet = totalBackBet + fin_value;
    const obj = {
        totalBet: currTotalBet,
        totalBackBet: currTotalBackBet
    }
    CacheUtil.updatePlayGameBetRecord(userId, JSON.stringify(obj))
}

















function footballAdapter(config, result, gameInfo, callback){
    const nHandCards = LABA.createHandCards(config.cards, config.weight_two_array, config.col_count, config.line_count, config.cardsNumber, config.jackpotCard, config.iconTypeBind, result.winItem.winJackpot, config.blankCard);
    cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
    afterLottery(config, nHandCards, gameInfo, result, callback);
}




function footballCardsHandle(nHandCards, config, result, user){
    let freeMul = user.getFreeMul();

    // 足球
    let col1 = [nHandCards[0], nHandCards[6], nHandCards[12], nHandCards[18], nHandCards[24], nHandCards[30]];
    let col2 = [nHandCards[1], nHandCards[7], nHandCards[13], nHandCards[19], nHandCards[25], nHandCards[31]];
    let col3 = [nHandCards[2], nHandCards[8], nHandCards[14], nHandCards[20], nHandCards[26], nHandCards[32]];
    let col4 = [nHandCards[3], nHandCards[9], nHandCards[15], nHandCards[21], nHandCards[27], nHandCards[33]];
    let col5 = [nHandCards[4], nHandCards[10], nHandCards[16], nHandCards[22], nHandCards[28], nHandCards[34]];
    let col6 = [nHandCards[5], nHandCards[11], nHandCards[17], nHandCards[23], nHandCards[29], nHandCards[35]];
    //随机转换多格的牌型
    let superCardList = {};
    let superCardDetailList = {};
    let sId = 1;
    col2 = LABA.addSpecialCard(col2, 1, nHandCards, superCardList, superCardDetailList, sId, config);
    col3 = LABA.addSpecialCard(col3, 2, nHandCards, superCardList, superCardDetailList, sId, config);
    col4 = LABA.addSpecialCard(col4, 3, nHandCards, superCardList, superCardDetailList, sId, config);
    col5 = LABA.addSpecialCard(col5, 4, nHandCards, superCardList, superCardDetailList, sId, config);

    // console.log(col2, col3, col4, col5);

    LABA.HandCardsAnalyse_MixFootball(nHandCards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,config.nBetSum, config.icon_mul, config, result);
    result.dictAnalyseResult["sr"] = superCardList;
    result.dictAnalyseResult["srd"] = superCardDetailList;


    let resDictList = [];
    let new_hand_card = [];
    for (let i in nHandCards) {
        new_hand_card.push(parseInt(nHandCards[i]) + 1)
    }
    result.dictAnalyseResult["nHandCards"] = new_hand_card;
    resDictList.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));
    let bFreeTimeFlag = false;

    var combo_num = 0;
    var all_win = 0;
    var box_win = 0;
    while (true) {
        if (result.dictAnalyseResult["win"] > 0) { // 中奖了
            all_win += result.dictAnalyseResult["win"];
            combo_num += 1;
            var win_lines_index = [];
            for (let nwldi in result.dictAnalyseResult["nWinLinesDetail"]) {
                for (let nwldii in result.dictAnalyseResult["nWinLinesDetail"][nwldi]) {
                    win_lines_index.push(result.dictAnalyseResult["nWinLinesDetail"][nwldi][nwldii])
                }
            }
            win_lines_index = StringUtil.es6_set(win_lines_index);
            win_lines_index.sort(function (a, b) {
                return a - b
            });
            win_lines_index.reverse();
            //{r: card + 1, bt: bt, ls: ls};
            let typeList = {};
            for (let wlii in win_lines_index) {
                let x = parseInt(win_lines_index[wlii]);
                if (x < nHandCards.length) {
                    let isFind = false;
                    for (let si in superCardList) {
                        if (superCardList[si].indexOf(x) > -1) {
                            if (superCardDetailList[si].bt === 1) {//有框的需要替换
                                isFind = true;
                                if (superCardDetailList[si].ls === 1) {//金框变万能
                                    typeList[si] = 3;
                                    nHandCards[x] = config.nGameMagicCardIndex;
                                } else if (superCardDetailList[si].ls === 2) {//银框变金框，并随机新的元素
                                    typeList[si] = 2;
                                }
                            } else if (superCardDetailList[si].ls === 3 && superCardDetailList[si].nt > 1) {//如果是万能
                                typeList[si] = 4;
                                isFind = true;
                            } else {//没框的需要删除
                                typeList[si] = 1;
                                isFind = false;
                            }

                            break;
                        }
                    }
                    if (!isFind) {
                        nHandCards[x] = -1;
                    }
                }
            }
            // console.log("typeList:" + JSON.stringify(typeList));
            //整合需要替换的卡牌
            for (let i in typeList) {
                if (typeList[i] === 1) {
                    delete superCardList[i];
                    delete superCardDetailList[i];
                } else if (typeList[i] === 2) {
                    let newCard = config.cards[StringUtil.RandomNumBoth(0, 10)];
                    superCardDetailList[i].r = newCard + 1;
                    superCardDetailList[i].bt = 1;
                    superCardDetailList[i].ls = 1;
                    for (let j in superCardList[i]) {
                        nHandCards[superCardList[i][j]] = newCard;
                    }
                } else if (typeList[i] === 3) {//转化为万能
                    let newCard = config.nGameMagicCardIndex;
                    superCardDetailList[i].r = newCard + 1;
                    superCardDetailList[i].bt = 2;
                    superCardDetailList[i].ls = 3;
                    superCardDetailList[i].nt = superCardList[i].length;
                    for (let j in superCardList[i]) {
                        nHandCards[superCardList[i][j]] = newCard;
                    }
                } else if (typeList[i] === 4) {//消除万能
                    superCardDetailList[i].nt -= 1;
                }
            }
            //重新调整长牌的位置
            for (let i in superCardList) {
                let lastCard = superCardList[i][superCardList[i].length - 1];
                let dn = 0;
                if (lastCard + 6 < 36 && nHandCards[lastCard + 6] === -1) {
                    dn += 1;
                }
                if (lastCard + 12 < 36 && nHandCards[lastCard + 12] === -1) {
                    dn += 1;
                }
                if (lastCard + 18 < 36 && nHandCards[lastCard + 18] === -1) {
                    dn += 1;
                }
                if (lastCard + 24 < 36 && nHandCards[lastCard + 24] === -1) {
                    dn += 1;
                }
                for (let j in superCardList[i]) {
                    superCardList[i][j] += 6 * dn;
                }
            }

            nHandCards.reverse();
            if (!bFreeTimeFlag) {
                for (let n_h_i in nHandCards) {
                    if (nHandCards[n_h_i] === -1) {
                        if (parseInt(n_h_i) + 6 < 36 && nHandCards[parseInt(n_h_i) + 6] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 6];
                            nHandCards[parseInt(n_h_i) + 6] = -1;
                        } else if (parseInt(n_h_i) + 12 < 36 && nHandCards[parseInt(n_h_i) + 12] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 12];
                            nHandCards[parseInt(n_h_i) + 12] = -1;
                        } else if (parseInt(n_h_i) + 18 < 36 && nHandCards[parseInt(n_h_i) + 18] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 18];
                            nHandCards[parseInt(n_h_i) + 18] = -1;
                        } else if (parseInt(n_h_i) + 24 < 36 && nHandCards[parseInt(n_h_i) + 24] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 24];
                            nHandCards[parseInt(n_h_i) + 24] = -1;
                        } else if (parseInt(n_h_i) + 30 < 36 && nHandCards[parseInt(n_h_i) + 30] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 30];
                            nHandCards[parseInt(n_h_i) + 30] = -1;
                        } else {
                            nHandCards[n_h_i] = config.cards[StringUtil.RandomNumBoth(0, config.cards.length - 1)];
                        }
                    }
                }
            } else {
                for (let n_h_i in nHandCards) {
                    if (nHandCards[n_h_i] === -1) {
                        if (parseInt(n_h_i) + 6 < 36 && nHandCards[parseInt(n_h_i) + 6] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 6];
                            nHandCards[parseInt(n_h_i) + 6] = -1;
                        } else if (parseInt(n_h_i) + 12 < 36 && nHandCards[parseInt(n_h_i) + 12] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 12];
                            nHandCards[parseInt(n_h_i) + 12] = -1;
                        } else if (parseInt(n_h_i) + 18 < 36 && nHandCards[parseInt(n_h_i) + 18] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 18];
                            nHandCards[parseInt(n_h_i) + 18] = -1;
                        } else if (parseInt(n_h_i) + 24 < 36 && nHandCards[parseInt(n_h_i) + 24] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 24];
                            nHandCards[parseInt(n_h_i) + 24] = -1;
                        } else if (parseInt(n_h_i) + 30 < 36 && nHandCards[parseInt(n_h_i) + 30] !== -1) {
                            nHandCards[n_h_i] = nHandCards[parseInt(n_h_i) + 30];
                            nHandCards[parseInt(n_h_i) + 30] = -1;
                        } else {
                            nHandCards[n_h_i] = config.cards[StringUtil.RandomNumBoth(0, config.cards.length - 1)];
                        }
                    }
                }

            }
            nHandCards.reverse();

            result.dictAnalyseResult = {
                code: 2,
                nHandCards: [],    //# 结果手牌
                nAllWinLines: [],  //# 中奖的线数的检索
                nWinLinesDetail: [],  //# 中奖线数上中奖的牌的检索
                nWinDetail: [],       //# 每条线中多少钱
                nBet: 0,            // # 下注总额
                win: 0,             //# 中奖总额
                nWinCards: [],      //# 位数与手牌数相同，中奖的为True，没中奖的为False
                nWinCards_top: [],
                getOpenBox: {
                    bFlag: false,
                    nWinOpenBox: 0
                },
                getFreeTime: {
                    bFlag: false,
                    nFreeTime: 0,
                    nIndex: 0
                },
                fMultiple: 1,
                nBetTime: Number(new Date())
            };

            LABA.HandCardsAnalyse_MixFootball(nHandCards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,config.nBetSum, config.icon_mul, config, result);


            new_hand_card = [];
            for (const i in nHandCards) {
                new_hand_card.push(parseInt(nHandCards[i]) + 1);
            }
            result.dictAnalyseResult["nHandCards"] = new_hand_card;
            result.dictAnalyseResult["combo_num"] = combo_num;

            const FREE_MUL = [1, 2, 3, 5]
            //根据连击奖励加倍
            let mul = FREE_MUL[0];
            if (combo_num === 2) {
                mul = FREE_MUL[1];
            } else if (combo_num === 3) {
                mul = FREE_MUL[2];
            } else if (combo_num >= 4) {
                mul = FREE_MUL[3];
            }
            result.dictAnalyseResult["win"] *= mul;

            if (bFreeTimeFlag) {
                result.dictAnalyseResult["win"] *= freeMul;
                result.dictAnalyseResult["fMultiple"] = freeMul;
            }

            result.dictAnalyseResult["sr"] = superCardList;
            result.dictAnalyseResult["srd"] = superCardDetailList;

            resDictList.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));
        } else {
            break;
        }
    }
    result.dictAnalyseResult["win"] = all_win;
    result.resDictList = resDictList;

}




