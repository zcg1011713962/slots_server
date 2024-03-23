const redis_laba_win_pool = require("./redis_laba_win_pool");
const log = require("../CClass/class/loginfo").getInstand;
const CacheUtil =  require("../util/cache_util");
const analyse_result = require("./lottery_analyse_result");
const LABA = require("./laba");
const lottery_record = require("./lottery_record");
const TypeEum = require('../util/enum/type');

exports.doLottery  = function doLottery(socket, nBetSum, gameInfo){
    let self = this;

    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        CacheUtil.getJackpotConfig().then(jackpotConfig =>{
            // 游戏奖池
            let gameJackpot = parseInt(jackpot ? jackpot * (jackpotConfig.jackpot_ratio.game / 100) : 0);

            CacheUtil.getGameConfig(gameInfo.gameName, gameInfo.serverId).then(gameConfig =>{
                try {
                    // 摇奖前参数获取
                    const config = self.preLottery(socket.userId, nBetSum, gameJackpot, gameConfig, jackpotConfig)
                    // 摇奖
                    //const result = gameInfo.lottery(config);
                    const result = self.Lottery(config, gameInfo);

                    log.info('摇奖结果' + socket.userId + JSON.stringify(result));

                    if (result.code < 1) {
                        socket.emit('lotteryResult', {ResultCode: result.code});
                    } else {
                        // 增加用户玩游戏次数
                        CacheUtil.addPlayGameCount(socket.userId);
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
                    }
                }catch (e) {
                    log.err(socket.userId + 'doLottery' + e);
                    socket.emit('lotteryResult', {ResultCode: -1});
                }
            });
        })
    });
}



exports.preLottery  = function preLottery(userId, nBetSum, gameJackpot, gameConfig, jackpotConfig){
    const config = {};

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
    }
    config.jackpotRatio = jackpotConfig.game_jackpot_ratio.map(item => item.ratio)
    // 奖池金币数组
    config.jackpotLevelMoney = jackpotConfig.jackpot_level.map(item => item.jackpot)
    // 奖池金币对应的概率
    config.jackpotLevelProb = jackpotConfig.jackpot_level.map(item => item.prop)
    // 下注数组
    config.betJackpotLevelBet = jackpotConfig.bet_jackpot_level.map(item => item.bet)
    // 下注数组对应的奖池
    config.betJackpotLevelIndex = jackpotConfig.bet_jackpot_level.map(item => item.jackpot_ratio_index)
    // 四种奖池对应的概率
    config.jackpotPayLevel = jackpotConfig.jackpot_pay_level;

    return config;
}



