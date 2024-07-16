const laba_config = require("./config/laba_config");
const StringUtil = require("./string_util");
const gameDao = require("./dao/gameDao");
const analyse_result = require("./lottery_analyse_result");
const log = require("../CClass/class/loginfo").getInstand;

module.exports.createHandCards = function (cards, weight_two_array, col_count, line_count, cardsNumber, jackpotCard, icon_type_bind, winJackpot, blankCard) {
    if(icon_type_bind && icon_type_bind.length > 0){
        // 如果开了配牌器
        log.info('配牌器开关:' + true + "牌:" + icon_type_bind);
        return icon_type_bind;
    }
    return getCard(cards, cardsNumber, weight_two_array, col_count, line_count, jackpotCard, winJackpot, blankCard);
};

module.exports.JackpotAnalyse = function (jackpot, nBetSum, jackpot_ratio, jackpot_level_money, jackpot_level_prob, bet_jackpot_level_bet, bet_jackpot_level_index, jackpot_pay_level, iconTypeBind, jackpotCard, jackpotCardLowerLimit, config) {
    if(jackpotCard === undefined || jackpotCard < 0 || (iconTypeBind.length > 0 && StringUtil.findElementCount(iconTypeBind, jackpotCard) < jackpotCardLowerLimit)){
        return 0;
    }

    let hitJackpot = false;
    if(iconTypeBind && iconTypeBind.length > 0 && StringUtil.findElementCount(iconTypeBind, jackpotCard) >= jackpotCardLowerLimit){
        hitJackpot = true;
    }

    try{
        const minJackpot = jackpot_level_money.reduce((min, current) => Math.min(min, current), Infinity);
        if(!hitJackpot && jackpot < minJackpot){
            log.info('当前奖池小于配置最低奖池直接跳过奖池，当前奖池:'+ jackpot + '最低配置:' + minJackpot)
            return 0;
        }
        // 中的概率
        let prop = 0;
        for(let i = 0;  i < jackpot_level_money.length; i++){
            if(jackpot_level_money[i] <= jackpot){
                prop = jackpot_level_prob[i];
            }
        }
        const num = Math.floor(Math.random() * 100);
        log.info('奖池概率:' + prop + '随机数:' + num)
        if(prop > num || hitJackpot){
            // 有中jackpot的机会
            // 判断下注对应的奖池种类
            let jIndex = 0;
            for(let i = 0;  i < bet_jackpot_level_bet.length; i++){
                if(bet_jackpot_level_bet[i] <= nBetSum){
                    jIndex = bet_jackpot_level_index[i];
                }
            }
            // 下注对应的奖池的概率数组
            const payProps = jackpot_pay_level[jIndex];

            log.info('奖池概率:' + prop + '奖池支付下标:' + jIndex + '下注对应的奖池的概率数组:' + payProps)

            // 从高级的奖池开始碰运气
            let payJpIndex = -1;
            for(let i = payProps.length - 1; i >= 0 ; i--){
                const payProp = payProps[i];
                if(payProp > 0){
                    const n = Math.floor(Math.random() * 100);
                    if(n < payProp){
                        // 碰中了
                        payJpIndex = i;
                        config.payJpIndex = payJpIndex;
                        log.info('碰中的奖池索引payJpIndex:'+ payJpIndex +'payProp:' + payProp + '随机数:' + n)
                        break;
                    }
                }
            }
            // 计算中了多少奖
            if(payJpIndex > -1){
                const n = Math.floor(Math.random() * 10);
                const JpRatio = jackpot_ratio[payJpIndex];
                const getJp = jackpot * (n / 10000);
                const jp = getJp > 0 ? getJp.toFixed(0) : 0
                log.info('用户通过概率计算，中了jackpot:' + jp + '奖池种类下标:' + payJpIndex)
                config.jackpotIndex = payJpIndex;
                return jp;
            }
        }
    }catch (e) {
        log.err(e);
    }
    return 0;
}


module.exports.HandCardsAnalyse = function (nHandCards, nGameLines, nGameCombinations, nGameMagicCardIndex, nGameLineWinLowerLimitCardNumber, nGameLineDirection, bGameLineRule, nBetList, jackpotCard, jp, freeCards, freeTimes, config, result) {
    //当前线数
    var nLineNum = 0;
    var nBetSum = 0;
    for (var i in nBetList) {
        nBetSum += nBetList[i]
    }

    // 遍历分析每条线
    for (var nl in nGameLines) {
        var nLine = nGameLines[nl];
        //# 如果该线有下注
        if (nBetList[nLineNum] > 0) {
            var temp = []; //存放此线的图案
            var nMultiple = 0;
            var nMultiple1 = 0;
            var nMultiple2 = 0;
            var dict = {};
            var dict1 = {};
            var dict2 = {};
            // console.log("nHandCards:",nHandCards);
            // console.log("nLine:",nLine);
            // 生成此条线的花色
            for (var il in nLine) {
                var i = nLine[il];
                temp.push(nHandCards[i - 1])
            }
            //# 判断是否是从左向右判断
            if (nGameLineDirection && (nGameLineDirection === laba_config.GAME_SLOT_LEFT_TO_RIGHT || nGameLineDirection === laba_config.GAME_SLOT_BOTH_WAY)) {
                //单条线分析
                dict1 = Sort(nLine, temp, nGameMagicCardIndex, nGameLineWinLowerLimitCardNumber, nGameCombinations, bGameLineRule);
                if (dict1["nNumber"] >= nGameLineWinLowerLimitCardNumber && dict1["nColor"] !== 99) {
                    let bFlag = true;
                    for (var n in dict1["nCardsIndex"]) {
                        if (dict1["nCardsIndex"][n] != nLine[n]) {
                            bFlag = false;
                        }
                    }
                    if (bFlag) {
                        //# 中奖倍数
                        nMultiple1 = nGameCombinations[dict1["nColor"]][dict1["nNumber"] - nGameLineWinLowerLimitCardNumber];
                        for (var n in dict1["nCardsIndex"]) {
                            dict1["nCardsIndex"][n] -= 1;
                        }
                    } else {
                        console.log("FALSE1")
                    }
                }
            }
            //# 判断是否是从右向左判断
            if (nGameLineDirection && (nGameLineDirection === laba_config.GAME_SLOT_RIGHT_TO_LEFT || nGameLineDirection === laba_config.GAME_SLOT_BOTH_WAY)) {
                //# DEBUG_MSG("--------------RIGHT TO LEFT--------------")
                //# 将线反向排序
                temp.reverse();
                nLine.reverse();
                //单条线分析
                dict2 = Sort(nLine, temp, nGameMagicCardIndex, nGameLineWinLowerLimitCardNumber, nGameCombinations, bGameLineRule);
                if (dict2["nNumber"] >= nGameLineWinLowerLimitCardNumber) {
                    let bFlag = true;
                    for (var n in dict2["nCardsIndex"]) {
                        if (dict2["nCardsIndex"][n] != nLine[n]) {
                            bFlag = false;
                        }
                    }
                    if (bFlag) {
                        //# 中奖倍数
                        nMultiple2 = nGameCombinations[dict2["nColor"]][dict2["nNumber"] - nGameLineWinLowerLimitCardNumber];
                        for (var n in dict2["nCardsIndex"]) {
                            dict2["nCardsIndex"][n] -= 1;
                        }
                    }
                }
            }
            //# 判断优先取大值还是取小值
            if (bGameLineRule) {
                if (nMultiple1 > nMultiple2) {
                    nMultiple = nMultiple1;
                    dict = dict1
                } else {
                    nMultiple = nMultiple2;
                    dict = dict2
                }
            } else {
                if (nMultiple1 > nMultiple2) {
                    nMultiple = nMultiple2;
                    dict = dict2
                } else {
                    nMultiple = nMultiple1;
                    dict = dict1
                }
            }

            // 只有一张牌直接返回图案索引 针对免费转盘需要nWinLines字段特殊牌展示
            if(nHandCards.length === 1 && jackpotCard === nHandCards[0] || freeCards.includes(nHandCards[0])){
                result.dictAnalyseResult["nWinLines"].push(nHandCards[0]);
            }

            // 普通图案某行中奖
            if(nMultiple > 0){
                // 设置中奖金额
                result.dictAnalyseResult["win"] += nMultiple * nBetList[nLineNum];
                result.dictAnalyseResult["nMultiple"] +=nMultiple;
                result.dictAnalyseResult["nWinDetail"].push(nMultiple * nBetList[nLineNum]);
                if(temp.length === 1){
                    // 只有一张牌直接返回图案索引
                    result.dictAnalyseResult["nWinLines"].push(nHandCards[0]);
                }else{
                    // nLineNum 对应nGameLines的索引
                    result.dictAnalyseResult["nWinLines"].push(nLineNum);
                }
                result.dictAnalyseResult["nWinLinesDetail"].push(dict["nCardsIndex"]);
                result.dictAnalyseResult["nWinCardsDetail"].push(temp);
                for (const li in dict["nCardsIndex"]) {
                    const i = dict["nCardsIndex"][li];
                    result.dictAnalyseResult["nWinCards"][i] = true;
                }
            }
        }
        nLineNum += 1
    }
    // 获取免费次数
    if(config.gameId === 286){ // 挖矿
        const len = nHandCards.filter(card => card === config.freeCards[0]).length
        if(len >= 3){
            result.dictAnalyseResult["getFreeTime"]["bFlag"] = true;
            result.dictAnalyseResult["getFreeTime"]["nFreeTime"] = 10;
        }
    }else if(config.gameId === 272){ // 浣熊
        // 浣熊特殊模式计算免费
    }else{
        if (freeCards && freeCards.length > 0 ) {
            result.dictAnalyseResult["getFreeTime"] = FreeTimeAnalyse(nHandCards, freeCards, freeTimes);
        }
    }

    result.dictAnalyseResult["nHandCards"]  = nHandCards;
    return result.dictAnalyseResult
};





