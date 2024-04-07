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


exports.doLottery  = function doLottery(socket, nBetSum, gameInfo){
    const userId = socket.userId;
    if(!gameInfo.userList[userId]){
        socket.emit('lotteryResult', {ResultCode: -1});
        return;
    }

    dao.searchUserById(userId, (code, row) =>{
        if(!code){
            return;
        }
        const firstRecharge =  row.firstRecharge
        const currScore =  row.score
        const currBankScore =  row.bankScore
        const totalRecharge =  row.totalRecharge
        const vipLevel =  row.housecard
        // 新手保护逻辑
        newhandProtectControl(userId, vipLevel > 0 , totalRecharge, (rebateRatio, newHandFlag, currUserGoldPool)=>{
            log.info(userId+ '数据库金币:' + currScore + '游戏账户金币:'+ gameInfo.userList[userId]._score +'下注:' + nBetSum + '返奖率:' + rebateRatio + '是否新手:' + newHandFlag + '当前用户金币池:' + currUserGoldPool + 'currScore:' + currScore + 'currBankScore:' +currBankScore + 'vipLevel' + vipLevel)

            // 获取总奖池
            redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                // 获取奖池配置
                CacheUtil.getJackpotConfig().then(jackpotConfig =>{
                    // 游戏奖池
                    let gameJackpot = parseInt(jackpot ? jackpot * (jackpotConfig.jackpot_ratio.game / 100) : 0);
                    // 获取游戏配置
                    CacheUtil.getGameConfig(gameInfo.gameName, gameInfo.gameId).then(gameConfig =>{
                        // 获取玩家赢分差
                        CacheUtil.getPlayGameWinscore(userId).then(historyWinScore =>{
                            // 获取历史下注记录
                            CacheUtil.getPlayGameBetRecord(userId).then(cf =>{
                                let totalBet = !cf || !cf.totalBet ? 0 : Number(cf.totalBet);
                                let totalBackBet = !cf || !cf.totalBackBet ? 0 : Number(cf.totalBackBet);
                                // 判断玩家是否破产
                                CacheUtil.isBankrupt(currScore, currBankScore, (bankrupt, bustBonus , Bust_times) =>{
                                    try {
                                        // 摇奖前参数获取
                                        const config = preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, rebateRatio, currUserGoldPool, historyWinScore, bankrupt, firstRecharge, totalBet, totalBackBet)
                                        // 摇奖
                                        const result = Lottery(config, gameInfo, newHandFlag);
                                        log.info('摇奖结果' + userId + JSON.stringify(result));

                                        if (result.code < 1) {
                                            socket.emit('lotteryResult', {ResultCode: result.code});
                                        } else {
                                            // 增加用户玩游戏次数
                                            CacheUtil.addPlayGameCount(userId);
                                            // 摇奖成功
                                            socket.emit('lotteryResult', {
                                                ResultCode: result.code,
                                                ResultData: {
                                                    userscore: result.userscore,
                                                    winscore: result.winscore,
                                                    viewarray: result.viewarray,
                                                    winfreeCount: result.winfreeCount,
                                                    freeCount: result.freeCount,
                                                    score_pool: result.score_pool
                                                }
                                            });
                                            winPopFirstRecharge(config, result, gameInfo).then();
                                        }
                                    }catch (e) {
                                        log.err(userId + 'doLottery' + e.stack);
                                        socket.emit('lotteryResult', {ResultCode: -1});
                                    }
                                })
                            })
                        })
                    });
                })
            });

        })

    })

}