exports.Lottery  = function Lottery (config, gameInfo) {
    // 下注非法
    if (config.nBetSum %  config.nGameLines.length !== 0) {
        log.info("非法下注");
        return {code: -1};
    }
    // 扣金币或者免费次数
    const lotteryResult = gameInfo.userList[config.userId].lottery(config.nBetSum);
    if (!lotteryResult) {
        log.info(config.userId + "分数不够");
        return {code: -2};
    }
    //用户金币
    const score_before = gameInfo.userList[config.userId].getScore();
    //获取免费次数
    const sourceFreeCount = gameInfo.userList[config.userId].getFreeCount();

    const GamblingBalanceLevelBigWin = gameInfo.A.getGamblingBalanceLevelBigWin();
    // 水位
    const nGamblingWaterLevelGold = GamblingBalanceLevelBigWin.nGamblingWaterLevelGold;
    // 大奖幸运等级
    const nGamblingBigWinLevel = GamblingBalanceLevelBigWin.nGamblingBigWinLevel;
    // 大奖幸运概率
    const nGamblingBigWinLuck = GamblingBalanceLevelBigWin.nGamblingBigWinLuck;
    // 幸运大奖
    const is_luck = false;
    // 目标RTP
    const expectRTP = GamblingBalanceLevelBigWin.expectRTP;
    // 进入奖池的钱
    const addJackpot = config.nBetSum * parseInt(nGamblingWaterLevelGold) / 100;
    // 进入库存的钱
    const addBalance = config.nBetSum - addJackpot;
    // 增加库存和奖池
    gameInfo.A.addGamblingBalanceGold(addBalance, addJackpot);

    const target_rtp_start_position = 10;
    let nHandCards = [];
    let win = 0;
    let winJackpot = 0;
    let fin_value = 0;
    let source_rtp = 0;
    let dictAnalyseResult = {};
    let lotteryCount = 0;
    // 生成图案，分析结果（结果不满意继续）
    while(true){
        dictAnalyseResult = analyse_result.initResult(config.nBetSum);

        // 分析jackpot
        winJackpot = LABA.JackpotAnalyse(config.gameJackpot, config.nBetSum, config.jackpotRatio, config.jackpotLevelMoney , config.jackpotLevelProb, config.betJackpotLevelBet, config.betJackpotLevelIndex, config.jackpotPayLevel, config.iconTypeBind, config.jackpotCard, config.jackpotCardLowerLimit);

        // 生成图案
        nHandCards = LABA.createHandCards(config.cards, config.weight_two_array, config.col_count, config.line_count, config.cardsNumber, config.jackpotCard, config.iconTypeBind, winJackpot, config.blankCard);

        // 分析图案
        if(config.gameType === TypeEum.GameType.laba_sequence){
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
            LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, winJackpot, GAME_COMBINATIONS_DIAMOND, dictAnalyseResult);
        }else if(config.gameType === TypeEum.GameType.laba_normal){
            // 普通判断型
            LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, winJackpot, config.freeCards, config.freeTimes, dictAnalyseResult);
        }else if(config.gameType === TypeEum.GameType.laba_single){
            LABA.HandCardsAnalyse_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, dictAnalyseResult);
        }else{
            log.err('不支持的游戏类型')
            return {code: -1};
        }

        // 图案连线奖
        win =  dictAnalyseResult["win"];
        // 图案最终价值
        fin_value = win + winJackpot;

        // 开了配牌器
        if(config.iconTypeBind && config.iconTypeBind.length > 0 || win === 0){
            break;
        }
        // 库存上限控制
        if(GamblingBalanceLevelBigWin.nGamblingBalanceGold < win){
            log.info('库存上限控制', config.userId);
            if(++lotteryCount > 30){
                return {code: -1};
            }
            continue;
        }
        // RTP控制
        if(gameInfo.lotteryCount > target_rtp_start_position) {
            // 如果超过摇奖总数超过target_rtp_start_position次，开始向期望RTP走
            source_rtp = ((this.totalBackBet / this.totalBet) * 100) > 100 ? 100 : ((this.totalBackBet / this.totalBet) * 100).toFixed(2);
            // 当前RTP大于目标RTP 而且 摇的结果是赢的
            if (source_rtp > expectRTP && fin_value > 0) {
                log.info('需要让用户输 source_rtp:'+ source_rtp + 'expectRTP:'+ expectRTP + 'fin_value:'+ fin_value)
                continue;
            }
            // 当前RTP小于目标RTP 而且 摇的结果是输的
            if (source_rtp < expectRTP && fin_value < 1) {
                log.info('需要让用户赢 source_rtp:'+ source_rtp + 'expectRTP:'+ expectRTP + 'fin_value:' + fin_value)
                continue;
            }
        }
        break;
    }

    // 减少库存和奖池
    const winscore = parseInt(dictAnalyseResult["win"]) + winJackpot;
    if (winscore > 0) {
        gameInfo.A.subGamblingBalanceGold(winscore, winJackpot);
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
    gameInfo.lotteryTimes(lotteryResult, winscore, config.nBetSum, fin_value);
    // 打印图案排列日志
    LABA.handCardLog(nHandCards, config.col_count, config.line_count,config.nBetSum, winscore, winJackpot, expectRTP);
    // 返回结果
    return analyse_result.lotteryReturn(score_current, winscore, freeCount, resFreeCount, dictAnalyseResult, 0);
};