FreeTimeAnalyse = function (nHandCards, freeCards, freeTimes) {
    //免费次数
    const dictResult = {
        bFlag: false,
        nFreeTime: 0,
        nIndex: 0
    };
    let nCount = 0;
    let nIndex = []
    let nFreeTime = 0;
    for (var i in nHandCards) {
        if (freeCards.includes(nHandCards[i])) {
            nCount += freeTimes.get(nHandCards[i])
            nFreeTime = freeTimes.get(nHandCards[i]);
            nIndex.push(nHandCards[i])
        }
    }


    if(nCount > 0){
        dictResult["nFreeTime"] = nFreeTime;
        dictResult["bFlag"] = true;
        dictResult["nIndex"] = nIndex.length === 1 ? nIndex[0]: nIndex;
    }

    return dictResult
};

Sort = function (nLine, nList, nMagicCard, nMinLimit, nCombinations, bRule) {
    /*
     分析线上牌型
     :param nList: 单条线牌型
     :param nMagicCard: 女王（会牌）
     :param nMinLimit: 中奖最少连续数
     :param nCombinations: 各图案中奖倍率表
     :param bRule: 同一条线上出现多种开奖组合的情况下取高值或低值   True:择优取高值  False:择优取低值
     :return: [0]:图案 [1]:张数 [2]: 开奖图案角标
     */
    var nStart = 0;  //# 第一张不是女王的牌
    var temp = [];  //# 满足开奖条件的牌总和
    var res = {
        nNumber: 0,
        nColor: 0,
        nCardsIndex: null
    }; //# 返回结果
    var nCount = 0; //# 连贯总数
    var nMark = 0; //# 花色
    var listWinCards = []; //# 保存开奖图案角标
    var i = 0;
    //# 遍历单条线牌型，找出第一张不是女王的牌
    for (i in nList) {
        if (nList[i] === nMagicCard) {
            temp.push(nList[i]);
            listWinCards.push(nLine[i])
        } else {
            nStart = nList[i];
            temp.push(nList[i]);
            listWinCards.push(nLine[i]);
            break
        }
    }
    //# 查找nStart之后满足条件的牌
    for (var j = parseInt(i) + 1; j < nList.length; j++) {
        if (nList[j] == nStart || nList[j] == nMagicCard) {
            temp.push(nList[j]);
            listWinCards.push(nLine[j])
        } else {
            break;
        }

    }
    //# 满足胡牌条件
    if (temp.length >= nMinLimit) {
        //# 倒序排列，为让有女王的情况下，女王开头（女王为最大牌）
        temp.sort(function (a, b) {
            return a - b
        });
        temp.reverse();
        if (check_count(temp, temp[0]) === temp.length && temp[0] === nMagicCard) {//# 整条线全是女王
            nMark = nMagicCard;
            nCount = temp.length
        } else if (check_count(temp, nMagicCard) >= nMinLimit) {   //# 女王牌数大于最小中奖数和其他花色混搭
            if (bRule) {
                if (nCombinations[nMagicCard][check_count(temp, nMagicCard) - nMinLimit] > nCombinations[temp[temp.length - 1]][temp.length - nMinLimit]) {
                    nMark = nMagicCard;
                    nCount = check_count(temp, nMagicCard)
                } else {
                    nMark = temp[temp.length - 1];
                    nCount = temp.length
                }
            } else {
                if (nCombinations[nMagicCard][check_count(temp, nMagicCard) - nMinLimit] > nCombinations[temp[temp.length - 1]][temp.length - nMinLimit]) {
                    nMark = temp[temp.length - 1];
                    nCount = temp.length
                } else {
                    nMark = nMagicCard;
                    nCount = check_count(temp, nMagicCard)
                }
            }
        } else if (nList[0] !== nMagicCard) {  //# 一般混搭或纯女王外花色牌(开始牌必须不是女王)
            nMark = nList[0];
            nCount = temp.length;
        } else if (nList[0] === nMagicCard) { //# 女王牌开头的普通花色，找出第一个不是女王的花色
            for (let i = 0; i < nList.length; i++) {
                if (nList[i] !== nMagicCard) {
                    nMark = nList[i];
                    break;
                }
            }
            nCount = temp.length;
        }
    }
    res["nColor"] = nMark;
    res["nNumber"] = nCount;
    res["nCardsIndex"] = listWinCards;
    return res;
};


check_count = function (check_list, x) {
    //检查数组中指定元素的个数
    var num = 0;
    for (var i = 0; i < check_list.length; ++i) {
        if (check_list[i] == x) {
            num++
        }
    }
    return num
};

// 所有图案 图案数量
function getCard(cards , nGameHandCardsNumber, weight_two_array, col_count, line_count, jackpotCard, winJackpot, blankCard) {
    const nHandCards = [];

    // 从左到右发指定数量手牌 这里剔除了jackpot牌 空白牌
    for (let i = 0; i < nGameHandCardsNumber; i++) {
        // 计算每个图案，占一列的权重
        const col_num= i % col_count;
        const weights = weight_two_array[col_num];
        // log.info('列下标:' +  col_num + '权重数组:' + weights)
        nHandCards.push(weightedRandomCardType(cards, weights, jackpotCard, blankCard));
    }
    // 中了jackpot,把某行置为jackpot牌
    if(winJackpot > 0){
        const lineNum = Math.floor(Math.random() * line_count); // 随机一行

        let lineStartIndex = lineNum * line_count
        let lineEndIndex = lineStartIndex + col_count;
        log.info('中了jackpot,把某行置为jackpot牌 行号:' + lineNum + 'lineStartIndex:' + lineStartIndex + 'lineEndIndex:' + lineEndIndex)
        for(let i = lineStartIndex; i < lineEndIndex; i++){
            nHandCards[i] = jackpotCard;
        }
    }
    return nHandCards;
}



// 所有图案 图案权重数组
function weightedRandomCardType(cards, weights, jackpotCard, blankCard) {
    if(weights === undefined) throw new Error('权重配置有误')
    // 移除jackpot卡，移除空白卡 和对应权重
    let cs = [];
    let ws = [];
    for (let i = 0; i < weights.length; i++) {
        if (jackpotCard !== cards[i] && blankCard !== cards[i]) {
            cs.push(cards[i]);
            ws.push(weights[i]);
        }
    }
    // 根据权重出
    const totalWeight = ws.reduce((sum, ws) => sum + ws, 0);
    const randomValue = Math.random() * totalWeight;
    let currentWeight = 0;
    for (let i = 0; i < ws.length; i++) {
        currentWeight += ws[i];
        if (randomValue <= currentWeight) {
            // log.info('总权重:' + totalWeight + '随机出的权重:' + currentWeight + '图案下标:' + i)
            return cs[i];
        }
    }
}

exports.getMulByIndex = function (mulArr, index) {
    return mulArr[index];
}


exports.getMulByWeight = function (mulArr, weights) {
    if(mulArr === undefined) throw new Error('iconValue配置有误')
    if(weights === undefined) throw new Error('controlAward权重配置有误')

    // 根据权重出
    const totalWeight = weights.reduce((sum, ws) => sum + ws, 0);
    const randomValue = Math.random() * totalWeight;
    let currentWeight = 0;
    for (let i = 0; i < weights.length; i++) {
        currentWeight += weights[i];
        if (randomValue <= currentWeight) {
            log.info('当前权重值:' + currentWeight + '随机出的权重值:' + randomValue + '倍数区间数组下标:' + i)
            return mulArr[i];
        }
    }
}


JackpotCardAnalyse = function (nHandCards, jackpotCard, jackpotCardLowerLimit, jackpot) {
    // Jackpot
    const dictResult = {
        bFlag: false,
        nWinOpenBox: 0
    };
    let nCount = 0;
    for (const i in nHandCards) {
        if (nHandCards[i] === jackpotCard) {
            nCount += 1
        }
    }
    if (nCount >= jackpotCardLowerLimit) {
        dictResult["bFlag"] = true
        dictResult["Jackpot"] = jackpot;
    }
    return dictResult
};

module.exports.chunkArray = function chunkArray(arr, chunkSize) {
    const result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
    }
    return result;
}

module.exports.handCardLog = function handCardLog(nHandCards, col_count, line_count) {
    // 摇奖日志输出
    try {
        const chunkCards = this.chunkArray(nHandCards, col_count);
        log.info('图案排列结果');
        for (let i = 0; i < line_count; i++) {
            log.info(chunkCards[i]);
        }
    }catch (e){
        log.err(e);
    }
}



