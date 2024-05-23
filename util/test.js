const analyse_result = require("./lottery_analyse_result");
const LABA = require("./laba");
const CacheUtil = require("./cache_util");

CacheUtil.getGameConfig('ganeshagold', 263).then(gameConfig => {
    const config = {}

    config.gameName = gameConfig.gameName;
    config.gameId = gameConfig.gameId;
    config.nBetSum = 5;

    // 多线情况下 每条线下注的金额
    let len = gameConfig.nGameLines.length;
    const nBetItem = config.nBetSum / len;
    config.nBetList = [];
    for (let i = 0; i < len; i++) {
        config.nBetList.push(nBetItem)
    }

    config.nGameLines = gameConfig.nGameLines;

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
    config.jackpotCard = -1;
    // 万能图案
    config.nGameMagicCardIndex = -1;
    // 开宝箱牌
    config.openBoxCard = -1;
    for (let i = 0; i < gameConfig.iconInfos.length; i++) {
        if (gameConfig.iconInfos[i].icon_s_type_WILD) {
            config.nGameMagicCardIndex = gameConfig.iconInfos[i].icon_type;
        }
        if (gameConfig.iconInfos[i].icon_s_type_free) {
            config.freeCards.push(gameConfig.iconInfos[i].icon_type)
            config.freeTimes.set(gameConfig.iconInfos[i].icon_type, gameConfig.iconInfos[i].free_times)
        }
        if (gameConfig.iconInfos[i].icon_s_type_jackpot) {
            config.jackpotCard = gameConfig.iconInfos[i].icon_type;
        }
        if (gameConfig.iconInfos[i].icon_s_type_openBoxCard) {
            config.openBoxCard = gameConfig.iconInfos[i].icon_type;
        }
    }


    let result = {}
    result.dictAnalyseResult = analyse_result.initResult(40);
    //const nHandCards = [5,4,2,6,1,5,0,9,4,2,4,9,5,6,3]
    const nHandCards = [7,3,3,9,7,0,7,0,3,4,3,0,3,0,0]
    //const nHandCards =
    LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, 0, config.icon_mul, result, config.gameId);

    console.log(result)

})
