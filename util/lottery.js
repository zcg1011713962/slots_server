const redis_laba_win_pool = require("./redis_laba_win_pool");
const log = require("../CClass/class/loginfo").getInstand;
const CacheUtil =  require("../util/cache_util");

exports.doLottery  = function doLottery(socket, nBetSum, gameInfo){
    let self = this;

    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        CacheUtil.getJackpotConfig().then(jackpotConfig =>{
            // 游戏奖池
            let gameJackpot = parseInt(jackpot ? jackpot * (jackpotConfig.jackpot_ratio.game / 100) : 0);
            // 奖池划分比例
            const game_jackpot_ratio = jackpotConfig.game_jackpot_ratio;
            const grandJackpot =  Math.floor((gameJackpot * game_jackpot_ratio[0].ratio).toFixed(2));
            const majorJackpot = Math.floor((gameJackpot * game_jackpot_ratio[1].ratio).toFixed(2));
            const minorJackpot = Math.floor((gameJackpot * game_jackpot_ratio[2].ratio).toFixed(2));
            const miniJackpot = Math.floor((gameJackpot * game_jackpot_ratio[3].ratio).toFixed(2));

            CacheUtil.getGameConfig(gameInfo.gameName, gameInfo.serverId).then(gameConfig =>{
                try {
                    // 摇奖前参数获取
                    const config = self.preLottery(socket.userId, nBetSum, gameJackpot, gameConfig, jackpotConfig)
                    // 摇奖
                    const result = gameInfo.lottery(config);
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
                                score_pool: result.score_pool,
                                grand_jackpot: grandJackpot,
                                major_jackpot: majorJackpot,
                                minor_jackpot: minorJackpot,
                                mini_jackpot: miniJackpot,
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