// 无线拉霸发牌
module.exports.CreateRandomCardList = function (init_type_card_list, column, row, no_magic_column_list) {
    //生成随机牌型
    //:param init_type_card_list: 花色数组
    //:param column: 列
    //:param row: 行
    // :param no_magic_column_list: 没有万能牌的列号数组
    var random_card_list = [];
    var n = init_type_card_list.slice();
    n.pop();
    for (var x = 0; x < column; x++) {
        var column_list = [];
        for (var i = 0; i < row; i++) {
            if (no_magic_column_list.indexOf(x + 1) > -1) {
                column_list.push(RandomNumForList(n))
            } else {
                column_list.push(RandomNumForList(init_type_card_list))
            }
        }
        random_card_list.push(column_list)
    }
    var result_list = [];
    for (var j = 0; j < row; j++) {
        for (var x in random_card_list) {

            if (random_card_list[parseInt(x)]) {
                result_list.push(random_card_list[parseInt(x)][0]);
                random_card_list[parseInt(x)].shift()
            } else {
                break
            }
        }

    }
    return result_list;
};


/**
 * 钻石类型
 * @param nHandCards
 * @param cards
 * @param nGameLines
 * @param icon_mul
 * @param nGameMagicCardIndex
 * @param nBetSum
 * @param cardsNumber
 * @param freeCards
 * @param freeTimes
 * @param dictAnalyseResult
 * @param user
 * @param config
 * @constructor
 */
module.exports.HandCardsAnalyse_Single = function(nHandCards, cards ,nGameLines, icon_mul, nGameMagicCardIndex, nBetSum, cardsNumber, freeCards, freeTimes, user, config, result){
    // 分析图案
    for (let i = 0; i < cardsNumber; i++) {
        result.dictAnalyseResult["nWinCards"].push(false);
    }
    let array = user.getWildList();
    let wilds = [];
    // 上次定住百变的位置
    if(array.length > 0 && array.includes(true)){
        log.info('上次定住百变的位置' + JSON.stringify(array))
        const wildCount = array.filter(item => item === true).length;
        if(wildCount === array.length){
            log.info('三个百变重新计算')
            // 三个百变重新计算
            user.setWildList([false, false, false]);
        }else{
            for (let i = 0; i < array.length; i++) {
                if(array[i]){
                    nHandCards[i] = config.nGameMagicCardIndex;
                    // log.info('上次定住百变的位置:' + i)
                    wilds.push(true);
                }else{
                    wilds.push(false);
                }
            }
        }

    }


    Diamond_Single(nHandCards, cards ,nGameLines, icon_mul, nGameMagicCardIndex, nBetSum, cardsNumber, freeCards, freeTimes, result)

    // 把上次替换的万能卡 变为自定义特殊卡
    if(wilds.length > 0 && wilds.includes(true)){
        for (let i = 0; i < wilds.length; i++) {
            if(wilds[i]){
                // 定义一张
                nHandCards[i] = 999;
            }
        }
    }
    // 获取免费次数
    if (freeCards && freeCards.length > 0) {
        result.dictAnalyseResult["getFreeTime"] = FreeTimeAnalyse(nHandCards, freeCards, freeTimes);
    }

}

