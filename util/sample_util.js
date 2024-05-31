const CacheUtil =  require("../util/cache_util");
const StringUtil =  require("../util/string_util");
const LABA = require("./laba");
const analyse_result = require("./lottery_analyse_result");
const log = require('../CClass/class/loginfo').getInstand
const gameDao = require('../util/dao/gameDao')


exports.init = function (gameName, gameId){
    CacheUtil.getGameConfig(gameName, gameId).then(gameConfig =>{
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
                // 熊
                map = jungledelight(config);
                break;
            case 263:
                // 大象
                map = ganeshagold(config);
                break;
            case 285:
                // 公牛
                map = BuffaloKing(config);
                break;
            case 286:
                // 挖矿
                map = DigDigDigger(config);
                break;
            case 283:
                // 足球
                map = UltimateStriker(config);
                break;
            default:
                break;
        }
        // CacheUtil.setHandCards(gameId, JSON.stringify(Array.from(map.entries())))
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
async function diamondSample(config) {
    let map = new Map();
    let num = 0;

    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据

    const originalArray = [...config.cards];
    const reversedArray = config.cards.reverse();
    const twoDimensionalArray = [originalArray, reversedArray];
    for (const i in twoDimensionalArray) {
        const cards = twoDimensionalArray[i];
        //
        let combinations = outputAllNCardCombinations(cards, 3);
        combinations = StringUtil.shuffleArray(combinations)
        let len = combinations.length;
        for (let item in combinations) {
            const nHandCards = combinations[item];

            let result = {}
            result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
            LABA.Diamond_Single(nHandCards, config.cards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nBetSum, config.cardsNumber, config.freeCards, config.freeTimes, result);
            const mul = result.dictAnalyseResult['nMultiple'];
            let free = 0;
            let jackpot = 0;
            let openBox = 0;
            if (nHandCards.includes(config.freeCards[0])) {
                free = 1;
            }
            if (nHandCards.includes(config.jackpotCard)) {
                jackpot = 1;
            }
            if (nHandCards.includes(config.openBoxCard)) {
                openBox = 1;
            }

            // 将数据添加到批量数据数组中
            batchData.push({nHandCards, mul, free, jackpot, openBox});
            --len;
            // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
            if (batchData.length % batchSize === 0 || len === 0) {
                await gameDao.insertBatchCards(batchData, config.gameId);
                // 清空批量数据数组
                batchData = [];
            }
            result = {};
        }
    }
    console.log('图案初始化完毕')
    return map;
}




// 轮子样本
async function GrandWheelSample(config) {
    let num = 0;
    let map = new Map();
    let mul = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据

    const originalArray = [...config.cards];
    const reversedArray = config.cards.reverse();
    const twoDimensionalArray = [originalArray, reversedArray];
    for (const i in twoDimensionalArray) {
        const cards = twoDimensionalArray[i];
        //
        let combinations = outputAllNCardCombinations(cards, 3);
        combinations = StringUtil.shuffleArray(combinations)
        let cardsLen = combinations.length;

        for (let item in combinations) {
            const nHandCards = combinations[item];

            const result = {}
            result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);

            const len = nHandCards.filter(card => card === config.openBoxCard).length
            let free = 0;
            let jackpot = 0;
            let openBox = 0;
            if (nHandCards.includes(config.freeCards[0])) {
                free = 1;
            }
            if (nHandCards.includes(config.jackpotCard)) {
                jackpot = 1;
            }
            if (nHandCards.includes(config.openBoxCard)) {
                openBox = 1;
            }

            if (len === 1) {
                const a = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38];
                for (let item in a) {
                    mul = a[item]
                    // 将数据添加到批量数据数组中
                    batchData.push({nHandCards, mul, free, jackpot, openBox});
                }
            } else if (len === 2) {
                const b = [8, 10, 12, 15, 16, 18, 19, 20, 25, 28, 30, 36, 38, 40, 48, 50];
                for (let item in b) {
                    mul = b[item]
                    // 将数据添加到批量数据数组中
                    batchData.push({nHandCards, mul, free, jackpot, openBox});
                }
            } else if (len === 3) {
                const c = [20, 888, 25, 188, 58, 1000, 500, 35, 70, 30, 138, 55, 288, 60, 80, 50, 38, 88, 75, 68, 18, 28, 15];
                for (let item in c) {
                    mul = c[item]
                    // 将数据添加到批量数据数组中
                    batchData.push({nHandCards, mul, free, jackpot, openBox});
                }
            } else {
                LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);
                mul = result.dictAnalyseResult['nMultiple'];
                // 将数据添加到批量数据数组中
                batchData.push({nHandCards, mul, free, jackpot, openBox});
            }
            --cardsLen;
            // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
            if (cardsLen === 0) {
                await gameDao.insertBatchCards(batchData, config.gameId);
                // 清空批量数据数组
                batchData = [];
            }
        }
    }
    console.log('图案初始化完毕')
    return map;
}

