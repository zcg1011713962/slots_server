const CacheUtil =  require("../util/cache_util");
const StringUtil =  require("../util/string_util");
const LABA = require("./laba");
const analyse_result = require("./lottery_analyse_result");


exports.init = function (gameName, gameId){
    CacheUtil.getGameConfig(gameName, gameId).then(gameConfig =>{
        const config = {}
        config.nBetSum = 1;

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
        let map = new Map();
        if(gameId === 288){
            map = diamondSample(config);
        }
        CacheUtil.setHandCards(gameId, JSON.stringify(Array.from(map.entries())))
    })

  /*  const m = new Map();
    m.set([60], [500,500,1000,3000,2500,2000,500])
    m.set([60,80], [500,500,1000,3000,2500,2000,500])
    m.set([80,90], [500,500,1000,3000,2500,2000,500])
    m.set([90,100], [500,500,1000,3000,2500,2000,500])
    m.set([100], [500,500,1000,3000,2500,0,0])
    CacheUtil.setControlAward(JSON.stringify(Array.from(m.entries())))*/

}

// 钻石样本
function diamondSample(config){
    let map = new Map();
    for(let i = 0; i < config.cards.length; i++){
        const column1  = parseInt(config.cards[i]);
        for(let j = 0; j < config.cards.length; j++){
            const column2  = parseInt(config.cards[j]);
            for(let k = 0; k < config.cards.length; k++){
                const column3 = parseInt(config.cards[k]);
                const nHandCards = [column1, column2, column3]

                const result = {}
                result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
                LABA.Diamond_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, result);

                result.dictAnalyseResult.nHandCards = nHandCards;
                const mul = result.dictAnalyseResult['mul'];
                StringUtil.appendValue(map, mul, result.dictAnalyseResult["nHandCards"])
            }
        }
    }
    return map;
}