module.exports.Diamond_Single = Diamond_Single;
 function Diamond_Single(nHandCards, cards ,nGameLines, icon_mul, nGameMagicCardIndex, nBetSum, cardsNumber, freeCards, freeTimes, result) {
    let _bet = nBetSum;

    let haveWin = false;
    let wildNum = list_one_count(nGameMagicCardIndex, nHandCards);
    if (wildNum === 0 || wildNum === 3) {
        for (let i = 0; i < cards.length; i++) {
            if (list_one_count(i, nHandCards) === 3) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(icon_mul[i][0] * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [true, true, true];
                result.dictAnalyseResult["win"] += icon_mul[i][0] * _bet;
                result.dictAnalyseResult["nMultiple"] = icon_mul[i][0];
                break;
            }
        }
        if (!haveWin) {
            //bar有任意三个
            if (list_one_count(1, nHandCards) + list_one_count(2, nHandCards) + list_one_count(3, nHandCards) === 3) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(8 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [true, true, true];
                result.dictAnalyseResult["win"] += 8 * _bet;
                result.dictAnalyseResult["nMultiple"] = 8;
            } else if (list_one_count(0, nHandCards) === 2) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(3 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"] += 3 * _bet;
                result.dictAnalyseResult["nMultiple"] = 3;
            } else if (list_one_count(0, nHandCards) === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(1 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"] += 1 * _bet;
                result.dictAnalyseResult["nMultiple"] = 1;
            }
        }

    } else {
        if (list_one_count(99, nHandCards) === 0) {
            const bar1= list_one_count(1, nHandCards)
            const bar2= list_one_count(2, nHandCards)
            const bar3= list_one_count(3, nHandCards)
            if ((wildNum === 1 && (bar1 === 2 || bar2 === 2 || bar3 === 2)) || (wildNum === 2 && (bar1 === 1 || bar2 === 1 || bar3 === 1))) {
                haveWin = true;
                let mul = 8;
                if(bar1 > bar2 && bar1 > bar3){
                    mul = 18;
                }else if(bar2 > bar1 && bar2 > bar3){
                    mul = 28;
                }else if(bar3 > bar1 && bar3 > bar2){
                    mul = 38;
                }
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(mul * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [true, true, true];
                result.dictAnalyseResult["win"] += mul * _bet;
                result.dictAnalyseResult["nMultiple"] = mul;
            }else if (wildNum + list_one_count(1, nHandCards) + list_one_count(2, nHandCards) + list_one_count(3, nHandCards) === 3) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(8 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [true, true, true];
                result.dictAnalyseResult["win"] += 8 * _bet;
                result.dictAnalyseResult["nMultiple"] = 8;
            } else if (list_one_count(0, nHandCards) === 1 && wildNum === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(3 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [
                    nHandCards[0] === 0 || nHandCards[0] === nGameMagicCardIndex,
                    nHandCards[1] === 0 || nHandCards[1] === nGameMagicCardIndex,
                    nHandCards[2] === 0 || nHandCards[2] === nGameMagicCardIndex
                ];
                result.dictAnalyseResult["win"] += 3 * _bet;
                result.dictAnalyseResult["nMultiple"] = 3;
            } else {
                if (wildNum === 1) {
                    let card = -1;
                    if (nHandCards[0] === nHandCards[1]) {
                        card = nHandCards[0];
                    } else if (nHandCards[0] === nHandCards[2]) {
                        card = nHandCards[0];
                    } else if (nHandCards[1] === nHandCards[2]) {
                        card = nHandCards[1];
                    }
                    if (card !== -1) {
                        haveWin = true;
                        result.dictAnalyseResult["nWinLines"].push(0);
                        result.dictAnalyseResult["nWinDetail"].push(icon_mul[card][0] * _bet);
                        result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                        result.dictAnalyseResult["nWinCards"] = [true, true, true];
                        result.dictAnalyseResult["win"] += icon_mul[card][0] * _bet;
                        result.dictAnalyseResult["nMultiple"] = icon_mul[card][0];
                    }

                } else if (wildNum === 2) {
                    let card = -1;
                    for (let i = 0; i < nHandCards.length; i++) {
                        if (nHandCards[i] !== nGameMagicCardIndex) {
                            card = nHandCards[i];
                            break;
                        }
                    }
                    haveWin = true;
                    result.dictAnalyseResult["nWinLines"].push(0);
                    result.dictAnalyseResult["nWinDetail"].push(icon_mul[card][0] * _bet);
                    result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                    result.dictAnalyseResult["nWinCards"] = [true, true, true];
                    result.dictAnalyseResult["win"] += icon_mul[card][0] * _bet;
                    result.dictAnalyseResult["nMultiple"] = icon_mul[card][0];
                }
            }
        } else {
            if (wildNum === 1 && list_one_count(0, nHandCards) === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(3 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [
                    nHandCards[0] === 0 || nHandCards[0] === nGameMagicCardIndex,
                    nHandCards[1] === 0 || nHandCards[1] === nGameMagicCardIndex,
                    nHandCards[2] === 0 || nHandCards[2] === nGameMagicCardIndex
                ];
                result.dictAnalyseResult["win"]  += 3 * _bet;
                result.dictAnalyseResult["nMultiple"] = 3;
            } else if (list_one_count(0, nHandCards) === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(1 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"]  += 1 * _bet;
                result.dictAnalyseResult["nMultiple"] = 1;
            }
        }

    }
}




module.exports.tigerFullScreen = function (dictAnalyseResult, nGameLines) {
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

module.exports.tigerOpenBoxBefore = function (dictAnalyseResult, config, result){
    let chooseNum = RandomNumBoth(0, config.cards.length - 1);
    if(chooseNum === config.jackpotCard || chooseNum === config.nGameMagicCardIndex || chooseNum === config.openBoxCard){// 排除jackpot图案
        chooseNum = 0;
    }
    let startNum = RandomNumBoth(3, 7);
    // startNum = 9;
    let finalList = [];
    let startList = [];
    result.nHandCards = [config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard, config.openBoxCard];
    for (let i = 0; i < startNum; i++) {
        let a = RandomNumBoth(0, result.nHandCards.length - 1);
        if(a === config.jackpotCard){// 排除jackpot图案
            a = 0;
        }
        if (result.nHandCards[a] !== chooseNum) {
            result.nHandCards[a] = chooseNum;
            startList.push(a);
        } else {
            i--;
        }
    }
    startList.sort(function (a, b) {
        return a - b;
    });
    finalList.push(startList.concat());

    // 传递参数
    result.chooseNum = chooseNum;
    result.finalList = finalList;
    result.startList = startList;
}

module.exports.tigerOpenBoxAfter = function (config, result, user){
    let res_list = [];
    let newHandCard = [];
    for (let i in result.nHandCards) {
        newHandCard.push(parseInt(result.nHandCards[i]) + 1);
    }
    result.dictAnalyseResult["nHandCards"] = newHandCard;
    res_list.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));
    // 初始化分析结果
    result.dictAnalyseResult = analyse_result.initResult(config.nBetSum)
    for (let i = 0; i < config.cards.length; i++) {
        result.dictAnalyseResult["nWinCards"].push(false);
    }
    while(true){
        let haveChange = false;
        for (let i = 0; i < result.nHandCards.length; i++) {
            let c = RandomNumBoth(0, config.cards.length - 1);
            if(c === config.jackpotCard){ // 过滤jackpot图案
                c = 0;
            }
            if ((c === result.chooseNum && result.nHandCards[i] !== c)) {
                haveChange = true;
                result.nHandCards[i] = result.chooseNum;
                result.startList.push(i);
                //console.log(c, i);
            } else if (c === config.nGameMagicCardIndex && result.nHandCards[i] !== result.chooseNum && result.nHandCards[i] !== config.nGameMagicCardIndex) {
                haveChange = true;
                result.nHandCards[i] = config.nGameMagicCardIndex;
                result.startList.push(i);
                //console.log(c, i);
            }
        }
        result.startList.sort(function (a, b) {
            return a - b;
        });
        if (result.startList.length === config.cards.length) {
            haveChange = false;
        }
        result.finalList.push(result.startList.concat());
        this.HandCardsAnalyse(result.nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, result.winItem.winJackpot, config.freeCards, config.freeTimes, config, result);
        let newHandCard = [];
        for (let i in result.nHandCards) {
            newHandCard.push(parseInt(result.nHandCards[i]) + 1);
        }
        result.dictAnalyseResult["nHandCards"] = newHandCard;
        res_list.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));

        result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
        for (let i = 0; i < config.cards.length; i++) {
            result.dictAnalyseResult["nWinCards"].push(false);
        }
        //没有变化的时候直接跳出
        if (!haveChange) {
            break;
        }
    }
    result.dictAnalyseResult["getBigWin"] = {
        bFlag: true,
        isStart: true,
        list: result.finalList,
        card: result.chooseNum + 1,
        res_list: res_list
    };
    console.log(result.finalList);
    this.HandCardsAnalyse(result.nHandCards, config.nGameLines, config.icon_mul, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.nGameLineDirection, config.bGameLineRule, config.nBetList, config.jackpotCard, result.winItem.winJackpot, config.freeCards, config.freeTimes, config, result);
    log.info('老虎特殊玩法转动结束')
}



module.exports.ganeshagoldOpenBox = function (result){

    //开宝箱
     result.dictAnalyseResult.getOpenBox = {
         "bFlag": true,
         "nWinOpenBox": 0,
         "win": 0
     }
}

module.exports.BuffaloKingOpenBox = function (result){
    //开宝箱
    result.dictAnalyseResult.getOpenBox = {
        "bFlag": true,
        "nWinOpenBox": 0,
        "win": 0
    }
}
module.exports.jungledelightOpenBox = function (result){
    //开宝箱
    result.dictAnalyseResult.getOpenBox = {
        "bFlag": true,
        "nWinOpenBox": 0,
        "win": 0
    }
}

module.exports.DigDigDiggerOpenBox = function (result){
    //开宝箱
    result.dictAnalyseResult.getOpenBox = {
        "bFlag": true,
        "nWinOpenBox": 0,
        "win": 0
    }
}
module.exports.grandWheelOpenBox = function (dictAnalyseResult, nHandCards, openBoxCard, nBetSum,  expectMulSection){
    expectMulSection = expectMulSection.length === 1 ? [expectMulSection[0],expectMulSection[0]] : expectMulSection;
    let openBoxCardWin = 0;
    let bonusNum = StringUtil.list_one_count(openBoxCard, nHandCards);

    // 中了bonus 在倍数区间expectMulSection 选一个倍数
    if (bonusNum === 1) {
        let resultList = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 18, 28, 30, 38];
        let muls = resultList.filter(mul => mul <= expectMulSection[1] && mul >= expectMulSection[0])
        const mul = StringUtil.RandomNumForList(muls);
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
        let muls = resultList.filter(mul => mul <= expectMulSection[1] && mul >= expectMulSection[0])
        const mul = StringUtil.RandomNumForList(muls);
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
        let muls = resultList.filter(mul => mul <= expectMulSection[1] && mul >= expectMulSection[0])
        const mul = StringUtil.RandomNumForList(muls);

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
/**
 *
 * 混合足球
 * @param nHandCards 图案
 * @param nColumnNumber
 * @param nMagicCard
 * @param nLowerLimit
 * @param freeCards
 * @param nBet
 * @param iconMul
 * @param config
 * @param result
 */
function HandCardsAnalyse_MixFootball(nHandCards ,nColumnNumber, nMagicCard, nLowerLimit, freeCards, nBet, iconMul, config, result){
    const nFreeCard = freeCards[0];

    let now_time = Number(new Date());
    //# 校验手牌是否满足列数
    //# 生成列的结合
    let idx = 0;
    let columns = [];
    while (idx < nColumnNumber) {
        let column = [];
        for (let str_j in nHandCards) {
            let j = parseInt(str_j);
            if (j % nColumnNumber === idx) {
                column.push(j);
            }
        }
        if (idx > 0 && idx < 5) {
            column.push(nHandCards.length + idx);
        }
        columns.push(column);
        idx++;
    }
    //# 可以连接的列
    var nWinLines = [];
    var nIndex = 0;
    for (let column_index in columns) {
        let column = columns[parseInt(column_index)];
        nIndex++;
        //# 初始化为第一列
        if (nWinLines.length === 0) {
            for (let i_idx in column) {
                let nWinLine = [];
                nWinLine.push(column[parseInt(i_idx)]);
                nWinLines.push(nWinLine);
            }
        } else {
            //# 遍历nWinLines 和 column 判断是否可以连线
            for (let i_idx in column) {
                let i = column[parseInt(i_idx)];
                for (let w_l_idx in nWinLines) {
                    let nWinLine = nWinLines[parseInt(w_l_idx)];
                    //# 存放中奖线的牌的花色
                    let nWinLineCards = [];
                    for (let n_idx in nWinLine) {
                        let n = nWinLine[parseInt(n_idx)];
                        nWinLineCards.push(nHandCards[n])
                    }
                    let target = nHandCards[i];
                    // # 用nWinLine的最后一位和 column中的角标比较，如果值相等的话将角标添加到nWinLine中
                    if (nWinLineCards.indexOf(target) > -1 || target === nMagicCard) {
                        let temp = [];
                        //# 复制出当前的nWinLine
                        for (let m in nWinLine) {
                            temp.push(nWinLine[parseInt(m)]);
                        }
                        //# 如果nWinLine的长度比列数少一位则满足条件，将角标i添加到新的nWinLine中，然后将nWinLine添加到列表nWinLine中
                        if (temp.indexOf(i) === -1 && nWinLine.length + 1 === nIndex) {
                            temp.push(i);
                            nWinLines.push(temp);

                        }
                    }
                }

            }
        }

    }
    //# 遍历nWinLines，将包含于其他线中的线（之前判断的老线）和长度不满足最短连线要求的线删除
    let bFlage = true;
    while (bFlage) {
        bFlage = false;
        for (let w_l_idx in nWinLines) {
            let nWinLine = nWinLines[parseInt(w_l_idx)];
            for (let wl_idx in nWinLines) {
                let line = nWinLines[parseInt(wl_idx)];
                if (es6_set(nWinLine).length < es6_set(line).length || nWinLine.length < nLowerLimit) {
                    // nWinLines.remove(nWinLine)
                    list_remove(nWinLine, nWinLines);
                    bFlage = true;
                    break
                }
            }
        }
    }
    //# 根据下注倍数计算每条线
    let AllWinNum = 0;          //# 赢钱总数
    let WinLinesList = [];      //# 获奖线和金额
    let AllWinLinesList = [];   //# 所有中奖位置

    //# 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
    // console.log("nWinLines----------------------0")
    // console.log(nWinLines)
    if (nWinLines.length > 0) {
        for (let i_idx in nWinLines) {
            let is_free_card = false;
            let is_magic_card = false;
            for (let j_idx in nWinLines[i_idx]) {
                let j = nWinLines[i_idx][j_idx];
                let target = nHandCards[j];
                if (target === nFreeCard) {
                    is_free_card = true;
                } else if (target === nMagicCard) {
                    is_magic_card = true;
                }
            }
            if (is_free_card) {
                nWinLines[i_idx] = [];
            }
            if (is_free_card && is_magic_card) {
                let target1 = nHandCards[nWinLines[i_idx][1]];
                let target2 = nHandCards[nWinLines[i_idx][2]];
                let target3 = nHandCards[nWinLines[i_idx][3]];
                let target4 = nHandCards[nWinLines[i_idx][4]];
                if (target1 === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (target2 === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (target3 === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2]];
                } else if (target4 === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2], nWinLines[i_idx][3]];
                }

            }
        }
        // console.log("nWinLines----------------------")
        // console.log(nWinLines)
        for (let x_idx in nWinLines) {
            let x = nWinLines[parseInt(x_idx)];
            if (!x) {
                // nWinLines.remove(x)
                list_remove(x, nWinLines);
            }
        }

    }
    if (nWinLines.length > 0) {
        for (let x_idx in nWinLines) {
            let x = nWinLines[parseInt(x_idx)];
            let cards_index = x[0];
            if (cards_index || cards_index === 0) {
                let card = nHandCards[cards_index];
                let win_num = 0;
                // console.log("------------------------");
                // console.log(game_odds);
                // console.log(card);
                // console.log(x.length);
                // console.log(nHandCards);
                // console.log(cards_index);
                // console.log(nWinLines);
                // console.log(win_num);
                // console.log(nBet);
                // console.log(game_odds[card][x.length]);
                // console.log(GOLD_Single);
                try {
                    if(card > -1){
                        win_num = StringUtil.rideNumbers(iconMul[card][x.length - nLowerLimit] , nBet, 2);
                    }
                    // log.info('线赢:' + win_num)
                }catch (e){
                    console.log(nHandCards)
                    console.log(card)
                    console.log(x.length)
                    log.err(e)
                }

                AllWinNum = StringUtil.addNumbers(AllWinNum, win_num);
                let win_line = [];
                for (let i_idx in nHandCards) {
                    let i = parseInt(i_idx);
                    if (x.indexOf(i) > -1) {
                        win_line.push(true);
                    } else {
                        win_line.push(false);
                    }
                }
                WinLinesList.push({"win_num": win_num, "win_line": win_line});
            }
        }

        for (let i_idx in nHandCards) {
            AllWinLinesList.push(false)
        }
        for (let i_idx in nWinLines) {
            let nWinLineDetail = nWinLines[parseInt(i_idx)];
            for (let o_idx in nWinLineDetail) {
                let o = nWinLineDetail[o_idx];
                if (o < nHandCards.length) {
                    AllWinLinesList[o] = true;
                }

            }

        }
    }
    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["getOpenBox"] = {"bFlag": false, "nWinOpenBox": 0, "win": 0}; //# 开箱子
    result.dictAnalyseResult["getFreeTime"] = {"bFlag": false, "nFreeTime": 0};  //# 免费次数
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    return result.dictAnalyseResult;
}



module.exports.addSpecialCard = function (arr, colNum, nHandCards, superCardList, superCardDetailList, sId, config){
    const freeCard = config.freeCards[0];
    const CARD_ORDERING = [
        [[0, 1], [2, 3]],
        [[0, 1], [3, 4]],
        [[0, 1], [4, 5]],
        [[1, 2], [3, 4]],
        [[1, 2], [4, 5]],
        [[2, 3], [4, 5]],
        [[0, 1], [2, 3, 4]],
        [[0, 1], [3, 4, 5]],
        [[1, 2], [3, 4, 5]],
        [[0, 1, 2], [3, 4]],
        [[0, 1, 2], [4, 5]],
        [[1, 2, 3], [4, 5]],
        [[0, 1], [2, 3, 4, 5]],
        [[0, 1, 2, 3], [4, 5]],
    ];

    let r1 = RandomNumBoth(0, 3);//出现几组
    let card = RandomNumBoth(0, 11);//哪张牌
    switch (r1) {
        case 0:
            break;
        case 1:
            let p = RandomNumBoth(1, arr.length - 1);
            let len = RandomNumBoth(2, p + 1 > 4 ? 4 : p + 1);
            len = card === freeCard ? 2 : len;
            let bt = RandomNumBoth(1, 2);//1有  2没有
            let ls = 2;//1金  2银  3万能
            let pos = [];
            let drl = {r: card + 1, bt: bt, ls: ls};
            for (let i = 0; i < len; i++) {
                arr[p - i] = card;
                pos.push(colNum + 6 * (p - i));
                nHandCards[colNum + 6 * (p - i)] = card;
            }
            pos.sort((a, b) => {
                return a - b;
            });
            superCardList["" + sId] = pos;
            superCardDetailList["" + sId] = drl;
            sId++;
            break;
        case 2:
            let list = RandomNumForList(CARD_ORDERING);
            for (let i = 0; i < list.length; i++) {
                card = RandomNumBoth(0, 11);//哪张牌
                if (card === freeCard) {
                    let r2 = RandomNumBoth(0, 5);
                    list = CARD_ORDERING[r2];
                }
                let pos2 = [];
                let bt2 = RandomNumBoth(1, 2);//1有  2没有
                let ls2 = 2;//1金  2银  3万能
                let drl2 = {r: card + 1, bt: bt2, ls: ls2};
                for (let j = 0; j < list[i].length; j++) {
                    arr[list[i][j]] = card;
                    pos2.push(colNum + 6 * list[i][j]);
                    nHandCards[colNum + 6 * list[i][j]] = card;
                }
                pos2.sort((a, b) => {
                    return a - b;
                });
                superCardList["" + sId] = pos2;
                superCardDetailList["" + sId] = drl2;
                sId++;
            }
            break;
        case 3:
            let list2 = [[0, 1], [2, 3], [4, 5]];
            for (let i = 0; i < list2.length; i++) {
                card = RandomNumBoth(0, 11);//哪张牌
                let pos3 = [];
                let bt3 = RandomNumBoth(1, 2);//1有  2没有
                let ls3 = 2;//1金  2银  3万能
                let drl3 = {r: card + 1, bt: bt3, ls: ls3};
                for (let j = 0; j < list2[i].length; j++) {
                    arr[list2[i][j]] = card;
                    pos3.push(colNum + 6 * list2[i][j]);
                    nHandCards[colNum + 6 * list2[i][j]] = card;
                }
                pos3.sort((a, b) => {
                    return a - b;
                });
                superCardList["" + sId] = pos3;
                superCardDetailList["" + sId] = drl3;
                sId++;
            }
            break;
    }
    return arr;
}




/**
 * GrandWheel
 * @param nHandCards
 * @param nGameLines
 * @param icon_mul
 * @param nGameMagicCardIndex
 * @param nBetSum
 * @param cardsNumber
 * @param dictAnalyseResult
 * @constructor
 */
module.exports.HandCardsAnalyse_Single_Simple = function(nHandCards, cards, nGameLines, icon_mul, nGameMagicCardIndex, nBetSum, cardsNumber, dictAnalyseResult){
    //添加结束
    for (var i = 0; i < cardsNumber; i++) {
        dictAnalyseResult["nWinCards"].push(false);
    }

    if (list_one_count(99, nHandCards) === 0) {
        for (let i = 0; i < cards.length; i++) {
            if (list_one_count(i, nHandCards) === 3
                || (list_one_count(i, nHandCards) === 1 && list_one_count(nGameMagicCardIndex, nHandCards) === 2)
                || (list_one_count(i, nHandCards) === 2 && list_one_count(nGameMagicCardIndex, nHandCards) === 1)
            ) {
                dictAnalyseResult["nWinLines"].push(0);
                dictAnalyseResult["nWinDetail"].push(icon_mul[i][0] * nBetSum);
                dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                dictAnalyseResult["nWinCards"] = [true, true, true];
                dictAnalyseResult["win"] += icon_mul[i] * nBetSum;
                break;
            }
        }
    }
}


/**
 * 野牛，大象
 * @param nHandCards
 * @param nMagicCard
 * @param nFreeCards
 * @param freeTimes
 * @param nLowerLimit
 * @param nColumnNumber
 * @param nBet
 * @param winJackpot
 * @param iconMul
 * @param result
 * @returns {{}}
 * @constructor
 */
/*module.exports.AnalyseColumnSolt = function (nHandCards, nMagicCard, nFreeCards, freeTimes, nLowerLimit, nColumnNumber, nBet, winJackpot, iconMul, result) {
    const nFreeCard = nFreeCards.length === 0 ? -1 : nFreeCards[0];
    var now_time = Number(new Date());
    //# 校验手牌是否满足列数
    //# 生成列的结合
    var i = 0;
    var columns = [];
    while (i < nColumnNumber) {
        var column = [];
        for (var str_j in nHandCards) {
            var j = parseInt(str_j);
            if (j % nColumnNumber === i) {
                column.push(j);
            }

        }
        columns.push(column);
        i++;
    }
    //# 可以连接的列
    var nWinLines = [];
    var nIndex = 0;
    for (var column_index in columns) {
        var column = columns[parseInt(column_index)];
        nIndex++;
        //# 初始化为第一列
        if (nWinLines.length === 0) {
            for (var i_idx in column) {
                var nWinLine = [];
                nWinLine.push(column[parseInt(i_idx)]);
                nWinLines.push(nWinLine)
            }
        } else {
            //# 遍历nWinLines 和 column 判断是否可以连线
            for (var i_idx in column) {
                var i = column[parseInt(i_idx)];
                for (var w_l_idx in nWinLines) {
                    var nWinLine = nWinLines[parseInt(w_l_idx)];
                    //# 存放中奖线的牌的花色
                    var nWinLineCards = [];
                    for (var n_idx in nWinLine) {
                        var n = nWinLine[parseInt(n_idx)];
                        nWinLineCards.push(nHandCards[n])
                    }
                    // # 用nWinLine的最后一位和 column中的角标比较，如果值相等的话将角标添加到nWinLine中
                    if (nWinLineCards.indexOf(nHandCards[i]) > -1 || nHandCards[i] === nMagicCard) {
                        var temp = [];
                        //# 复制出当前的nWinLine
                        for (var m in nWinLine) {
                            temp.push(nWinLine[parseInt(m)]);
                        }
                        //# 如果nWinLine的长度比列数少一位则满足条件，将角标i添加到新的nWinLine中，然后将nWinLine添加到列表nWinLine中
                        if (temp.indexOf(i) === -1 && nWinLine.length + 1 === nIndex) {
                            temp.push(i);
                            nWinLines.push(temp);

                        }
                    }
                }

            }
        }

    }
    //# 遍历nWinLines，将包含于其他线中的线（之前判断的老线）和长度不满足最短连线要求的线删除
    var bFlage = true;
    while (bFlage) {
        bFlage = false;
        for (var w_l_idx in nWinLines) {
            var nWinLine = nWinLines[parseInt(w_l_idx)];
            for (var wl_idx in nWinLines) {
                var line = nWinLines[parseInt(wl_idx)];
                if (es6_set(nWinLine).length < es6_set(line).length || nWinLine.length < nLowerLimit) {
                    // nWinLines.remove(nWinLine)
                    list_remove(nWinLine, nWinLines);
                    bFlage = true;
                    break
                }
            }
        }
    }
    //# 根据下注倍数计算每条线
    var bIsFree = false;  //# 是否免费
    var nFreeNum = 0;  //# 免费次数
    var AllWinNum = 0;  //# 赢钱总数
    var WinLinesList = [];  //# 获奖线和金额
    var AllWinLinesList = [];  //# 所有中奖位置

    //# 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
    // console.log("nWinLines----------------------0")
    // console.log(nWinLines)
    if (nWinLines.length > 0) {
        for (var i_idx in nWinLines) {
            var i = parseInt(i_idx);
            var x = nWinLines[i_idx];
            var is_free_card = false;
            var is_magic_card = false;
            for (var j_idx in nWinLines[i_idx]) {
                var j = nWinLines[i_idx][j_idx];
                if (nHandCards[j] === nFreeCard) {
                    is_free_card = true;
                } else if (nHandCards[j] === nMagicCard) {
                    is_magic_card = true;
                }
            }
            if (is_free_card && is_magic_card) {
                if (nHandCards[nWinLines[i_idx][1]] === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (nHandCards[nWinLines[i_idx][2]] === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (nHandCards[nWinLines[i_idx][3]] === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2]];
                } else if (nHandCards[nWinLines[i_idx][4]] === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2], nWinLines[i_idx][3]];
                }

            }
        }
        // console.log("nWinLines----------------------")
        // console.log(nWinLines)
        for (var x_idx in nWinLines) {
            var x = nWinLines[parseInt(x_idx)];
            if (!x) {
                // nWinLines.remove(x)
                list_remove(x, nWinLines);
            }
        }

    }
    if (nWinLines.length > 0) {
        for (var x_idx in nWinLines) {
            var x = nWinLines[parseInt(x_idx)];
            var cards_index = x[0]
            if (cards_index || cards_index === 0) {
                var card = nHandCards[cards_index];
                var win_num = 0;
                if (nFreeCard) { //# 免费倍数
                    win_num = iconMul[card][x.length - nLowerLimit] * nBet
                    result.dictAnalyseResult["nMultiple"] = parseInt( result.dictAnalyseResult["nMultiple"]) + parseInt(iconMul[card][x.length - nLowerLimit]);
                } else {
                    win_num = iconMul[card][x.length - nLowerLimit] * nBet;
                    result.dictAnalyseResult["nMultiple"] = parseInt( result.dictAnalyseResult["nMultiple"]) + parseInt(iconMul[card][x.length - nLowerLimit]);
                }
                AllWinNum += win_num;
                var win_line = [];
                for (var i_idx in nHandCards) {
                    var i = parseInt(i_idx);
                    var j = nHandCards[i];
                    if (x.indexOf(i) > -1) {
                        win_line.push(true)
                    } else {
                        win_line.push(false)
                    }
                }
                WinLinesList.push({"win_num": win_num, "win_line": win_line});
            }
        }

        for (var i_idx in nHandCards) {
            AllWinLinesList.push(false)
        }
        for (var i_idx in nWinLines) {
            var nWinLineDetail = nWinLines[parseInt(i_idx)];
            for (var o_idx in nWinLineDetail) {
                var o = nWinLineDetail[o_idx];
                AllWinLinesList[o] = true
            }
        }
    }
    // 免费次数
    const times = nHandCards.filter(card => card === nFreeCard).length
    if (times &&  times > 0) {
        bIsFree = true;
        if(times === 1){
            nFreeNum = 1
        }else if(times === 3){
            nFreeNum = 12
        }else if(times === 4){
            nFreeNum = 15
        }else if(times === 5){
            nFreeNum = 20
        }
    }
    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    // result["nBet"] = nBet  //# 下注
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    result.dictAnalyseResult["getOpenBox"] = {"bFlag": false, "nWinOpenBox": 0, "win": 0}; //# 开箱子
    result.dictAnalyseResult["getFreeTime"] = {"bFlag": bIsFree, "nFreeTime": nFreeNum};  //# 免费次数



};*/
/*
     列数判断型拉把算法
     :param nHandCards: 手牌
     :param nMagicCard: 万能牌的值
     :param nLowerLimit: 一条线上最少连线的数量
     :param nColumnNumber: 手牌总共多少列
     :param nBet: 下注倍数
     :param game_odds: 花色对应赔率
     :param free_num: 免费次数
     :param free_multiple:免费倍数
  */
/*module.exports.AnalyseColumnSolt = function (nHandCards, nMagicCard, nFreeCards, freeTimes, nLowerLimit, nColumnNumber, nBet, winJackpot, iconMul, result, gameId) {
    const nFreeCard = nFreeCards.length === 0 ? -1 : nFreeCards[0];
    const is_free = false;
    const now_time = Number(new Date());
    //# 校验手牌是否满足列数
    //# 生成列的结合
    let i = 0;
    const columns = [];
    while (i < nColumnNumber) {
        let column = [];
        for (const str_j in nHandCards) {
            const j = parseInt(str_j);
            if (j % nColumnNumber === i) {
                column.push(j);
            }
        }
        columns.push(column);
        i++;
    }
    //# 可以连接的列
    const nWinLines = [];
    let nIndex = 0;
    for (const column_index in columns) {
        const column = columns[parseInt(column_index)];
        nIndex++;
        //# 初始化为第一列
        if (nWinLines.length === 0) {
            for (let i_idx in column) {
                const nWinLine = [];
                nWinLine.push(column[parseInt(i_idx)]);
                nWinLines.push(nWinLine)
            }
        } else {
            //# 遍历nWinLines 和 column 判断是否可以连线
            for (let i_idx in column) {
                i = column[parseInt(i_idx)];
                for (let w_l_idx in nWinLines) {
                    let nWinLine = nWinLines[parseInt(w_l_idx)];
                    //# 存放中奖线的牌的花色
                    let nWinLineCards = [];
                    for (let n_idx in nWinLine) {
                        let n = nWinLine[parseInt(n_idx)];
                        nWinLineCards.push(nHandCards[n])
                    }
                    // # 用nWinLine的最后一位和 column中的角标比较，如果值相等的话将角标添加到nWinLine中
                    if (nWinLineCards.indexOf(nHandCards[i]) > -1 || nHandCards[i] === nMagicCard) {
                        var temp = [];
                        //# 复制出当前的nWinLine
                        for (var m in nWinLine) {
                            temp.push(nWinLine[parseInt(m)]);
                        }
                        //# 如果nWinLine的长度比列数少一位则满足条件，将角标i添加到新的nWinLine中，然后将nWinLine添加到列表nWinLine中
                        if (temp.indexOf(i) === -1 && nWinLine.length + 1 === nIndex) {
                            temp.push(i);
                            nWinLines.push(temp);
                        }
                    }
                }

            }
        }

    }
    // 遍历nWinLines，将包含于其他线中的线（之前判断的老线）和长度不满足最短连线要求的线删除
    let bFlage = true;
    while (bFlage) {
        bFlage = false;
        for (let w_l_idx in nWinLines) {
            let nWinLine = nWinLines[parseInt(w_l_idx)];
            for (let wl_idx in nWinLines) {
                let line = nWinLines[parseInt(wl_idx)];
                if (es6_set(nWinLine).length < es6_set(line).length || nWinLine.length < nLowerLimit) {
                    list_remove(nWinLine, nWinLines);
                    bFlage = true;
                    break
                }
            }
        }
    }
    //# 根据下注倍数计算每条线
    let bIsFree = false;  //# 是否免费
    let nFreeNum = 0;  //# 免费次数
    let AllWinNum = 0;  //# 赢钱总数
    const WinLinesList = [];  //# 获奖线和金额
    const AllWinLinesList = [];  //# 所有中奖位置

    // 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
    if (nWinLines.length > 0) {
        for (let i_idx in nWinLines) {
            i = parseInt(i_idx);
            let is_free_card = false;
            let is_magic_card = false;
            for (let j_idx in nWinLines[i_idx]) {
                let j = nWinLines[i_idx][j_idx];
                if (nHandCards[j] === nFreeCard) {
                    is_free_card = true;
                } else if (nHandCards[j] === nMagicCard) {
                    is_magic_card = true;
                }
            }
            if (is_free_card && is_magic_card) {
                if (nHandCards[nWinLines[i_idx][1]] === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (nHandCards[nWinLines[i_idx][2]] === nMagicCard) {
                    nWinLines[i_idx] = [];
                } else if (nHandCards[nWinLines[i_idx][3]] === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2]];
                } else if (nHandCards[nWinLines[i_idx][4]] === nMagicCard) {
                    nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2], nWinLines[i_idx][3]];
                }

            }
        }
        for (let x_idx in nWinLines) {
            let x = nWinLines[parseInt(x_idx)];
            if (!x) {
                list_remove(x, nWinLines);
            }
        }

    }
    if (nWinLines.length > 0) {
        for (let x_idx in nWinLines) {
            let x = nWinLines[parseInt(x_idx)];
            let cards_index = x[0]
            if (cards_index || cards_index === 0) {
                let card = nHandCards[cards_index];
                let win_num = 0;
                if (is_free) { //# 免费倍数
                    win_num = iconMul[card][x.length - nLowerLimit] * nBet
                    result.dictAnalyseResult["nMultiple"] = StringUtil.addNumbers(result.dictAnalyseResult["nMultiple"], iconMul[card][x.length - nLowerLimit]);
                } else {
                    win_num = iconMul[card][x.length - nLowerLimit] * nBet;
                    result.dictAnalyseResult["nMultiple"] = StringUtil.addNumbers(result.dictAnalyseResult["nMultiple"], iconMul[card][x.length - nLowerLimit]);
                }
                AllWinNum += win_num;
                let win_line = [];
                for (let i_idx in nHandCards) {
                    i = parseInt(i_idx);
                    if (x.indexOf(i) > -1) {
                        win_line.push(true)
                    } else {
                        win_line.push(false)
                    }
                }
                WinLinesList.push({"win_num": win_num, "win_line": win_line});
            }
        }

        for (let i_idx in nHandCards) {
            AllWinLinesList.push(false)
        }
        for (let i_idx in nWinLines) {
            let nWinLineDetail = nWinLines[parseInt(i_idx)];
            for (let o_idx in nWinLineDetail) {
                let o = nWinLineDetail[o_idx];
                AllWinLinesList[o] = true
            }
        }
    }

    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    if(gameId === 263){
        const len = nHandCards.filter(card => card === nFreeCard).length
        if(len < 3){
            bIsFree = false;
            nFreeNum = 0;
        }else if(len === 3){
            bIsFree = true;
            nFreeNum = 12
        }else if(len === 4){
            bIsFree = true;
            nFreeNum = 15
        }else if(len >= 5){
            bIsFree = true;
            nFreeNum = 20
        }
    }
    // 免费次数
    result.dictAnalyseResult["getFreeTime"] = {"bFlag": bIsFree, "nFreeTime": nFreeNum};
    return result;
}*/
/*module.exports.AnalyseColumnSolt = function (nHandCards, nMagicCard, nFreeCards, freeTimes, nLowerLimit, nColumnNumber, nBet, winJackpot, iconMul, result, gameId) {
    const nFreeCard = nFreeCards.length === 0 ? -1 : nFreeCards[0];
    const is_free = false;
    const now_time = Number(new Date());

    // 生成列的结合
    const columns = Array.from({ length: nColumnNumber }, () => []);
    nHandCards.forEach((_, idx) => {
        columns[idx % nColumnNumber].push(idx);
    });

    // 可以连接的列
    let nWinLines = [];
    columns.forEach((column, colIndex) => {
        if (nWinLines.length === 0) {
            column.forEach(idx => {
                nWinLines.push([idx]);
            });
        } else {
            const newWinLines = [];
            column.forEach(i => {
                nWinLines.forEach(nWinLine => {
                    const nWinLineCards = new Set(nWinLine.map(n => nHandCards[n]));
                    if (nWinLineCards.has(nHandCards[i]) || nHandCards[i] === nMagicCard) {
                        const temp = [...nWinLine, i];
                        if (temp.length === colIndex + 1) {
                            newWinLines.push(temp);
                        }
                    }
                });
            });
            nWinLines = nWinLines.concat(newWinLines);
        }
    });

    // 去重和删除不满足条件的连线
    nWinLines = nWinLines.filter(line => line.length >= nLowerLimit && !nWinLines.some(otherLine =>
        otherLine !== line && new Set(otherLine).size > new Set(line).size));

    // 根据下注倍数计算每条线
    let bIsFree = false;  //# 是否免费
    let nFreeNum = 0;  //# 免费次数
    let AllWinNum = 0;  //# 赢钱总数
    const WinLinesList = [];  //# 获奖线和金额
    const AllWinLinesList = Array(nHandCards.length).fill(false);  //# 所有中奖位置

    // 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
    nWinLines = nWinLines.filter(nWinLine => {
        let is_free_card = false;
        let is_magic_card = false;
        nWinLine.forEach(j => {
            if (nHandCards[j] === nFreeCard) {
                is_free_card = true;
            } else if (nHandCards[j] === nMagicCard) {
                is_magic_card = true;
            }
        });
        if (is_free_card && is_magic_card) {
            const nMagicCardIdx = nWinLine.findIndex(j => nHandCards[j] === nMagicCard);
            if (nMagicCardIdx > 0 && nMagicCardIdx <= 4) {
                nWinLine.length = nMagicCardIdx;
                return true;
            }
            return false;
        }
        return true;
    });

    if (nWinLines.length > 0) {
        nWinLines.forEach(x => {
            const cards_index = x[0];
            if (cards_index !== undefined) {
                const card = nHandCards[cards_index];
                const winMultiplier = iconMul[card][x.length - nLowerLimit];
                const win_num = winMultiplier * nBet;
                result.dictAnalyseResult["nMultiple"] = StringUtil.addNumbers(result.dictAnalyseResult["nMultiple"], winMultiplier);
                AllWinNum += win_num;
                const win_line = nHandCards.map((_, i) => x.includes(i));
                WinLinesList.push({ "win_num": win_num, "win_line": win_line });
            }
        });

        nWinLines.forEach(nWinLine => {
            nWinLine.forEach(o => {
                AllWinLinesList[o] = true;
            });
        });
    }

    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    if (gameId === 263) {
        const len = nHandCards.filter(card => card === nFreeCard).length;
        if (len < 3) {
            bIsFree = false;
            nFreeNum = 0;
        } else if (len === 3) {
            bIsFree = true;
            nFreeNum = 12;
        } else if (len === 4) {
            bIsFree = true;
            nFreeNum = 15;
        } else if (len >= 5) {
            bIsFree = true;
            nFreeNum = 20;
        }
    }

    // 免费次数
    result.dictAnalyseResult["getFreeTime"] = { "bFlag": bIsFree, "nFreeTime": nFreeNum };
    return result;
}*/
module.exports.AnalyseColumnSolt = function (
    nHandCards,
    nMagicCard,
    nFreeCards,
    freeTimes,
    nLowerLimit,
    nColumnNumber,
    nBet,
    winJackpot,
    iconMul,
    result,
    gameId
) {
    const nFreeCard = nFreeCards.length === 0 ? -1 : nFreeCards[0];
    const now_time = Date.now();

    // 生成列的结合
    const columns = Array.from({ length: nColumnNumber }, () => []);
    nHandCards.forEach((_, idx) => {
        columns[idx % nColumnNumber].push(idx);
    });

    // 可以连接的列
    let nWinLines = [];
    columns.forEach((column, colIndex) => {
        if (nWinLines.length === 0) {
            column.forEach(idx => {
                nWinLines.push([idx]);
            });
        } else {
            const newWinLines = [];
            column.forEach(i => {
                nWinLines.forEach(nWinLine => {
                    const nWinLineCards = new Set(nWinLine.map(n => nHandCards[n]));
                    if (nWinLineCards.has(nHandCards[i]) || nHandCards[i] === nMagicCard) {
                        const temp = [...nWinLine, i];
                        if (temp.length === colIndex + 1) {
                            newWinLines.push(temp);
                        }
                    }
                });
            });
            nWinLines.push(...newWinLines);
        }
    });

    // 去重和删除不满足条件的连线
    nWinLines = nWinLines.filter(line => line.length >= nLowerLimit);
    // nWinLines = nWinLines.filter(line => !nWinLines.some(otherLine => otherLine !== line && new Set(otherLine).size > new Set(line).size));
    nWinLines = nWinLines.filter(line => !nWinLines.some(otherLine => otherLine !== line && isSubset(line, otherLine)));


    // 根据下注倍数计算每条线
    let bIsFree = false;  //# 是否免费
    let nFreeNum = 0;  //# 免费次数
    let AllWinNum = 0;  //# 赢钱总数
    const WinLinesList = [];  //# 获奖线和金额
    const AllWinLinesList = Array(nHandCards.length).fill(false);  //# 所有中奖位置

    // 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
    nWinLines = nWinLines.filter(nWinLine => {
        let is_free_card = false;
        let is_magic_card = false;
        nWinLine.forEach(j => {
            if (nHandCards[j] === nFreeCard) {
                is_free_card = true;
            } else if (nHandCards[j] === nMagicCard) {
                is_magic_card = true;
            }
        });
        if (is_free_card && is_magic_card) {
            const nMagicCardIdx = nWinLine.findIndex(j => nHandCards[j] === nMagicCard);
            if (nMagicCardIdx > 0 && nMagicCardIdx <= 4) {
                nWinLine.length = nMagicCardIdx;
                return true;
            }
            return false;
        }
        return true;
    });

    if (nWinLines.length > 0) {
        nWinLines.forEach(x => {
            const cards_index = x[0];
            if (cards_index !== undefined) {
                const card = nHandCards[cards_index];
                const winMultiplier = iconMul[card][x.length - nLowerLimit];
                if(winMultiplier === undefined){
                    return;
                }
                const win_num = winMultiplier * nBet;
                result.dictAnalyseResult["nMultiple"] = StringUtil.addNumbers(result.dictAnalyseResult["nMultiple"] ? result.dictAnalyseResult["nMultiple"] : 0, winMultiplier);
                AllWinNum += win_num;
                const win_line = nHandCards.map((_, i) => x.includes(i));
                WinLinesList.push({ "win_num": win_num, "win_line": win_line });
            }
        });

        nWinLines.forEach(nWinLine => {
            nWinLine.forEach(o => {
                AllWinLinesList[o] = true;
            });
        });
    }

    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    const len = nHandCards.filter(card => card === nFreeCard).length;
    if (gameId === 263) {
        if (len < 3) {
            bIsFree = false;
            nFreeNum = 0;
        } else if (len === 3) {
            bIsFree = true;
            nFreeNum = 12;
        } else if (len === 4) {
            bIsFree = true;
            nFreeNum = 15;
        } else if (len >= 5) {
            bIsFree = true;
            nFreeNum = 20;
        }
    }else if(gameId === 285){
        if (len < 2) {
            bIsFree = false;
            nFreeNum = 0;
        } else if (len === 2) {
            bIsFree = true;
            nFreeNum = 5;
        } else if (len === 3) {
            bIsFree = true;
            nFreeNum = 8;
        } else if (len === 4) {
            bIsFree = true;
            nFreeNum = 15;
        }else if (len >= 5) {
            bIsFree = true;
            nFreeNum = 25;
        }
    }
    // 免费次数
    result.dictAnalyseResult["getFreeTime"] = { "bFlag": bIsFree, "nFreeTime": nFreeNum };
    return result;
};






module.exports.footballCardsHandle = function (config, result, freeMul, bFreeTimeFlag, nBet){
    let nHandCards = result.nHandCards;
    HandCardsAnalyse_MixFootball(nHandCards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,nBet, config.icon_mul, config, result);

    /*log.info('start-----------------------------------')
    this.handCardLog(nHandCards, 6, 6)*/

    const superCardList = result.dictAnalyseResult["sr"];
    const superCardDetailList = result.dictAnalyseResult["srd"];

    let resDictList = [];
    let new_hand_card = [];
    for (let i in nHandCards) {
        new_hand_card.push(parseInt(nHandCards[i]) + 1)
    }
    result.dictAnalyseResult["nHandCards"] = new_hand_card;
    resDictList.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));

    var combo_num = 0;
    var all_win = 0;
    var box_win = 0;
    while (true) {
        if (Number(result.dictAnalyseResult["win"]) > 0) { // 中奖了
            all_win = StringUtil.addNumbers(all_win, result.dictAnalyseResult["win"]);
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
                        if(config.jackpotCard !== nHandCards[x]){ // jackpot 不消除
                            nHandCards[x] = -1;
                        }
                    }
                }
            }
            //log.info('替换中奖手牌位置')
            //this.handCardLog(nHandCards, 6, 6);

            // console.log("typeList:" + JSON.stringify(typeList));
            //整合需要替换的卡牌
            for (let i in typeList) {
                if (typeList[i] === 1) {
                    delete superCardList[i];
                    delete superCardDetailList[i];
                } else if (typeList[i] === 2) {
                    let newCard = config.cards[StringUtil.RandomNumBoth(0, 4)];
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

            // 变图案
            nHandCards = changleCard([...nHandCards], config, nBet, result, combo_num)

            nHandCards.reverse();
            result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
            HandCardsAnalyse_MixFootball(nHandCards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,nBet, config.icon_mul, config, result);
            /*this.handCardLog(nHandCards, 6, 6)*/

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
            result.dictAnalyseResult["win"] = StringUtil.rideNumbers(result.dictAnalyseResult["win"], mul, 2);
            //log.info('足球连击数:'+ combo_num + '加倍' + mul + '连击后赢:' + result.dictAnalyseResult["win"])

            if (bFreeTimeFlag){
                result.dictAnalyseResult["win"] = StringUtil.rideNumbers(result.dictAnalyseResult["win"], freeMul, 2);
                //log.info('足球免费模式下累积翻倍' + freeMul + '翻倍后赢:' + result.dictAnalyseResult["win"])
                // 下一轮升级倍数
                result.dictAnalyseResult["fMultiple"] = freeMul + 1;
            }

            result.dictAnalyseResult["sr"] = superCardList;
            result.dictAnalyseResult["srd"] = superCardDetailList;
            resDictList.push(JSON.parse(JSON.stringify(result.dictAnalyseResult)));
        } else {
            break;
        }
    }
    // 连线总赢分
    result.dictAnalyseResult["win"] = all_win;
    result.resDictList = resDictList;
    result.superCardDetailList = superCardDetailList;
    result.superCardList = superCardList;

}