async function freeSpin(config) {
    let map = new Map();
    let num = 0;

    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据
    let insertLen = 0; // 已插入长度
    for (let i = 0; i < config.cards.length; i++) {
        const column1 = parseInt(config.cards[i]);
        const nHandCards = [column1]

        const result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);
        let mul = result.dictAnalyseResult['nMultiple'];

        let free = 0;
        let jackpot = 0;
        let openBox = 0;
        if (mul === 0 && config.freeCards.includes(nHandCards[0])) {
            free = 1;
        }
        if (mul === 0 && config.jackpotCard === nHandCards[0]) {
            jackpot = 1;
        }
        // 将数据添加到批量数据数组中
        batchData.push({nHandCards, mul, free, jackpot, openBox});
        // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
        await gameDao.insertBatchCards(batchData, config.gameId);
        insertLen += batchData.length;
        // 清空批量数据数组
        batchData = [];
    }
    console.log('图案初始化完毕')
    return map;
}

async function tiger(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据

    const originalArray = [...config.cards];
    const reversedArray = config.cards.reverse();
    const twoDimensionalArray = [originalArray, reversedArray];
    for (const i in twoDimensionalArray) {
        const cards = twoDimensionalArray[i];
        //
        let combinations = outputAllNCardCombinations(cards, 9);
        combinations = StringUtil.shuffleArray(combinations)
        let len = combinations.length;
        for (let item in combinations) {
            const nHandCards = combinations[item];

            let result = {}
            result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
            LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);
            // 老虎全屏
            LABA.tigerFullScreen(result.dictAnalyseResult, config.nGameLines);

            const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'], config.nGameLines.length, 1);
            let free = 0;
            let jackpot = 0;
            let openBox = 0;
            if (nHandCards.includes(config.freeCards[0])) {
                free = 1;
            }
            if (nHandCards.includes(config.jackpotCard)) {
                jackpot = 1;
            }
            if (nHandCards.includes(config.openBoxCard)) {
                openBox = 1;
            }

            // 将数据添加到批量数据数组中
            batchData.push({nHandCards, mul, free, jackpot, openBox});
            --len;
            // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
            if (batchData.length % batchSize === 0 || len === 0) {
                await gameDao.insertBatchCards(batchData, config.gameId);
                // 清空批量数据数组
                batchData = [];
            }
            result = {};
        }
    }
    console.log('图案初始化完毕')
    return map;
}

