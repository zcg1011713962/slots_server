const redis_laba_win_pool = require("./redis_laba_win_pool");
const log = require("../CClass/class/loginfo").getInstand;
const CacheUtil =  require("../util/cache_util");
const analyse_result = require("./lottery_analyse_result");
const LABA = require("./laba");
const lottery_record = require("./lottery_record");
const TypeEum = require('../util/enum/type');
const StringUtil =  require("../util/string_util");
const dao = require('../util/dao/dao');
const ErrorCode = require("./ErrorCode");
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
            // 是否新手
            newhandProtectControl(userId, totalRecharge, (newHandFlag, newbierPart, expectRtp)=>{
                log.info(userId + '携带金币:' + currScore  + '下注:' + nBetSum +  '是否新手:' + newHandFlag + '携带银行金币:' + currBankScore + 'VIP等级:' + vipLevel)
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
                                        const config = preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge, totalBet, totalBackBet, newHandFlag, newbierPart, beforeFreeCount, beforeGoldCoin, nGamblingWaterLevelGold, expectRtp)
                                        if (!Object.values(TypeEnum.GameType).includes(config.gameType)) {
                                            log.info(userId + "不存在的游戏类型" + config.gameType);
                                            socket.emit('lotteryResult', {ResultCode: TypeEnum.LotteryResultCode.parmsError});
                                            return;
                                        }
                                        if(!feeSuccess){
                                            log.info(config.userId + '金币数量不足,当前金币数量:' + beforeGoldCoin + '下注:' + config.nBetSum);
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
                                                log.info('摇奖结果' + userId + JSON.stringify(result));
                                                // 增加用户玩游戏次数
                                                CacheUtil.addPlayGameCount(userId);
                                                // 摇奖成功
                                                socket.emit('lotteryResult', result);
                                                winPopFirstRecharge(config, result, gameInfo);
                                            }catch (e) {
                                                log.err(userId + 'doLottery' + e.stack);
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


// 是否需要弹首充商品
function winPopFirstRecharge(config, result, gameInfo) {
    CacheUtil.getNewhandProtectConfig().then(cf =>{
        dao.searchFirstRecharge(config.userId, row =>{
            try {
                if(!row) return;

                const winScorePopFirstRecharge = row.winScorePopFirstRecharge;
                const firstRecharge = row.firstRecharge;
                const winJackpot = result.ResultData.viewarray.getJackpot['bFlag'];
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
        // 充值数量 < recharge && newbier_part长度 < 玩家实际的局数
        CacheUtil.getPlayGameWinscore(userId).then(winscore => {
            CacheUtil.getPlayGameCount(userId).then(count =>{
                let newHandFlag = 1;
                let expectRtp = 0;
                if(totalRecharge < recharge && newbierPart.length < count){
                    newHandFlag = 0;
                    // 获取自动黑白名单-根据赢分区间获得返奖率
                    CacheUtil.getBlackWhiteListConfig().then(bwConfig => {
                        const normalScore = bwConfig.normal[bwConfig.normal.length - 1].winScoreSection;
                        const normalRebateRatio = bwConfig.normal[bwConfig.normal.length - 1].rebateRatio;

                        if (winscore > normalScore) {
                            // 排序
                            for (const item in bwConfig.black) {
                                const score = bwConfig.black[item].winScoreSection;
                                if (winscore > score) {
                                    expectRtp = bwConfig.black[item].rebateRatio
                                }
                            }
                        } else {
                            // 排序
                            for (const item in bwConfig.white) {
                                const score = bwConfig.white[item].winScoreSection;
                                if (winscore > score) {
                                    expectRtp = bwConfig.black[item].rebateRatio
                                }
                                if (winscore < normalScore && winscore > score) {
                                    expectRtp = normalRebateRatio;
                                }
                            }
                        }
                        log.info(userId + '跳过新手保护,返奖率:' + expectRtp)
                    })
                }
                callback(newHandFlag, newbierPart, expectRtp)
            })
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
 * @param expectRtp 预期的RTP
 * @returns {{}}
 */
function preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, historyWinScore, bankrupt, firstRecharge,totalBet, totalBackBet, newHandFlag, newbierPart, beforeFreeCount, beforeGoldCoin, nGamblingWaterLevelGold, expectRtp){
    const config = {};

    config.expectRtp = expectRtp;
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
    // 每条线下注的金额
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
    // 进入奖池的钱
    const addJackpot = config.nBetSum * parseInt(config.nGamblingWaterLevelGold) / 100;
    // 进入库存的钱
    const addBalance = config.nBetSum - addJackpot;
    // 增加库存和奖池
    CacheUtil.IncrJackpot(addJackpot);
    CacheUtil.IncrGamblingBalanceGold(addBalance);
    log.info(config.userId + '水位:' + config.nGamblingWaterLevelGold + "添加库存:" + addBalance +  "添加奖池:" + addJackpot);

    let nHandCards = [];
    const result = {
        winFlag: false,
        winItem:{
            win : 0,
            winJackpot: 0,
            openBoxCardWin: 0,
            finVal: 0
        },
        currRtp: 0,
        dictAnalyseResult: analyse_result.initResult(config.nBetSum)
    }

    // 是否击中免费
    const hitFree = StringUtil.luckRandom(0, 100, config.freeRatio)
    // 是否击中bonus玩法
    const hitBonus = StringUtil.luckRandom(0, 100, config.bonusRatio)
    // 是否击中jackpot
    result.winItem.winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney, config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit, config);


    // 新手
    if(config.newHandFlag){
        // 获取玩家当局的倍数
        CacheUtil.getNewbierPartMul(config.userId).then(mul =>{
            // 倍数内随机获取图案组合
            CacheUtil.getHandCardsByMul(config.gameId, mul).then(cards =>{
                if(cards !== null){
                    nHandCards = isWinHandle(hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard)
                    cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
                    afterLottery(config, nHandCards, gameInfo, result, callback);
                }
            })
        });
    }else{
        // 获取系统当前库存
        CacheUtil.getGamblingBalanceGold().then(gamblingBalanceGold =>{
            if(gamblingBalanceGold < 0){
                // 倍数内随机获取图案组合
                CacheUtil.getHandCardsByMul(config.gameId, 0).then(cards =>{
                    if(cards !== null){
                        const index = StringUtil.RandomNum(0, cards.length - 1)
                        nHandCards = cards[index];
                        cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
                        afterLottery(config, nHandCards, gameInfo, result, callback);
                    }
                })
            }else{
                // 获取当前玩家RTP
                const currRtp = config.totalBet ? StringUtil.rideNumbers(StringUtil.divNumbers(config.totalBackBet, config.totalBet, 2), 100 , 2) : 0;
                log.info(config.userId + '总下注:' + config.totalBet + '总回报:' +  config.totalBackBet + '当前rtp:' + currRtp + '预期的RTP:' +  config.expectRtp)
                // 根据RTP获取倍数权重
                CacheUtil.getControlAwardByRtp(currRtp).then(weights =>{
                    log.info(config.userId + '根据RTP获取倍数权重' + weights)
                    // 获取游戏所有倍数
                    CacheUtil.getHandCardsMuls(config.gameId).then(muls =>{
                        log.info(config.userId + '当前游戏所有倍数' + muls)
                        CacheUtil.getIconValue().then(iconValue =>{
                            log.info(config.userId + '倍数权重:' + iconValue)
                            // 根据倍数权重出倍数
                            const mulSection = LABA.getMulByWeight(iconValue, weights);
                            log.info(config.userId + '根据倍数权重出倍区间' + mulSection)
                            let mul = 0;
                            if(mulSection.length === 1){
                                mul = mulSection[0];
                            }else{
                                mul = StringUtil.getRandomMul(muls, mulSection);
                            }
                            log.info(config.userId + '倍数:' + mul)
                            // 倍数内随机获取图案组合
                            CacheUtil.getHandCardsByMul(config.gameId, mul).then(cards =>{
                                if(cards !== null){
                                    nHandCards = isWinHandle(hitFree, hitBonus, result.winItem.winJackpot, cards, config.freeCards, config.jackpotCard, config.blankCard)
                                    cardsHandle(config, nHandCards, result, gameInfo.userList[config.userId])
                                    afterLottery(config, nHandCards, gameInfo, result, callback);
                                }
                            })
                        })
                    });
                })
            }
        })
    }
    // 生成图案，分析结果（结果不满意继续）
   /* while (true) {
        // 分析jackpot
        //result.winItem.winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney, config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit);
        // 生成图案
        //nHandCards = LABA.createHandCards(config.cards, config.weight_two_array, config.col_count, config.line_count, config.cardsNumber, config.jackpotCard, config.iconTypeBind, winJackpot, config.blankCard);

        // 开了配牌器
        if (config.iconTypeBind && config.iconTypeBind.length > 0) {
            break;
        }

        // 非新手- (历史赢分差 + 本局赢分 > 当前用户金币池上限控制) 且 本局为赢的状态
        const currTotalWinScore = StringUtil.addNumbers(config.historyWinScore , fin_value);
        /!*if (config.currUserGoldPool > - 1 && currTotalWinScore > config.currUserGoldPool && winFlag) {
            if(++lottyCount > 50 || fin_value <= config.nBetSum){
                break;
            }
            log.info(config.userId +'当前赢分差:' + currTotalWinScore + '当前用户最大金币池:' + config.currUserGoldPool  + 'nBetSum:' + config.nBetSum);
            continue;
        }*!/

        // RTP控制
        // 如果超过摇奖总数超过target_rtp_start_position次，开始向期望RTP走
        const backBetRatio = config.totalBet ? (config.totalBackBet / config.totalBet) : 0;
        currRtp = StringUtil.toFixed(backBetRatio, 2);
        // 当前RTP大于目标RTP 而且 摇的结果是赢的
        /!* if (currRtp > expectRTP && winFlag && dictAnalyseResult["getFreeTime"]["nFreeTime"] === 0) {
             if(++lottyCount > 50 || fin_value <= config.nBetSum){
                 break;
             }
             log.info('RTP控制 需要让用户输 currRtp:' + currRtp + 'expectRTP:' + expectRTP + 'fin_value:' + fin_value)
             continue;
         }*!/

        // 新手 当前RTP小于目标RTP 而且 摇的结果是输的
        /!* if (config.currUserGoldPool === -1 && currRtp < expectRTP && !winFlag) {
             if(++lottyCount > 50 || fin_value <= config.nBetSum){
                 break;
             }
              log.info('RTP控制 需要让用户赢 currRtp:' + currRtp + 'expectRTP:' + expectRTP + 'fin_value:' + fin_value)
              continue;
         }*!/
        break;
    }*/
    /*  log.info('当前RTP:' + currRtp + '期望的RTP:' + expectRTP + '输赢:' + winFlag + '总下注:' + StringUtil.addNumbers(config.totalBet, config.nBetSum) + '总返奖:' + config.totalBackBet);*/
}

function afterLottery(config, nHandCards, gameInfo, result, callback){
    const dictAnalyseResult = result.dictAnalyseResult;
    const win = result.winItem.win;
    const winJackpot = result.winItem.winJackpot;
    const openBoxCardWin = result.winItem.openBoxCardWin;
    const finVal = result.winItem.finVal;

    // 换图案
    replaceCards(config, nHandCards, gameInfo.userList[config.userId], dictAnalyseResult)
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
                    const r = analyse_result.lotteryReturn(currGoldCoin, winscore, freeCount, currFreeCount, dictAnalyseResult);
                    callback(r);
                })
            });
        })
    })

}
function isWinHandle(hitFree, hitBonus, winJackpot, cards, freeCards, jackpotCard, blankCard){
    // 没中特殊奖
    if(!hitBonus && !hitFree && winJackpot === 0){
        const index = StringUtil.RandomNum(0, cards.length - 1)
        return cards[index];
    }
    // 中了特殊奖
    if(hitFree){
        const c = cards.filter(subArray => subArray.some(element => freeCards.includes(element)));
        if(c.length > 0) cards = c;
    }
    if(hitBonus){
        const c =  cards.filter(subArray => subArray.includes(blankCard));
        if(c.length > 0) cards = c;
    }
    if(winJackpot > 0){
        const c =  cards.filter(subArray => subArray.includes(jackpotCard));
        if(c.length > 0) cards = c;
    }
    const index = StringUtil.RandomNum(0, cards.length - 1)
    return cards[index];
}