/**
 *  根据连击数决定变什么图案
 * @param nHandCards
 * @param config
 * @param nBet 每根线的下注
 * @param result
 * @param comboNum 连击数
 * @returns {*[]}
 */
function changleCard(nHandCards, config, nBet, result, comboNum){
    const cards = [...nHandCards]
    let times = 0;
    while(true){
        times ++;
        result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
        HandCardsAnalyse_MixFootball(cards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,nBet, config.icon_mul, config, result);
        const bWin = Number(result.dictAnalyseResult["win"])


        for (let n_h_i in cards) {
            if (cards[n_h_i] === -1) {
                if (parseInt(n_h_i) + 6 < 36 && cards[parseInt(n_h_i) + 6] !== -1) {
                    cards[n_h_i] = cards[parseInt(n_h_i) + 6];
                    cards[parseInt(n_h_i) + 6] = -1;
                } else if (parseInt(n_h_i) + 12 < 36 && cards[parseInt(n_h_i) + 12] !== -1) {
                    cards[n_h_i] = cards[parseInt(n_h_i) + 12];
                    cards[parseInt(n_h_i) + 12] = -1;
                } else if (parseInt(n_h_i) + 18 < 36 && cards[parseInt(n_h_i) + 18] !== -1) {
                    cards[n_h_i] = cards[parseInt(n_h_i) + 18];
                    cards[parseInt(n_h_i) + 18] = -1;
                } else if (parseInt(n_h_i) + 24 < 36 && cards[parseInt(n_h_i) + 24] !== -1) {
                    cards[n_h_i] = cards[parseInt(n_h_i) + 24];
                    cards[parseInt(n_h_i) + 24] = -1;
                } else if (parseInt(n_h_i) + 30 < 36 && cards[parseInt(n_h_i) + 30] !== -1) {
                    cards[n_h_i] = cards[parseInt(n_h_i) + 30];
                    cards[parseInt(n_h_i) + 30] = -1;
                } else {
                    let min = 0;
                    let max = 10; // 随机默认不出免费，百变，jackpot
                    // 0-4是小倍图案
                    if(result.currRtp > 70){
                        max = 4;
                    }

                    const col = n_h_i % 6;
                    // RTP太低，出百变提升中奖率
                    if(result.currRtp < 30 && !config.newHandFlag && !cards.includes(config.nGameMagicCardIndex) &&  col !== 0){
                        min = 12;
                        max = 12;
                    }
                    let cardIndex = StringUtil.RandomNumBoth(min, max);
                    cards[n_h_i] = config.cards[cardIndex] ;
                }
            }
        }
        result.dictAnalyseResult = analyse_result.initResult(config.nBetSum);
        HandCardsAnalyse_MixFootball(cards, config.col_count, config.nGameMagicCardIndex, config.nGameLineWinLowerLimitCardNumber, config.freeCards ,nBet, config.icon_mul, config, result);
        // 变牌次数超过30次或者变之前跟变之后赢的是一样的 返回
        if(times > 30 || bWin === Number(result.dictAnalyseResult["win"])){
            break;
        }
        if(comboNum >= 2 && Number(result.dictAnalyseResult["win"]) > 0){
            // log.info("足球连击数大于等于2且变出的图案为赢,重新变图案=======================================================================")
            continue;
        }
        break;
    }
    return cards;
}