async function jungledelight(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据

    const combinations = generateRandomHands(1000000, 15, 10);
    let len = combinations.length;
    for (let item in combinations) {
        const nHandCards = combinations[item];

        //免费牌每列只许出现一张
        let col1 = [nHandCards[0], nHandCards[5], nHandCards[10]];
        let col2 = [nHandCards[1], nHandCards[6], nHandCards[11]];
        let col3 = [nHandCards[2], nHandCards[7], nHandCards[12]];
        let col4 = [nHandCards[3], nHandCards[8], nHandCards[13]];
        let col5 = [nHandCards[4], nHandCards[9], nHandCards[14]];
        if (list_one_count(config.freeCards[0], col1) > 1 ||
            list_one_count(config.freeCards[0], col2) > 1 ||
            list_one_count(config.freeCards[0], col3) > 1 ||
            list_one_count(config.freeCards[0], col4) > 1 ||
            list_one_count(config.freeCards[0], col5) > 1) {
            len --;
            continue;
        }

        if (list_one_count(config.nGameMagicCardIndex, col1) > 0 ||
            list_one_count(config.nGameMagicCardIndex, col5) > 0) {
            len --;
            continue;
        }

        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);

        const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'], config.nGameLines.length, 1);
        let free = 0;
        let jackpot = 0;
        let openBox = 0;


        let fLen = nHandCards.filter(card => card === config.freeCards[0]).length
        if (fLen >= 3) {
            free = 1;
        }
        if (nHandCards.includes(config.jackpotCard)) {
            jackpot = 1;
        }
        if (nHandCards.includes(config.openBoxCard)) {
            openBox = 1;
        }

        // 将数据添加到批量数据数组中
        batchData.push({nHandCards, mul, free, jackpot, openBox});
        --len;
        // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
        if (batchData.length % batchSize === 0 || len === 0) {
            await gameDao.insertBatchCards(batchData, config.gameId);
            // 清空批量数据数组
            batchData = [];
        }
        result = {};
    }
    console.log('图案初始化完毕')
    return map;
}



async function BuffaloKing(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据
    let k = 0;

    const combinations = generateRandomHands(2000000, 24, 13);

    // combinations = StringUtil.shuffleArray(combinations)
    let len = combinations.length;
    for (let item in combinations) {
        const nHandCards = combinations[item];
        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(40);
        LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, 0, config.icon_mul, result, config.gameId);

          // 免费牌每列只许出现一张
          let col1 = [nHandCards[0], nHandCards[6], nHandCards[12], nHandCards[18]];
          // free符号仅出现在卷轴2,3,4,5,6
          if (list_one_count(config.freeCards, col1) > 0 ){
              --len;
              continue;
          }
          // wild符号仅出现在卷轴2,3,4,5,6
          if (list_one_count(config.nGameMagicCardIndex, col1) > 0){
              --len;
              continue;
          }

        const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'], 40, 1);
        let free = 0;
        let jackpot = 0;
        let openBox = 0;
        if (nHandCards.includes(config.freeCards[0])) {
            free = 1;
        }
        if (nHandCards.includes(config.jackpotCard)) {
            jackpot = 1;
        }

        const l = nHandCards.filter(card => card === config.freeCards[0]).length;
        if (l >= 3) {
            openBox = 1;
        }

        // 将数据添加到批量数据数组中
        batchData.push({nHandCards, mul, free, jackpot, openBox});
        --len;
        // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
        if (batchData.length % batchSize === 0 || len === 0) {
            log.info(k++)
            await gameDao.insertBatchCards(batchData, config.gameId);
            // 清空批量数据数组
            batchData = [];
        }
        result = {};
    }
    console.log('图案初始化完毕')
    return map;
}