function cardsHandle (config, nHandCards, result, user){

    // 按类型类型进行图案分析
    if (config.gameType === TypeEum.GameType.laba_sequence) {
        const GAME_COMBINATIONS_DIAMOND = [
            {3: 10, 4: 20, 5: 100},		// hand cards no fix line 0
            {3: 10, 4: 20, 5: 100},		// hand cards no fix line 1
            {3: 15, 4: 30, 5: 125},		// hand cards no fix line 2
            {3: 15, 4: 30, 5: 125},		// hand cards no fix line 3
            {3: 30, 4: 100, 5: 200},	// hand cards no fix line 4
            {3: 40, 4: 100, 5: 250},	// hand cards no fix line 5
            {3: 50, 4: 150, 5: 300},	// hand cards no fix line 6
            {3: 75, 4: 150, 5: 400},	// hand cards no fix line 7
            {3: 0, 4: 0, 5: 0},	    // hand cards no fix line 8
            {3: 0, 4: 0, 5: 0},	    // hand cards no fix line 9
        ];
        // 列数判断型
        LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, result.winItem.winJackpot, GAME_COMBINATIONS_DIAMOND, result);
    } else if (config.gameType === TypeEum.GameType.laba_normal) {
        // 普通判断型
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, result.winItem.winJackpot, config.freeCards, config.freeTimes, result);
    } else if (config.gameType === TypeEum.GameType.laba_single) {
        LABA.HandCardsAnalyse_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, user, config, result);
    }

    if(result.winItem.winJackpot > 0){
        // jackpot图案某行中奖
        result.dictAnalyseResult["getJackpot"] = {
            bFlag: true,
            bVal: result.winItem.winJackpot,
            payJpIndex: config.payJpIndex
        }
    }
    // 每种游戏特殊玩法
    if (config.gameName === 'fortunetiger') {
        // 老虎全屏
        tigerFullScreen(result.dictAnalyseResult, config.nGameLines);
    }else if(config.gameName === 'GrandWheel'){
        result.winItem.openBoxCardWin = grandWheelOpenBox(result.dictAnalyseResult, nHandCards, config.openBoxCard, config.nBetSum)
    }
    // 图案连线奖
    result.winItem.win = result.dictAnalyseResult["win"];
    // 图案最终价值
    result.winItem.fin_value = StringUtil.addTNumbers(result.winItem.win, result.winItem.winJackpot, result.winItem.openBoxCardWin);
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
 */
