const CacheUtil =  require("../util/cache_util");
const StringUtil =  require("../util/string_util");
const LABA = require("./laba");
const analyse_result = require("./lottery_analyse_result");


exports.init = function (gameName, gameId){
    CacheUtil.getGameConfig(gameName, gameId).then(gameConfig =>{
        const config = {}

        config.gameName = gameConfig.gameName;
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
        switch(gameId){
            case 288:
                // 钻石
                map = diamondSample(config);
                break;
            case 287:
                // 轮子
                map = GrandWheelSample(config);
                break;
            case 229:
                // 转盘
                map = freeSpin(config);
                break;
            case 268:
                // 老虎
                map = tiger(config);
                break;
            case 272:
                // 老虎
                map = jungledelight(config);
                break;
            case 263:
                // 大象
                map = ganeshagold(config);
                break;
            default:
                break;
        }
        CacheUtil.setHandCards(gameId, JSON.stringify(Array.from(map.entries())))
    })
    // RTP对应的倍数区间权重
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
    let num = 0;
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
                const mul = result.dictAnalyseResult['nMultiple'];
                const handCards =  result.dictAnalyseResult["nHandCards"];
                handCards.unshift(num ++)
                StringUtil.appendValue(map, mul, handCards, config)
            }
        }
    }
    return map;
}




// 轮子样本
function GrandWheelSample(config){
    let num = 0;
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

                const len = nHandCards.filter(card => card === config.openBoxCard).length
                if(len === 1){
                    const a = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38];
                    for(let item in a){
                        const nHandCard = [...nHandCards];
                        nHandCard.unshift(num ++)
                        StringUtil.appendValue(map, parseInt(a[item]), nHandCard, config)
                    }
                }else if(len === 2){
                    const b = [8, 10, 12, 15, 16, 18, 19, 20, 25, 28, 30, 36, 38, 40, 48, 50];
                    for(let item in b){
                        const nHandCard = [...nHandCards];
                        nHandCard.unshift(num ++)
                        StringUtil.appendValue(map, parseInt(b[item]), nHandCard, config)
                    }
                }else if(len === 3){
                    const c = [20, 888, 25, 188, 58, 1000, 500, 35, 70, 30, 138, 55, 288, 60, 80, 50, 38, 88, 75, 68, 18, 28, 15];
                    for(let item in c){
                        const nHandCard = [...nHandCards];
                        nHandCard.unshift(num ++)
                        StringUtil.appendValue(map, parseInt(c[item]), nHandCard, config)
                    }
                }else{
                    LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);
                    const mul = result.dictAnalyseResult['nMultiple'];
                    nHandCards.unshift(num ++)
                    StringUtil.appendValue(map, mul, nHandCards, config)
                }

            }
        }
    }
    return map;
}

function freeSpin(config){
    let num = 0;
    let map = new Map();
    for(let i = 0; i < config.cards.length; i++){
        const column1  = parseInt(config.cards[i]);
        const nHandCards = [column1]

        const result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);

        const mul = result.dictAnalyseResult['nMultiple'];
        nHandCards.unshift(num ++)
        StringUtil.appendValue(map, mul, nHandCards, config)
    }
    return map;
}

function tiger(config){
    let map = new Map();
    let num = 0;

    const originalArray = [...config.cards];
    const reversedArray = config.cards.reverse();
    const twoDimensionalArray = [originalArray, reversedArray];
    for(const i in twoDimensionalArray){
        const cards  = twoDimensionalArray[i];
        //
        let combinations = outputAllNCardCombinations(cards, 9);
        combinations = StringUtil.shuffleArray(combinations)

        for(let item in combinations){
            const nHandCards = combinations[item];

            let result = {}
            result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
            LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes,config,  result);
            // 老虎全屏
            LABA.tigerFullScreen(result.dictAnalyseResult, config.nGameLines);

            const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'] , config.nGameLines.length, 1);

            nHandCards.unshift(num ++)
            StringUtil.appendValue(map, mul, nHandCards, config)
            result = {};
        }
    }
    return map;
}

function jungledelight(config){
    let map = new Map();
    let num = 0;
    // 测试
    const combinations = outputAllNCardCombinations(config.cards, 15);
    for(let item in combinations){
        const nHandCards = combinations[item];

        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes,config,  result);
        const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'] , config.nGameLines.length, 1);
        nHandCards.unshift(num ++)
        StringUtil.appendValue(map, mul, nHandCards, config)
        result = {};
    }
    return map;
}

function ganeshagold(config){
    let map = new Map();
    let num = 0;
    // 测试
    const combinations = outputAllNCardCombinations(config.cards, 15);
    for(let item in combinations){
        const nHandCards = combinations[item];

        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);

        LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, 0, config.icon_mul, result);

        const mul = result.dictAnalyseResult['nMultiple'];
        console.log(num + '倍数' + mul)
        nHandCards.unshift(num ++)
        StringUtil.appendValue(map, mul, nHandCards, config)
        result = {};
    }
    return map;
}

// 生成所有包含n张牌的组合
function generatenCardCombinations(n, cards, index, combination, combinations) {
    // 如果当前组合已经包含了n个元素，则将其添加到结果数组中
    if (combination.length === n) {
        combinations.push([...combination]);
        return;
    }

    // 从当前索引开始遍历所有牌，递归生成组合
    for (let i = index; i < cards.length; i++) {
        combination.push(cards[i]);
        generatenCardCombinations(n, cards, i, combination, combinations);
        combination.pop(); // 回溯，移出当前牌，尝试下一个牌
    }
}

// 生成并输出所有包含n张牌的组合
function outputAllNCardCombinations(cards, n) {
    const combinations = [];
    generatenCardCombinations(n, cards, 0, [], combinations);
    return combinations;
}