async function ganeshagold(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据

    const originalArray = [...config.cards];
    const reversedArray = config.cards.reverse();
    const twoDimensionalArray = [originalArray, reversedArray];
   /* for (const i in twoDimensionalArray) {
        const cards = twoDimensionalArray[i];

        //
        let combinations = outputAllNCardCombinations(cards, 15);*/

        const combinations = generateRandomHands(1000000, 15, 10);

      /*  combinations = StringUtil.shuffleArray(combinations)*/
        let len = combinations.length;
        for (let item in combinations) {
            const nHandCards = combinations[item];
            let result = {}
            result.dictAnalyseResult = analyse_result.initResult(30);
            LABA.AnalyseColumnSolt(nHandCards, config.nGameMagicCardIndex, config.freeCards, config.freeTimes, config.nGameLineWinLowerLimitCardNumber, config.col_count, config.nBetSum, 0, config.icon_mul, result, config.gameId);

            // 免费牌每列只许出现一张
            let col1 = [nHandCards[0], nHandCards[5], nHandCards[10]];
            let col2 = [nHandCards[1], nHandCards[6], nHandCards[11]];
            let col3 = [nHandCards[2], nHandCards[7], nHandCards[12]];
            let col4 = [nHandCards[3], nHandCards[8], nHandCards[13]];
            let col5 = [nHandCards[4], nHandCards[9], nHandCards[14]];
            if (list_one_count(config.freeCards, col1) > 1 ||
                list_one_count(config.freeCards, col2) > 1 ||
                list_one_count(config.freeCards, col3) > 1 ||
                list_one_count(config.freeCards, col4) > 1 ||
                list_one_count(config.freeCards, col5) > 1) {
                --len;
                continue;
            }
            // wild符号仅出现在卷轴2，3，4
            if (list_one_count(config.nGameMagicCardIndex, col1) > 0 ||
                list_one_count(config.nGameMagicCardIndex, col2) > 1 ||
                list_one_count(config.nGameMagicCardIndex, col3) > 1 ||
                list_one_count(config.nGameMagicCardIndex, col4) > 1 ||
                list_one_count(config.nGameMagicCardIndex, col5) > 0) {
                --len;
                continue;
            }

            const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'], 30, 1);
            let free = 0;
            let jackpot = 0;
            let openBox = 0;
            if (nHandCards.includes(config.freeCards[0])) {
                free = 1;
            }
            if (nHandCards.includes(config.jackpotCard)) {
                jackpot = 1;
            }

            const l = nHandCards.filter(card => card === config.freeCards[0]).length;
            if (l >= 3) {
                openBox = 1;
            }

            // 将数据添加到批量数据数组中
            batchData.push({nHandCards, mul, free, jackpot, openBox});
            --len;
            // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
            if (batchData.length % batchSize === 0 || len === 0) {
                await gameDao.insertBatchCards(batchData, config.gameId);
                // 清空批量数据数组
                batchData = [];
            }
            result = {};
        }
    //}
    console.log('图案初始化完毕')
    return map;
}

async function UltimateStriker(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据


    const combinations = generateRandomHands(500000, 36, 13);
    let len = combinations.length;
    for (let item in combinations) {
        let nHandCards = combinations[item];

        // 普通模式列不能出现万能牌
        let col1 = [nHandCards[0], nHandCards[6], nHandCards[12], nHandCards[18], nHandCards[24], nHandCards[30]];
        let col2 = [nHandCards[1], nHandCards[7], nHandCards[13], nHandCards[19], nHandCards[25], nHandCards[31]];
        let col3 = [nHandCards[2], nHandCards[8], nHandCards[14], nHandCards[20], nHandCards[26], nHandCards[32]];
        let col4 = [nHandCards[3], nHandCards[9], nHandCards[15], nHandCards[21], nHandCards[27], nHandCards[33]];
        let col5 = [nHandCards[4], nHandCards[10], nHandCards[16], nHandCards[22], nHandCards[28], nHandCards[34]];
        let col6 = [nHandCards[5], nHandCards[11], nHandCards[17], nHandCards[23], nHandCards[29], nHandCards[35]];
        const len1 = col1.filter(card => Number(card) === config.nGameMagicCardIndex).length
        const len2 = col2.filter(card => Number(card) === config.nGameMagicCardIndex).length
        const len3 = col3.filter(card => Number(card) === config.nGameMagicCardIndex).length
        const len4 = col4.filter(card => Number(card) === config.nGameMagicCardIndex).length
        const len5 = col5.filter(card => Number(card) === config.nGameMagicCardIndex).length
        const len6 = col6.filter(card => Number(card) === config.nGameMagicCardIndex).length
        if (len1 > 0 || len2 > 0 || len3 > 0 || len4 > 0 || len5 > 0 || len6 > 0) {
            len --;
            continue;
        }
        const l = nHandCards.filter(card => card === config.freeCards[0]).length
        if(l > 4){
            len --;
            continue;
        }

        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(20);
        result.nHandCards = [...nHandCards];
        LABA.footballCardsHandle(config, result, 1, false, 1);
        const mul = StringUtil.divNumbers(result.dictAnalyseResult["win"], 20, 1);

        let free = 0;
        let jackpot = 0;
        let openBox = 0;
        const fLen = nHandCards.filter(card => card === config.freeCards[0]).length
        if (fLen >= 4) {
            free = 1;
        }
        if (nHandCards.includes(config.jackpotCard)) {
            jackpot = 1;
        }
        const oLen = nHandCards.filter(card => card === config.nGameMagicCardIndex).length
        if(oLen >= 3){
            openBox = 1;
        }

        // 将数据添加到批量数据数组中
        batchData.push({nHandCards, mul, free, jackpot, openBox});
        --len;
        // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
        if (batchData.length % batchSize === 0 || len === 0) {
            await gameDao.insertBatchCards(batchData, config.gameId);
            // 清空批量数据数组
            batchData = [];
        }
        result = {};
    }
    console.log('图案初始化完毕')
    return map;
}