function reduceBalanceGold(config, winscore, win , winJackpot, openBoxCardWin, callback){
    log.info(config.userId + '下注:' + config.nBetSum + '赢:' + winscore + 'win:'+ win + 'winJackpot:' + winJackpot + 'openBoxCardWin:' + openBoxCardWin);
    if (winscore > 0) { // 赢
        CacheUtil.getGamblingBalanceGold().then(nGamblingBalanceGold =>{
            if (nGamblingBalanceGold < win) {  // 系统库存足够，减少系统库存
                CacheUtil.DecrSysBalanceGold(winscore).then(r1 =>{
                    CacheUtil.DecrJackpot(winJackpot).then(r2 =>{
                        CacheUtil.playGameWinscore(config.userId, winscore).then(r3 =>{
                            callback(1)
                        })
                    });
                });
            } else { // 减少用户库存
                CacheUtil.DecrGamblingBalanceGold(winscore).then(r =>{
                    callback(1)
                });
            }
        })
    } else {  // 输
        CacheUtil.playGameWinscore(config.userId, -config.nBetSum).then(r =>{
            callback(1)
        });
    }
}

function replaceCards(config, nHandCards, user, dictAnalyseResult){
    if(config.gameName === 'BlueDiamond'){
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


function grandWheelOpenBox(dictAnalyseResult, nHandCards, openBoxCard, nBetSum){
    let openBoxCardWin = 0;

    let bonusNum = StringUtil.list_one_count(openBoxCard, nHandCards);
    if (bonusNum === 1) {
        let resultList = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38];
        let mul = StringUtil.RandomNumForList(resultList);
        for (let i = 0; i < nHandCards.length; i++) {
            if (nHandCards[i] === openBoxCard) {
                let data = {
                    mul: mul,
                    count: 1,
                    list: resultList,
                };
                dictAnalyseResult["bonusList"][i] = data;
                dictAnalyseResult["nWinCards"][i] = true;
            }
        }
        openBoxCardWin += mul * nBetSum;
    } else if (bonusNum === 2) {
        let resultList = [8, 10, 12, 15, 16, 18, 19, 20, 25, 28, 30, 36, 38, 40, 48, 50];
        let mul = StringUtil.RandomNumForList(resultList);
        let mul1 = StringUtil.RandomNumBoth(0, mul - 1);
        let mul2 = mul - mul1;
        let idx = 0;
        for (let i = 0; i < nHandCards.length; i++) {
            if (nHandCards[i] === openBoxCard) {
                let data = {};
                if (idx === 0) {
                    data = {
                        mul: mul1,
                        count: 2,
                        list: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38],
                    };
                    idx++;
                } else {
                    data = {
                        mul: mul2,
                        count: 2,
                        list: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38],
                    };
                }
                dictAnalyseResult["bonusList"][i] = data;
                dictAnalyseResult["nWinCards"][i] = true;
            }
        }
        openBoxCardWin += mul * nBetSum;
    } else if (bonusNum === 3) {
        dictAnalyseResult["nWinCards"] = [true, true, true];
        let resultList = [20, 888, 25, 188, 58, 1000, 500, 35, 70, 30, 138, 55, 288, 60, 80, 50, 38, 88, 75, 68, 18, 28, 15];
        let mul = StringUtil.RandomNumForList(resultList);
        dictAnalyseResult["getOpenBox"] = {
            bFlag: true,
            mul: mul,
            list: resultList,
            win: mul * nBetSum,
        };
        openBoxCardWin += mul * nBetSum;
    }
    return openBoxCardWin;
}



function tigerFullScreen(dictAnalyseResult, nGameLines) {
    // 全屏奖乘10倍
    const nWinLines = dictAnalyseResult["nWinLines"];
    if(nWinLines.length === nGameLines.length){
        for (let i in dictAnalyseResult["nWinDetail"]) {
            dictAnalyseResult["nWinDetail"][i] *= 10;
        }
        dictAnalyseResult["win"] *= 10;
        dictAnalyseResult["isAllWin"] = true;
        dictAnalyseResult["nMultiple"] *= 10;
    }
}





