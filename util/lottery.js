const log = require("../CClass/class/loginfo").getInstand;
const CacheUtil =  require("../util/cache_util");
const analyse_result = require("./lottery_analyse_result");
const LABA = require("./laba");
const lottery_record = require("./lottery_record");
const TypeEum = require('../util/enum/type');
const StringUtil =  require("../util/string_util");
const dao = require('../util/dao/dao');
const gameDao = require('../util/dao/gameDao');
const CommonEven = require("./event_util");
const TypeEnum = require("./enum/type");

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
            // 获取玩家赢分差
            CacheUtil.getPlayGameWinscore(userId).then(historyWinScore =>{
                // 是否新手
                newhandProtectControl(userId, historyWinScore, totalRecharge, (newHandFlag, newbierPart)=>{
                    log.info(userId + '携带金币:' + currScore  + '下注:' + nBetSum + '携带银行金币:' + currBankScore + 'VIP等级:' + vipLevel)
                    // 游戏奖池
                    CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) =>{
                        // 获取历史下注记录
                        CacheUtil.getPlayGameBetRecord(userId).then(cf =>{
                            let totalBet = !cf || !cf.totalBet ? 0 : Number(cf.totalBet);
                            let totalBackBet = !cf || !cf.totalBackBet ? 0 : Number(cf.totalBackBet);
                            // 判断玩家是否破产
                            CacheUtil.isBankrupt(currScore, currBankScore, (bankrupt, bustBonus, bustTimes) =>{
                                // 扣费
                                CacheUtil.feeCost(gameConfig.gameId, userId, nBetSum, TypeEnum.ScoreChangeType.gameGlodCoin ,(feeSuccess, feeBeforeFreeCount, currFreeCount, beforeGoldCoin) =>{
                                    // 获取水位
                                    CacheUtil.getGamblingWaterLevelGold().then(nGamblingWaterLevelGold =>{
                                        // 摇奖前参数获取
                                        const config = preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge, totalBet, totalBackBet, newHandFlag, newbierPart, beforeGoldCoin, nGamblingWaterLevelGold, feeBeforeFreeCount, currFreeCount)
                                        if (!Object.values(TypeEnum.GameType).includes(config.gameType)) {
                                            log.info(userId + "不存在的游戏类型" + config.gameType);
                                            socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
                                            return;
                                        }
                                        if(!feeSuccess){
                                            log.info(config.userId + '金币数量不足,当前金币数量:' + beforeGoldCoin + '下注:' + config.nBetSum);
                                            if(config.bankrupt){
                                                log.info(config.userId + "破产了可以领救济金");
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
                                                // reflushLineBet(config, gameInfo, dbNewHandFlag, dao)
                                                // 记录下注流水
                                                recordBetFlow(config, dao);
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

function recordBetFlow(config, dao){
    // 单笔投注额度提升=投注/金币倍率*flow_vip_socre_percentage
    CacheUtil.getScoreConfig().then(cf =>{
        const score_amount_ratio = parseInt(cf.score_amount_ratio);
        CacheUtil.getVConfig().then(c =>{
            const bet = StringUtil.divNumbers(config.nBetSum, score_amount_ratio, 2)
            const promoteWithdrawLimit =  StringUtil.rideNumbers( bet, parseInt(c.flow_vip_socre_percentage) / 100, 2)
            log.info(config.userId + '单笔投注:'+ config.nBetSum +'提升提现额度:' + promoteWithdrawLimit)
            dao.betRecord(config.userId, config.gameId, config.gameName, config.nBetSum, promoteWithdrawLimit, ret =>{})
        })
    })

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
function newhandProtectControl (userId, historyWinScore, totalRecharge, callback) {
    CacheUtil.getNewhandProtectConfig().then(newHandConfig => {
        const recharge = newHandConfig.recharge;
        const newbierPart = newHandConfig.newbierPart;
        const protectScore = Number(newHandConfig.protectScore);
        CacheUtil.getPlayGameWinscore(userId)
        // 充值数量 < recharge && 新手局数完成
        let newHandFlag = 1;
        CacheUtil.getNewbierPartLengthByUserId(userId).then(length =>{
            length = length === -1 ? newbierPart.length : length
            const newHandCurrCount = (newbierPart.length - length);
            if(totalRecharge > recharge || length === 0 || protectScore < StringUtil.toFixed(historyWinScore, 2)){  // 充值大于30或者玩的局数大于新手局数
                newHandFlag = 0;
                log.info('---------------------------------------' + userId + '本局为非新手用户,总充值:'+ totalRecharge + '剩余新手局数:' + length + '历史赢分:' + StringUtil.toFixed(historyWinScore, 2) + '---------------------------------------')
            }else{
               log.info('---------------------------------------' + userId + '本局为新手用户,总充值:'+ totalRecharge + '非新手需要充值大于' + recharge + '或者新手局数不足，当前配置局数:'+ (newHandCurrCount + 1) + '剩余新手局数:' + (length -1) + '---------------------------------------')
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
 * @param beforeGoldCoin 扣费前金币
 * @param nGamblingWaterLevelGold 水位
 * @param feeBeforeFreeCount
 * @param currFreeCount
 * @returns {{}}
 */
function preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge,totalBet, totalBackBet, newHandFlag, newbierPart, beforeGoldCoin, nGamblingWaterLevelGold, feeBeforeFreeCount, currFreeCount){
    const config = {};

    config.feeBeforeFreeCount = feeBeforeFreeCount;
    config.currFreeCount = currFreeCount;
    config.nGamblingWaterLevelGold = nGamblingWaterLevelGold;
    config.newHandFlag = newHandFlag;
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
    config.iconValue = gameConfig.iconValue;

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
    // 开宝箱牌
    config.openBoxCard = -1;
    for (let i = 0; i < gameConfig.iconInfos.length; i++) {
        if(gameConfig.iconInfos[i].icon_s_type_WILD){
            config.nGameMagicCardIndex = gameConfig.iconInfos[i].icon_type;
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
    const result= {
        nHandCards: [], // 图案
        winFlag: false, // 输赢标识
        winItem:{       // 赢金币类型(cardsHandle方法内赋值)
            win : 0,
            winJackpot: 0,
            openBoxCardWin: 0,
            finVal: 0
        },
        currRtp: 0, // 当前RTP
        expectMulSection: [], // 预期倍数区间
        dictAnalyseResult: analyse_result.initResult(config.nBetSum), // 返回给客户端结果
        resDictList: [],
        newHandFlag: config.newHandFlag, // 新手标识
        chooseNum: -1, // 老虎特殊玩法
        finalList: [], // 老虎特殊玩法
        startList: [], // 老虎特殊玩法
        superCardDetailList: [],// 足球存卡
        superCardList: []
    }

    let hitFree = false;
    let hitBonus = false;
    if(config.feeBeforeFreeCount < 3){
        // 是否击中免费
        hitFree = StringUtil.luckRandom(0, 100, config.freeRatio)
        // 是否击中bonus玩法
        hitBonus = StringUtil.luckRandom(0, 100, config.bonusRatio)
        // 是否击中jackpot
        result.winItem.winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney, config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit, config);
    }

    // 足球游戏适配
   /* if(gameInfo.gameId === 283){
        footballAdapter(config,  result, gameInfo, callback)
        return;
    }*/
    let iconValue =  config.iconValue;

    // 获取游戏所有倍数
    gameDao.handCardsMuls(config.gameId, (currGameMulsRow) =>{
        const currGameMuls = currGameMulsRow.map(it => Number(it.mul))
        log.info('获取游戏所有倍数')
        gameDao.minMulCards(config.gameId, (minMulCardRow) =>{
            log.info('获取游戏最小倍数对应的图案组合')
           const minMulCards = minMulCardRow.map(it => JSON.parse(it.card))
            // 当前用户出过的图案组合编号
            CacheUtil.getRecordUserHandCards(config.gameId, config.userId, (cardNums) =>{
                const lastTimeRecord = user.getLastTimeRecord();
                log.info(config.userId + '上局回顾,上局是否免费:' + lastTimeRecord.free + '上局是否击中特殊玩法' + lastTimeRecord.openBox + '上局实际倍数:' + lastTimeRecord.actualMul + '本局预期的倍数区间' + JSON.stringify(lastTimeRecord.expectMulSection) + '上局赢的线' + JSON.stringify(lastTimeRecord.nWinLinesDetail));
                if((config.gameId === 263 || config.gameId === 285 || config.gameId === 286 ) && lastTimeRecord.openBox){ // 大象、公牛、挖矿 特殊玩法内不叠加特殊玩法
                    hitBonus = false;
                }else if((config.gameId === 263 || config.gameId === 285 || config.gameId === 286 ) &&  hitBonus){ // 大象、公牛、挖矿、击中特殊玩法就是进入免费模式
                    hitFree = true;
                }
                if(config.gameId === 272 && parseInt(config.feeBeforeFreeCount) > 0){ // 浣熊免费模式不叠加
                    hitFree = false;
                }

                log.info(config.userId + '是否击中免费:' + hitFree + '是否击中bonus玩法:' + hitBonus + '是否击中jackpot:' + result.winItem.winJackpot)
                if((config.newHandFlag && config.gameId === 288 && lastTimeRecord['free']) || (config.gameId === 288 && !config.newHandFlag && lastTimeRecord.free)) {  // 新手上局是免费的 || 新手转非新手 上局是免费的情况,这把不使用新手线路，选一个倍数 + 上局实际倍数 <= 预期倍数
                    // 钻石游戏需要单独处理免费模式
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
                        if(expectMulSection.length === 1 && expectMulSection[0] <= Math.min(...currGameMuls)){
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
                    muls = muls.length > 0 ? muls : [currGameMuls[0]];
                    gameDao.handCardsByMuls(config.gameId, muls, hitFree, hitBonus, result.winItem.winJackpot, (cardRow) =>{
                        let cards = cardRow ? cardRow.map(it => JSON.parse(it.card)) : [];
                        try{
                            if(cards === null || cards.length === 0){
                                log.err(config.userId + '区间倍数图案数组为空,取最小倍数图案组合')
                                cards = minMulCards;
                            }
                            if(freeCount === 1){
                                for(let j = 0; j < lastHandCard.length; j++){
                                    if(config.freeCards.includes(lastHandCard[j])){
                                        cards = cards.filter(subArray => {
                                            const len = subArray.filter(element => element === config.freeCards[0]).length;
                                            return lastHandCard[j] === subArray[j] &&  len === 1;
                                        });
                                    }
                                }
                            }else if(freeCount === 2){
                                // 找出两个位置相同的免费
                                for(let j = 0; j < lastHandCard.length; j++){
                                    if(config.freeCards.includes(lastHandCard[j])){
                                        cards = cards.filter(subArray => {
                                            const len = subArray.filter(element => element === config.freeCards[0]).length;
                                            return lastHandCard[j] === subArray[j] &&  len === 2;
                                        });
                                    }
                                }
                            }
                            isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards,  config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard, config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex, config, lastTimeRecord)
                            cardsHandle(config, result, gameInfo.userList[config.userId])
                            afterLottery(config, gameInfo, result, callback);
                        }catch (e){
                            log.err(config.userId, '摇奖异常', e)
                            callback(0)
                        }
                    })
                }else if(config.newHandFlag){ // 新手
                    CacheUtil.getNewbierPartMulByUserId(config.userId).then(mulIndex => {
                        log.info(config.userId + '倍数区间二维数组:' + JSON.stringify(iconValue))
                        // 获取倍数区间
                        let mulSection = LABA.getMulByIndex(iconValue, mulIndex);
                        log.info(config.userId + '新手获取玩家当局的倍数区间:' + JSON.stringify(mulSection))
                        if(config.gameId === 263 && parseInt(config.feeBeforeFreeCount) > 0){
                            // 大象免费模式默认x2倍 所以要/2
                            log.info(config.userId + '大象免费模式默认x2倍 所以要取倍数区间的时候需要除以2出倍区间' + mulSection)
                            mulSection = mulSection.map(element => StringUtil.divNumbers(element , 2, 2));
                        }
                        // 根据特殊将 从倍数区间过滤出满足的图案倍数
                        let muls = 0;
                        if (mulSection.length === 1) {
                            // 最后一项
                            if (mulSection[0] === iconValue[iconValue.length - 1][0]) {
                                // 找游戏里满足大于此倍数的区间
                                muls = currGameMuls.filter(mul => mul >= mulSection[0])
                            } else {
                                muls = mulSection;
                            }
                        } else {
                            muls = StringUtil.getRandomMuls(currGameMuls, mulSection);
                        }
                        if (hitFree && muls.length === 1) {
                            muls = [0, muls[0]];
                        }
                        result.expectMulSection = mulSection;
                        if(muls.length > 10){ // 优化查询速度
                            muls = StringUtil.shuffleArray(muls).slice(0, 10)
                        }
                        result.muls = muls;
                        log.info(config.userId + '满足条件的倍数数组:' + JSON.stringify(muls))
                        gameDao.handCardsByMuls(config.gameId, muls , hitFree, hitBonus, result.winItem.winJackpot,(cardRow) =>{
                            const cards = cardRow ? cardRow.map(it => JSON.parse(it.card)) : [];
                            try{
                                isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard,  config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex, config, lastTimeRecord)
                                cardsHandle(config, result, gameInfo.userList[config.userId])
                                afterLottery(config, gameInfo, result, callback);
                            }catch (e){
                                log.err(config.userId + '摇奖异常' + e)
                                callback(0)
                            }
                        })
                    })
                }else if(!config.newHandFlag){ // 非新手
                    // 获取系统当前库存
                    CacheUtil.getGamblingBalanceGold().then(gamblingBalanceGold =>{
                        if(gamblingBalanceGold < 0){
                            log.info(config.userId + '库存不足,当前库存:' + gamblingBalanceGold + '发最小倍数')
                            // 库存不足 倍数内随机获取图案组合
                            try{
                                result.expectMulSection = [currGameMuls[0]];
                                result.muls = [currGameMuls[0]]; // 满足条件的倍数
                                log.info(config.userId + '满足条件的倍数数组:' + JSON.stringify([currGameMuls[0]]))

                                isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, minMulCards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard,  config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex, config, lastTimeRecord)
                                cardsHandle(config, result, user)
                                afterLottery(config, gameInfo, result, callback);
                            }catch (e){
                                log.err(config.userId + '摇奖异常' + e)
                                callback(0)
                            }
                        }else{
                            // 库存充足 获取当前玩家RTP 根据RTP出倍数区间 RTP = 总回报/总下注 * 100 %
                            const currRtp = config.totalBet ? StringUtil.rideNumbers(StringUtil.divNumbers(config.totalBackBet, config.totalBet, 2), 100, 2) :  0;
                            log.info(config.userId + '总下注:' + config.totalBet + '总回报:' +  config.totalBackBet + '当前rtp:' + currRtp)
                            // 根据预期RTP获取倍数权重
                            CacheUtil.getControlAwardByRtp(currRtp).then(weights =>{
                                log.info(config.userId + '当前RTP:' + currRtp + '根据RTP获取倍数权重数组' + JSON.stringify(weights))
                                log.info(config.userId + '倍数区间二维数组:' + JSON.stringify(iconValue))
                                // 获取倍数区间
                                let mulSection = LABA.getMulByWeight(iconValue, weights);
                                log.info(config.userId + '根据倍数权重出倍区间' + JSON.stringify(mulSection))
                                let muls = 0;
                                if(config.gameId === 263 && parseInt(config.feeBeforeFreeCount) > 0){
                                    // 大象免费模式默认x2倍 所以要/2
                                    log.info(config.userId + '大象免费模式默认x2倍 所以要取倍数区间的时候需要除以2出倍区间' + mulSection)
                                    mulSection = mulSection.map(element => StringUtil.divNumbers(element , 2, 2));
                                }

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
                                if(muls.length > 10){ // 优化查询速度
                                    muls = StringUtil.shuffleArray(muls).slice(0, 10)
                                }

                                result.muls = muls;
                                log.info(config.userId + '满足条件的倍数数组:' + JSON.stringify(muls))

                                gameDao.handCardsByMuls(config.gameId, muls, hitFree, hitBonus, result.winItem.winJackpot, (cardRow) =>{
                                    let cards = cardRow ? cardRow.map(it => JSON.parse(it.card)) : [];
                                    try{
                                        isWinHandle(config.userId, hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard, config.openBoxCard, config.iconTypeBind, minMulCards, config.gameId, cardNums, config.newHandFlag, result, lastTimeRecord.nWinLinesDetail, config.nGameMagicCardIndex, config, lastTimeRecord)
                                        cardsHandle(config, result, user)
                                        afterLottery(config, gameInfo, result, callback);
                                    }catch (e){
                                        log.err(config.userId + '摇奖异常' + e)
                                        callback(0)
                                    }
                                })
                            })
                        }
                    })
                }
            })
        })
    })
}


function afterLottery(config, gameInfo, result, callback){
    const dictAnalyseResult = result.dictAnalyseResult;
    const win = result.winItem.win;
    const winJackpot = result.winItem.winJackpot;
    const openBoxCardWin = result.winItem.openBoxCardWin;
    const finVal = result.winItem.finVal;
    // 获取最新用户信息
    CacheUtil.getUserInfo(config.userId,  (code, user) => {
        // 换图案
        replaceCards(config, result.nHandCards, gameInfo.userList[config.userId], dictAnalyseResult)
        // 正常结算
        let winscore = StringUtil.addTNumbers(win, winJackpot, openBoxCardWin)
        // 本局记录,是否需要特殊结算
        lastTimeRecord(config, gameInfo.userList[config.userId], dictAnalyseResult.getFreeTime['bFlag'], dictAnalyseResult.getOpenBox['bFlag'] , config.nGameLines, config.freeCards, dictAnalyseResult.nMultiple, dictAnalyseResult.nWinLinesDetail, user.freeCount, result)

        reduceBalanceGold(config, winscore, win, winJackpot, openBoxCardWin, async (r) => {
            // 本局获得免费次数
            const freeCount = dictAnalyseResult["getFreeTime"]["nFreeTime"];
            // 当前免费次数和金币
            const currFreeCount = parseInt(StringUtil.addNumbers(user.freeCount, freeCount));
            // 增减金币和免费次数
            await CacheUtil.addGoldCoin(config.userId, winscore, TypeEnum.ScoreChangeType.gameGlodCoin).then((currGoldCoin) => {
                CacheUtil.addFreeCount(config.gameId, config.userId, freeCount, (ret) => {
                    // 中奖信息通知
                    analyse_result.winNoticeMsg(config, user, dictAnalyseResult, result);
                    // 分析结果构建
                    const resultArray = analyse_result.analyseResultBuild(currFreeCount, currGoldCoin, dictAnalyseResult);
                    // 日志记录
                    lottery_record.record(gameInfo._Csocket, config.nGameLines.length, config.serverId, config.gameId,
                        config.userId, config.nBetSum, winscore, config.beforeGoldCoin, currGoldCoin, freeCount, config.feeBeforeFreeCount,
                        currFreeCount, gameInfo.lotteryLogList, gameInfo.score_changeLogList, resultArray);
                    // 摇奖次数统计
                    lotteryTimes(config, finVal);
                    // 返回结果
                    const r = analyse_result.lotteryReturn(currGoldCoin, winscore, freeCount, currFreeCount, dictAnalyseResult, result.resDictList, result.newHandFlag);
                    callback(r);
                })
            })
        })
    })

}

function lastTimeRecord(config, user, free, openBox, nGameLines, freeCards, actualMul, nWinLinesDetail, freeCount, result){
    actualMul = StringUtil.divNumbers(actualMul , nGameLines.length, 1);
    const expectMulSection = result.expectMulSection.map(element => element - actualMul);
    user.setLastTimeRecord({free: free, openBox: openBox, lastHandCard: result.nHandCards , actualMul: actualMul, expectMulSection: expectMulSection,  nWinLinesDetail: nWinLinesDetail });
}

function isWinHandle(userId, hitFree, hitBonus, winJackpot, cards, freeCards, jackpotCard, blankCard, openBoxCard, iconTypeBind, minMulCards, gameId, cardNums, newHandFlag, result,  nWinLinesDetail, nGameMagicCardIndex, config, lastTimeRecord){
    if(iconTypeBind && iconTypeBind.length > 0){
        // 如果开了配牌器
        log.info('配牌器开关已打开,配牌:' + JSON.stringify(iconTypeBind));
        result.nHandCards = iconTypeBind;
        return;
    }
    if(cards === null || cards.length === 0){
        log.info('图案数组为空，请检查倍数区间内是否存在图案组合,默认取最小倍数组合')
        const index = StringUtil.RandomNum(0, minMulCards.length - 1)
        result.nHandCards = minMulCards[index];
        return;
    }
    const index = StringUtil.RandomNum(0, cards.length - 1)
    result.nHandCards = cards[index];
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
            // console.log(subArray)
        }else{
            filteredArray.push(array[i]);
        }
    }
    return filteredArray;
}

function cardsHandle (config, result, user){

    specialPlayMethBefore(config, result, user)

    // 按类型类型进行图案分析
    switch(config.gameType){
        case TypeEum.GameType.laba_sequence:
            let bet = config.nBetSum;
            if(config.gameId === 263){
                bet = StringUtil.divNumbers(config.nBetSum, 30, 2)
            }
            if(config.gameId === 285){
                bet = StringUtil.divNumbers(config.nBetSum, 40, 2)
            }
            // 列数判断型（大象,公牛）
            LABA.AnalyseColumnSolt(result.nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, bet , result.winItem.winJackpot, config.icon_mul, result, config.gameId);
            break;
        case TypeEum.GameType.laba_normal:
            // 普通判断型 (老虎，轮子，转盘,挖矿)
            LABA.HandCardsAnalyse(result.nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, result.winItem.winJackpot, config.freeCards, config.freeTimes, config, result);
            break;
        case TypeEum.GameType.laba_single:
            // 钻石
            LABA.HandCardsAnalyse_Single(result.nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, user, config, result);
            break;
        case TypeEum.GameType.mixFootball:
            let freeMul = user.getFreeMul();
            let bFreeTimeFlag = config.feeBeforeFreeCount > 0;
            const nBet = StringUtil.divNumbers(config.nBetSum, 20, 2)
            LABA.footballCardsHandle(config, result, freeMul, bFreeTimeFlag, nBet)
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

    specialPlayMethAfter(config, result, user);

    // 图案连线奖
    result.winItem.win = result.dictAnalyseResult["win"];
    // 图案最终价值
    result.winItem.finVal = StringUtil.addTNumbers(result.winItem.win, result.winItem.winJackpot, result.winItem.openBoxCardWin);
    // 中奖总金币大于等于线注 认为本次为赢
    result.winFlag = result.winItem.finVal >= config.nBetSum;

}

function specialPlayMethBefore(config, result, user){
    //if(config.gameId === 268 && result.nHandCards.includes(config.openBoxCard) || result.chooseNum > -1){
    if(config.gameId === 268 && result.nHandCards.includes(config.openBoxCard)){
        log.info('老虎特殊玩法转动前')
        // 老虎特殊bouns
        // LABA.tigerOpenBox(result.dictAnalyseResult, config, result);
        LABA.tigerOpenBoxBefore(result.dictAnalyseResult, config, result);
    }else if(config.gameId === 263){
        // 大象特殊bouns
        // 找出三个以上的免费
        const len = result.nHandCards.filter(card => card === config.freeCards[0]).length;
        if(parseInt(config.feeBeforeFreeCount) < 1 && len >= 3){
            user.setFreeWildTotal(0);
            user.setFreeMul(2);
            result.dictAnalyseResult["fWildNum"] = 0;
            result.dictAnalyseResult["fWildTotalNum"] = 0;
            result.dictAnalyseResult["fMultiple"] = 2;
        }
        if(len >= 3 || parseInt(config.feeBeforeFreeCount) > 0){
            LABA.ganeshagoldOpenBox(result);
        }
    }else if(config.gameId === 272){
        // 浣熊特殊
        const len = result.nHandCards.filter(card => card === config.freeCards[0]).length;
        if(parseInt(config.feeBeforeFreeCount) > 0 || len >= 3){
            LABA.jungledelightOpenBox(result);
        }
    }else if(config.gameId === 285){
        // 公牛特殊bouns
        // 找出三个以上的免费
        const len = result.nHandCards.filter(card => card === config.freeCards[0]).length;
        if(parseInt(config.feeBeforeFreeCount) > 0 || len >= 3){
            LABA.BuffaloKingOpenBox(result);
        }
    }else if(config.gameId === 286){
        // 挖矿免费模式
        const len = result.nHandCards.filter(card => card === config.nGameMagicCardIndex).length;
        if(parseInt(config.feeBeforeFreeCount) > 0 || len > 3){
            LABA.DigDigDiggerOpenBox(result);
        }
        // 没有免费次数
        if(parseInt(config.feeBeforeFreeCount) < 1){
            user.setFreeSymbolList([]);
        }
    }
}

function specialPlayMethAfter(config, result, user){
    if (config.gameId === 268) {
        if(result.nHandCards.includes(config.openBoxCard)){
            log.info('老虎特殊玩法转动后')
            LABA.tigerOpenBoxAfter(config, result, user)
        }
        // 老虎全屏
        LABA.tigerFullScreen(result.dictAnalyseResult, config.nGameLines);
    }else if(config.gameId === 272){
        // 浣熊特殊模式
        const len = result.nHandCards.filter(card => card === config.freeCards[0]).length;
        if (parseInt(config.feeBeforeFreeCount) < 1 && len >= 3) {
            let num = 0;
            switch (len) {
                case 3:
                    num = 8;
                    break;
                case 4:
                    num = 10;
                    break;
                case 5:
                    num = 15;
                    break;
                default:
                    break;
            }
            result.dictAnalyseResult["getFreeTime"] = {"bFlag": true, "nFreeTime": num};
        }
    }else if(config.gameId === 285){
        // 公牛特殊模式
        const len = result.nHandCards.filter(card => card === config.freeCards[0]).length;
        const wildCount = result.nHandCards.filter(card => card === config.nGameMagicCardIndex).length;
        if(parseInt(config.feeBeforeFreeCount) > 0 || len > 3){
            result.dictAnalyseResult["fWildNum"] = wildCount;
            let mul = 1;
            if(wildCount === 1 || wildCount === 2){
                mul = 2
            }else if(wildCount === 3){
                mul = 3
            }else if(wildCount > 3){
                mul = 5
            }
            result.dictAnalyseResult["win"] *= mul;
            log.info(config.userId + '公牛特殊模式,百变数量:' + wildCount + '倍数:' + mul + '连线win:' + result.dictAnalyseResult["win"])
        }
    }else if(config.gameId === 287){
        // 轮子特殊bouns
        result.winItem['openBoxCardWin'] = LABA.grandWheelOpenBox(result.dictAnalyseResult, result.nHandCards, config.openBoxCard, config.nBetSum,  result.expectMulSection)
    }else if(config.gameId === 263){
        // 大象特殊模式
        if(parseInt(config.feeBeforeFreeCount) > 0){
            let wildTotal = user.getFreeWildTotal();
            let mul = user.getFreeMul();
            let wild = result.nHandCards.filter(card => card === config.nGameMagicCardIndex).length;
            wildTotal += wild;
            mul = 2 * (1 + Math.floor(wildTotal / 3));
            mul = mul > 20 ? 20 : mul;
            result.dictAnalyseResult["fWildNum"] = wildTotal % 3;
            result.dictAnalyseResult["fWildTotalNum"] = wildTotal;
            result.dictAnalyseResult["fMultiple"] = mul;
            for (let i in  result.dictAnalyseResult["nAllWinLines"]) {
                result.dictAnalyseResult["nAllWinLines"][i]["win_num"] *= mul;
            }
            result.dictAnalyseResult["win"] *= mul;
            log.info(config.userId + '大象特殊模式,连线win:' + result.dictAnalyseResult["win"])
            user.setFreeWildTotal(wildTotal)
            user.setFreeMul(mul)
        }
    }else if(config.gameId === 286){
        let freeNum = result.nHandCards.filter(card => card === config.nGameMagicCardIndex).length;
        // 挖矿游戏特殊玩法
        if (freeNum >= 3 && parseInt(config.feeBeforeFreeCount) < 1) {
            let ran = StringUtil.RandomNumBoth(0,8);
            let card = [ran + 1];

            const cardList = [...user.getFreeSymbolList(), ...card];
            log.info('挖出矿卡下标:' + (card -1) + '矿卡集合:' + cardList);
            result.dictAnalyseResult["getFreeTime"] = {
                "bFlag": true,
                "nFreeTime": 10,
                "card": card,
                "cardList": cardList
            };
            //计算免费牌中奖
            let winline = [];
            for (let i = 0; i < result.nHandCards.length; i++) {
                if (result.nHandCards[i] === config.nGameMagicCardIndex) {
                    winline.push(i);
                }
            }
            let mul = 1;
            switch (freeNum) {
                case 3:
                    mul = 2;
                    break;
                case 4:
                    mul = 20;
                    break;
                case 5:
                    mul = 200;
                    break;
                default:
                    break;
            }
            result.dictAnalyseResult["nWinLinesDetail"].push(winline);
            const win = result.dictAnalyseResult["win"] ?  result.dictAnalyseResult["win"] : 0;
            result.dictAnalyseResult["win"] = StringUtil.addNumbers(win, StringUtil.rideNumbers(mul, config.nBetSum, 2));
            result.dictAnalyseResult["nWinDetail"].push(StringUtil.rideNumbers(mul, config.nBetSum, 2));
            for (let a in winline) {
                result.dictAnalyseResult["nWinCards"][winline[a]] = true;
            }
            // 合并数组
            user.setFreeSymbolList(user.getFreeSymbolList().concat(result.dictAnalyseResult["getFreeTime"]["card"]));
        }

        //计算免费模式特殊牌中奖
        if (parseInt(config.feeBeforeFreeCount) > 0) {
            //找出黄金牌的位置
            let goldList = {};
            let goldWin = {};
            let sl = user.getFreeSymbolList();
            for (let i = 0; i < sl.length; i++) {
                let l = [];//保存黄金牌的位置
                for (let j = 0; j < result.nHandCards.length; j++) {
                    if (result.nHandCards[j] + 1 === sl[i]) {
                        l.push(j);
                    }
                }
                if (l.length > 0) {
                    goldList[sl[i] + ""] = l;
                    goldWin[sl[i] + ""] = false;
                }
            }
            result.dictAnalyseResult["goldList"] = goldList;
            //统计黄金牌展开后的列
            for (let i in goldList) {
                let wheelList = [];
                for (let j = 0; j < goldList[i].length; j++) {
                    let wheel = goldList[i][j] % 5;
                    if (wheelList.indexOf(wheel) === -1) {
                        wheelList.push(wheel);
                    }
                }
                if (wheelList.length >= config.nGameLineWinLowerLimitCardNumber &&
                    config.icon_mul[parseInt(i) - 1][wheelList.length - config.nGameLineWinLowerLimitCardNumber] > 0) {
                    goldWin[i] = wheelList;
                }
            }
            result.dictAnalyseResult["goldWin"] = goldWin;
            //结算黄金牌展开后的中奖
            let goldWinDetail = {};
            for (let i in goldWin) {
                let gl = {};
                let newHandCard = [...result.nHandCards];
                let gWinCards = [
                    false, false, false, false, false,
                    false, false, false, false, false,
                    false, false, false, false, false];
                let gWinDetail = [];
                let gWinLinesDetail = [];
                if (goldWin[i]) {
                    for (let j = 0; j < goldWin[i].length; j++) {
                        newHandCard[goldWin[i][j]] = parseInt(i) - 1;
                        newHandCard[goldWin[i][j] + 5] = parseInt(i) - 1;
                        newHandCard[goldWin[i][j] + 10] = parseInt(i) - 1;
                        gWinCards[goldWin[i][j]] = true;
                        gWinCards[goldWin[i][j] + 5] = true;
                        gWinCards[goldWin[i][j] + 10] = true;
                    }

                    for (let x = 0; x < config.nGameLines.length; x++) {
                        let xl = config.nGameLines[x];
                        let yl = [];
                        for (let y = 0; y < xl.length; y++) {
                            if (newHandCard[xl[y]] === parseInt(i) - 1) {
                                yl.push(xl[y]);
                            }
                        }
                        gWinLinesDetail.push(yl);
                        let nMultiple = config.icon_mul[parseInt(i) - 1][yl.length - config.nGameLineWinLowerLimitCardNumber];
                        if(nMultiple === undefined){
                            log.info('---------------parseInt(i) - 1:' + parseInt(i) - 1 +'yl.length:'+ yl.length);
                        }
                        nMultiple = nMultiple ? nMultiple : 0
                        const bet = StringUtil.divNumbers(config.nBetSum, config.nGameLines.length, 2);
                        gWinDetail.push(StringUtil.rideNumbers(bet ,nMultiple, 2));
                        result.dictAnalyseResult["win"] = StringUtil.addNumbers(result.dictAnalyseResult["win"], StringUtil.rideNumbers(bet ,nMultiple, 2));
                    }
                    gl = {
                        gWinCards: gWinCards,
                        gWinDetail: gWinDetail,
                        gWinLinesDetail: gWinLinesDetail
                    };
                    goldWinDetail[i] = gl;
                }
            }
            log.info('freeSymbolList:' + user.getFreeSymbolList())
            result.dictAnalyseResult["goldWinDetail"] = goldWinDetail;
        }
    }else if(config.gameId === 283){
        if(parseInt(config.feeBeforeFreeCount) > 0 && result.dictAnalyseResult["win"] > 0){ // 免费游戏中
            user.AddFreeMul(1);
        }
        const freeCard = config.freeCards[0];
        // 非免费模式内大于4张进免费
        const len = result.nHandCards.filter(card => card === freeCard).length;
        if(parseInt(config.feeBeforeFreeCount) < 1 && len >= 4){ // 进免费模式
            let t = 0;
            for (let i in result.superCardDetailList) {//计算免费长牌数量
                if (result.superCardDetailList[i].r === freeCard + 1) {
                    t++;
                }
            }
            for (let i = 0; i < result.nHandCards.length; i++) {
                if (result.nHandCards[i] === freeCard) {//检测是否为长牌
                    let noFind = true;
                    for (let j in result.superCardList) {
                        if (result.superCardList[j].indexOf(i) > -1) {
                            noFind = false;
                        }
                    }
                    if (noFind) {
                        t++;
                    }
                }
            }
            if (t >= 4) {
                result.dictAnalyseResult["getFreeTime"] = {"bFlag": true, "nFreeTime": 15 + 2 * (t - 4)};
            }
        }

    }
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


function lotteryTimes (config, finVal) {
    const currTotalBet = StringUtil.addNumbers(config.totalBet, config.nBetSum, 2);
    const currTotalBackBet = StringUtil.addNumbers(config.totalBackBet, finVal, 2);

    if(config.newHandFlag){
        // 未脱离新手保护 不计下注与返奖
        CacheUtil.updatePlayGameBetRecord(config.userId, JSON.stringify({
            totalBet: 0,
            totalBackBet: 0
        }))
    }else{
        CacheUtil.updatePlayGameBetRecord(config.userId, JSON.stringify({
            totalBet: currTotalBet,
            totalBackBet: currTotalBackBet
        }))
    }

}

















function footballAdapter(config, result, gameInfo, callback){
    result.nHandCards = LABA.createHandCards(config.cards, config.weight_two_array, config.col_count, config.line_count, config.cardsNumber, config.jackpotCard, config.iconTypeBind, result.winItem.winJackpot, config.blankCard);
    cardsHandle(config, result, gameInfo.userList[config.userId])
    afterLottery(config, gameInfo, result, callback);
}