const categories = {
    '黑色': ['黑桃', '黑梅花'],
    '红色': ['红心', '红方块']
};

const mainCategories = Object.keys(categories);

// 随机选择花色
exports.getRandomColor = function () {
    const allSuits = mainCategories.flatMap(category => categories[category]);
    const randomIndex = Math.floor(Math.random() * allSuits.length);
    return allSuits[randomIndex];
}


function isSubset(subset, array) {
    return subset.every(elem => array.includes(elem));
}


function RandomNumForList(arr) {
    //从指定数组中选取随机值
    return arr[Math.floor((Math.random() * arr.length))]
}
function es6_set(arr) {
    //es6 数组去重
    return Array.from(new Set(arr));
}

function list_remove(val, list) {
    //数组去除指定元素
    //用法 list.remove(元素)
    var index = list.indexOf(val);
    if (index > -1) {
        list.splice(index, 1);
    }
}


function RandomNumForList(arr) {
    //从指定数组中选取随机值
    return arr[Math.floor((Math.random() * arr.length))]
}

function RandomNumBoth(Min, Max) {
    //生成指定范围内随机整数
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}

function list_one_count(x, list) {
    //数组中指定值出现次数
    var count = 0;
    for (var i in list) {
        if (list[i] == x) {
            count++
        }
    }
    return count;
}