async function DigDigDigger(config) {
    let map = new Map();
    let num = 0;
    let batchSize = 10000; // 每次批量长度
    let batchData = []; // 每次批量数据


    const combinations = generateRandomHands(2000000, 15, 10);
    let len = combinations.length;
    for (let item in combinations) {
        const nHandCards = combinations[item];

        //万能牌每列只许出现一张
        let col1 = [nHandCards[0], nHandCards[5], nHandCards[10]];
        let col2 = [nHandCards[1], nHandCards[6], nHandCards[11]];
        let col3 = [nHandCards[2], nHandCards[7], nHandCards[12]];
        let col4 = [nHandCards[3], nHandCards[8], nHandCards[13]];
        let col5 = [nHandCards[4], nHandCards[9], nHandCards[14]];

        if (list_one_count(config.nGameMagicCardIndex, col1) > 0 ||
            list_one_count(config.nGameMagicCardIndex, col2) > 1 ||
            list_one_count(config.nGameMagicCardIndex, col3) > 1 ||
            list_one_count(config.nGameMagicCardIndex, col4) > 1 ||
            list_one_count(config.nGameMagicCardIndex, col5) > 1) {
            len --;
            continue;
        }

        let result = {}
        result.dictAnalyseResult = analyse_result.initResult(config.nGameLines.length);
        LABA.HandCardsAnalyse(nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, 0, config.freeCards, config.freeTimes, config, result);
        const mul = StringUtil.divNumbers(result.dictAnalyseResult['nMultiple'], config.nGameLines.length, 1);


        let free = 0;
        let jackpot = 0;
        let openBox = 0;
        if (nHandCards.includes(config.freeCards[0])) {
            free = 1;
        }
        if (nHandCards.includes(config.jackpotCard)) {
            jackpot = 1;
        }
        const oLen = nHandCards.filter(card => card === config.nGameMagicCardIndex).length
        if(oLen >= 3){
            openBox = 1;
        }



        // 将数据添加到批量数据数组中
        batchData.push({nHandCards, mul, free, jackpot, openBox});
        --len;
        // 当批量数据数组的长度达到 batchSize 时执行批量插入操作
        if (batchData.length % batchSize === 0 || len === 0) {
            await gameDao.insertBatchCards(batchData, config.gameId);
            // 清空批量数据数组
            batchData = [];
        }
        result = {};
    }
    console.log('图案初始化完毕')
    return map;
}

function getRandomSubarray(array, size) {
    // 洗牌算法，打乱数组元素顺序
    const shuffled = array.slice().sort(() => 0.5 - Math.random());
    if(array.length < size){
        return shuffled;
    }
    // 获取前 size 个元素作为结果
    return shuffled.slice(0, size);
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
function list_one_count(x, list) {
    //数组中指定值出现次数
    let count = 0;
    for (const i in list) {
        if (list[i] === x) {
            count++
        }
    }
    return count;
}



function getRandomCards(size) {
    return Math.floor(Math.random() * (size + 1)); // 生成 0 到 size 之间的随机整数
}

function generateRandomHands(numOfHands, handSize, size) {
    const hands = [];
    for (let i = 0; i < numOfHands; i++) {
        const hand = [];
        for (let j = 0; j < handSize; j++) {
            hand.push(getRandomCards(size));
        }
        hands.push(hand);
    }
    return hands;
}