// 是否需要弹首充商品
async function winPopFirstRecharge(config, result, gameInfo) {
    dao.searchFirstRecharge(config.userId, row =>{
        CacheUtil.getNewhandProtectConfig().then(cf =>{
            try {
                if(!row) return;
                const winScorePopFirstRecharge = row.winScorePopFirstRecharge;
                const winJackpot = result.viewarray.getJackpot['bFlag'];
                const currTotalWinScore = StringUtil.addNumbers(config.historyWinScore, result.winscore);
                if(row.firstRecharge === null || row.firstRecharge === undefined || row.firstRecharge === 1){
                    return;
                }

                const protectScore = cf.protectScore;
                log.info(config.userId + '是否需要弹首充礼包判断,当前赢分差:' + currTotalWinScore + '新手保护金币:' + protectScore + 'winJackpot:' + winJackpot )
                if (winJackpot) {
                    CommonEven.pushFirstRecharge(gameInfo.userList[config.userId]._socket)
                }else if(currTotalWinScore > 0 && StringUtil.compareNumbers(protectScore, currTotalWinScore) &&  winScorePopFirstRecharge === 0){
                    // 只弹一次
                    dao.updateWinScorePopFirstRecharge(config.userId, ret =>{
                        if(ret){
                            CommonEven.pushFirstRecharge(gameInfo.userList[config.userId]._socket)
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
function newhandProtectControl (userId, isVip, totalRecharge, callback) {
    CacheUtil.getScoreConfig().then(async (conf) => {
        const score_amount_ratio = conf.score_amount_ratio;
        let currUserGoldPool = -1; // 默认当前用户金币池无限制
        if (isVip) {
            // VIP用户个人奖池=充值金额*金币比例
            currUserGoldPool = totalRecharge * score_amount_ratio;
        }

        CacheUtil.getNewhandProtectConfig().then(newHandConfig => {
            const rebateRatio = newHandConfig.rebateRatio;
            const protectScore = newHandConfig.protectScore;
            const recharge = newHandConfig.recharge;


            CacheUtil.getPlayGameWinscore(userId).then(winscore => {
               log.info(userId +'新手保护判断 总充值:' + totalRecharge + '跳出新手保护需要充值:' + recharge + '跳出新手保护需要赢分:' + protectScore + '新手赢分:' + winscore);
                if (totalRecharge > 0  && StringUtil.compareNumbers(recharge, totalRecharge) && StringUtil.compareNumbers(protectScore, winscore)) {  // 充值大于新手保护金额且 赢的金币大于新手保护金币
                    // 跳过新手保护区
                    // 获取自动黑白名单-根据赢分区间获得返奖率
                    CacheUtil.getBlackWhiteListConfig().then(bwConfig => {
                        const normalScore = bwConfig.normal[bwConfig.normal.length - 1].winScoreSection;
                        const normalRebateRatio = bwConfig.normal[bwConfig.normal.length - 1].rebateRatio;

                        let ratio = 0;
                        if (winscore > normalScore) {
                            // 排序
                            for (const item in bwConfig.black) {
                                const score = bwConfig.black[item].winScoreSection;
                                if (winscore > score) {
                                    ratio = bwConfig.black[item].rebateRatio
                                }
                            }
                        } else {
                            // 排序
                            for (const item in bwConfig.white) {
                                const score = bwConfig.white[item].winScoreSection;
                                if (winscore > score) {
                                    ratio = bwConfig.black[item].rebateRatio
                                }
                                if (winscore < normalScore && winscore > score) {
                                    ratio = normalRebateRatio;
                                }
                            }
                        }
                       log.info(userId + '跳过新手保护区,返奖率:' + ratio)
                        callback(ratio, TypeEum.NewHandFlag.old, currUserGoldPool)
                    })
                } else {
                    // 新手返奖率
                    callback(rebateRatio, TypeEum.NewHandFlag.new, currUserGoldPool)
                }
            })

        })
    })
}


// 摇奖前
function preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig, rebateRatio, currUserGoldPool, historyWinScore, bankrupt, firstRecharge,totalBet , totalBackBet){
    const config = {};


    config.totalBet = totalBet;
    config.totalBackBet = totalBackBet;

    config.firstRecharge = firstRecharge;
    config.bankrupt = bankrupt;
    config.historyWinScore =  historyWinScore ? historyWinScore : 0;
    config.rebateRatio = rebateRatio;
    config.currUserGoldPool= currUserGoldPool;
    config.gameType = gameConfig.gameType;
    config.serverId = gameConfig.serverId;
    config.gameName = gameConfig.gameName;
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
function Lottery(config, gameInfo, newHandFlag) {
    // 下注非法
    if (config.nBetSum % config.nGameLines.length !== 0 && config.nBetSum === 0) {
        log.info(config.userId + "非法下注nBetSum:" + config.nBetSum+ 'nGameLines len:' + config.nGameLines.length);
        return {code: -1};
    }
    // 扣金币或者免费次数
    const lotteryResult = gameInfo.userList[config.userId].lottery(config.nBetSum);
    if (!lotteryResult) {
        log.info(config.userId + "金币数量不足nBetSum:" + config.nBetSum);
        // 破产了弹限时折扣界面
        if(config.bankrupt){
            log.info(config.userId + "破产了弹限时折扣界面:" + config.nBetSum);
            return {code: -3};
        }
        // 输光,没购买首充弹首充商城
        if(!config.firstRecharge){
            log.info(config.userId + "输光,没购买首充弹首充商城:" + config.nBetSum);
            return {code: -2};
        }
        return {code: -3};
    }
    //用户金币
    const score_before = gameInfo.userList[config.userId].getScore();
    //获取免费次数
    const sourceFreeCount = gameInfo.userList[config.userId].getFreeCount();

    const GamblingBalanceLevelBigWin = gameInfo.A.getGamblingBalanceLevelBigWin();
    // 水位
    const nGamblingWaterLevelGold = GamblingBalanceLevelBigWin.nGamblingWaterLevelGold;

    // 目标RTP
    const expectRTP = config.rebateRatio / 100;
    // 进入奖池的钱
    const addJackpot = config.nBetSum * parseInt(nGamblingWaterLevelGold) / 100;
    // 进入库存的钱
    const addBalance = config.nBetSum - addJackpot;
    // 增加库存和奖池
    redis_laba_win_pool.redis_win_pool_incrby(addJackpot);
    CacheUtil.IncrGamblingBalanceGold(addBalance);
    log.info("添加库存:" + addBalance +  "添加奖池:" + addJackpot);

    let nHandCards = [];
    let win = 0;
    let winJackpot = 0;
    let fin_value = 0;
    let currRtp = 0;
    let dictAnalyseResult = {};
    let openBoxCardWin = 0;
    let winFlag = false;


    // 生成图案，分析结果（结果不满意继续）
    while (true) {
        dictAnalyseResult = analyse_result.initResult(config.nBetSum);

        // 分析jackpot
        winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney, config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit, config, currRtp, expectRTP);

        // 生成图案
        nHandCards = LABA.createHandCards(config.cards, config.weight_two_array, config.col_count, config.line_count, config.cardsNumber, config.jackpotCard, config.iconTypeBind, winJackpot, config.blankCard);

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
            LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, winJackpot, GAME_COMBINATIONS_DIAMOND, dictAnalyseResult);
        } else if (config.gameType === TypeEum.GameType.laba_normal) {
            // 普通判断型
            LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, winJackpot, config.freeCards, config.freeTimes, dictAnalyseResult);
        } else if (config.gameType === TypeEum.GameType.laba_single) {
            LABA.HandCardsAnalyse_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, dictAnalyseResult, gameInfo, config);
        } else {
            log.err(config.userId + '不支持的游戏类型')
            return {code: -1};
        }

        if(winJackpot > 0){
            // jackpot图案某行中奖
            dictAnalyseResult["getJackpot"] = {
                bFlag: true,
                bVal: winJackpot,
                payJpIndex: config.payJpIndex
            };
        }

        // 每种游戏特殊玩法
        if (config.gameName === 'fortunetiger') {
            // 老虎全屏
            tigerFullScreen(dictAnalyseResult, config.nGameLines);
        }else if(config.gameName === 'GrandWheel'){
            openBoxCardWin = ddddd(dictAnalyseResult, nHandCards, config.openBoxCard, config.nBetSum)
        }

        // 图案连线奖
        win = dictAnalyseResult["win"];
        // 图案最终价值
        fin_value = StringUtil.addTNumbers(win, winJackpot, openBoxCardWin);

        // 中奖总金币大于等于线注 认为本次为赢
        winFlag = fin_value >= config.nBetSum;

        // 开了配牌器
        if (config.iconTypeBind && config.iconTypeBind.length > 0) {
            break;
        }

        // 非新手- (历史赢分差 + 本局赢分 > 当前用户金币池上限控制) 且 本局为赢的状态
        const currTotalWinScore = StringUtil.addNumbers(config.historyWinScore , fin_value);
        if (config.currUserGoldPool > - 1 && currTotalWinScore > config.currUserGoldPool && winFlag) {
            log.info(config.userId +'当前赢分差:' + currTotalWinScore + '当前用户最大金币池:' + 'nBetSum:' + config.nBetSum);
            continue;
        }

        // RTP控制
        // 如果超过摇奖总数超过target_rtp_start_position次，开始向期望RTP走
        const backBetRatio = config.totalBet ? (config.totalBackBet / config.totalBet) : 0;
        currRtp = Number(backBetRatio.toFixed(2));
        // 当前RTP大于目标RTP 而且 摇的结果是赢的
        if (currRtp > expectRTP && winFlag) {
            log.info('RTP控制 需要让用户输 currRtp:' + currRtp + 'expectRTP:' + expectRTP + 'fin_value:' + fin_value)
            continue;
        }

        // 当前RTP小于目标RTP 而且 摇的结果是输的
       /* if (source_rtp < expectRTP && !winFlag) {
            //log.info('RTP控制 需要让用户赢 source_rtp:' + source_rtp + 'expectRTP:' + expectRTP + 'fin_value:' + fin_value)
            continue;
        }*/
        break;
    }
    log.info('当前RTP:' + currRtp + '期望的RTP:' + expectRTP + '输赢:' + winFlag + '总下注:' + StringUtil.addNumbers(config.totalBet, config.nBetSum) + '总返奖:' + config.totalBackBet);

    // 总共赢的金币
    const winscore =  StringUtil.addTNumbers(dictAnalyseResult["win"], winJackpot, openBoxCardWin)
    if (winscore > 0) { // 赢
        if (GamblingBalanceLevelBigWin.nGamblingBalanceGold < win) {  // 系统库存足够，减少系统库存 用户奖池
            // gameInfo.A.subSysBalanceGold(winscore, winJackpot);
            redis_laba_win_pool.redis_win_pool_decrby(winJackpot);
            CacheUtil.DecrSysBalanceGold(winscore);
        } else {
            // 减少用户库存 用户奖池
            redis_laba_win_pool.redis_win_pool_decrby(winJackpot);
            CacheUtil.DecrGamblingBalanceGold(winscore);
            //gameInfo.A.subGamblingBalanceGold(winscore, winJackpot);
        }
        CacheUtil.playGameWinscore(config.userId, winscore);
    } else {  // 输
        CacheUtil.playGameWinscore(config.userId, -config.nBetSum);
    }


    // 结果处理
    const user = gameInfo.userList[config.userId];
    const freeCount = dictAnalyseResult["getFreeTime"]["nFreeTime"];
    const resultArray = analyse_result.build(dictAnalyseResult, config.gameName, nHandCards, config.userId, config.nBetSum, winscore, freeCount, GamblingBalanceLevelBigWin, user, config.sendMessage_mul);
    // 剩余免费次数
    const resFreeCount = user.getFreeCount();
    const score_current = user.getScore();
    // 日志记录
    lottery_record.record(gameInfo._Csocket, config.nGameLines.length, config.serverId, config.gameId, config.userId, config.nBetSum, winscore, score_before, score_current, freeCount, sourceFreeCount,
        resFreeCount, config.serverId, gameInfo.lotteryLogList, gameInfo.score_changeLogList, resultArray);
    // 摇奖次数统计
    lotteryTimes(config.userId ,config.nBetSum, fin_value, config.totalBet, config.totalBackBet);
    // 打印图案排列日志
    LABA.handCardLog(nHandCards, config.col_count, config.line_count, config.nBetSum, winscore, winJackpot, expectRTP);
    // 返回结果
    return analyse_result.lotteryReturn(score_current, winscore, freeCount, resFreeCount, dictAnalyseResult, 0);
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


function ddddd(dictAnalyseResult, nHandCards, openBoxCard, nBetSum){
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





