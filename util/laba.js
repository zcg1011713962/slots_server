const laba_config = require("./config/laba_config");
const StringUtil = require("./string_util");
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
    if(jackpotCard === undefined || jackpotCard < 0 || StringUtil.findElementCount(iconTypeBind, jackpotCard) < jackpotCardLowerLimit){
        return 0;
    }

    if(iconTypeBind && iconTypeBind.length > 0 && StringUtil.findElementCount(iconTypeBind, jackpotCard) >= jackpotCardLowerLimit){
        const winJackpot = parseInt(jackpot / 10);
        log.info('配牌器winJackpot:' + winJackpot)
        return winJackpot;
    }

    try{
        const minJackpot = jackpot_level_money.reduce((min, current) => Math.min(min, current), Infinity);
        if(jackpot < minJackpot){
            log.info('当前奖池小于配置最低奖池直接跳过奖池，当前奖池:'+ jackpot + '最低配置:' + minJackpot)
            return 0;
        }
        // 中的概率
        let prop = 0;
        for(let i = 0;  i < jackpot_level_money.length; i++){
            if(jackpot_level_money[i] < jackpot){
                prop = jackpot_level_prob[i];
            }
        }
        const num = Math.floor(Math.random() * 100);
        log.info('奖池概率:' + prop + '随机数:' + num)
        if(prop > num){
            // 有中jackpot的机会
            // 判断下注对应的奖池种类
            let jpIndex = 0;
            for(let i = 0;  i < bet_jackpot_level_bet.length; i++){
                if(bet_jackpot_level_bet[i] < nBetSum){
                    jpIndex = bet_jackpot_level_index[i];
                }
            }
            // 下注对应的奖池的概率数组
            const payProps = jackpot_pay_level[jpIndex];

            log.info('奖池概率:' + prop + '奖池种类下标:' + jpIndex + '下注对应的奖池的概率数组:' + payProps)

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
                const JpRatio = jackpot_ratio[payJpIndex];
                const getJp = jackpot * (JpRatio / 100);
                const jp = getJp > 0 ? getJp.toFixed(0) : 0
                log.info('用户通过概率计算，中了jackpot:' + jp)
                return jp;
            }
        }
    }catch (e) {
        log.err(e);
    }
    return 0;
}


module.exports.HandCardsAnalyse = function (nHandCards, nGameLines, nGameCombinations, nGameMagicCardIndex, nGameLineWinLowerLimitCardNumber, nGameLineDirection, bGameLineRule, nBetList, jackpotCard, jp, freeCards, freeTimes, result) {
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
                if (dict1["nNumber"] >= nGameLineWinLowerLimitCardNumber) {
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
    if (freeCards && freeCards.length > 0) {
        result.dictAnalyseResult["getFreeTime"] = FreeTimeAnalyse(nHandCards, freeCards, freeTimes);
    }

    result.dictAnalyseResult["nHandCards"]  = nHandCards;
    return dictAnalyseResult
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
    for (var i in nHandCards) {
        if (freeCards.includes(nHandCards[i])) {
            nCount += freeTimes.get(nHandCards[i])
            nIndex.push(nHandCards[i])
        }
    }


    if(nCount > 0){
        dictResult["nFreeTime"] = nCount;
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




exports.getMulByWeight = function (mulArr, weights) {
    if(weights === undefined) throw new Error('权重配置有误')

    // 根据权重出
    const totalWeight = weights.reduce((sum, ws) => sum + ws, 0);
    const randomValue = Math.random() * totalWeight;
    let currentWeight = 0;
    for (let i = 0; i < weights.length; i++) {
        currentWeight += weights[i];
        if (randomValue <= currentWeight) {
            log.info('总权重:' + totalWeight + '随机出的权重:' + currentWeight + '倍数区间数组下标:' + i)
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
        log.info('上次定住百变的位置' + array)
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
                result.dictAnalyseResult["mul"] = icon_mul[i][0];
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
                result.dictAnalyseResult["mul"] = 8;
            } else if (list_one_count(0, nHandCards) === 2) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(3 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"] += 3 * _bet;
                result.dictAnalyseResult["mul"] = 3;
            } else if (list_one_count(0, nHandCards) === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(1 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"] += 1 * _bet;
                result.dictAnalyseResult["mul"] = 1;
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
                result.dictAnalyseResult["mul"] = mul;
            }else if (wildNum + list_one_count(1, nHandCards) + list_one_count(2, nHandCards) + list_one_count(3, nHandCards) === 3) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(8 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [true, true, true];
                result.dictAnalyseResult["win"] += 8 * _bet;
                result.dictAnalyseResult["mul"] = 8;
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
                result.dictAnalyseResult["mul"] = 3;
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
                        result.dictAnalyseResult["mul"] = icon_mul[card][0];
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
                    result.dictAnalyseResult["mul"] = icon_mul[card][0];
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
                result.dictAnalyseResult["mul"] = 3;
            } else if (list_one_count(0, nHandCards) === 1) {
                haveWin = true;
                result.dictAnalyseResult["nWinLines"].push(0);
                result.dictAnalyseResult["nWinDetail"].push(1 * _bet);
                result.dictAnalyseResult["nWinLinesDetail"].push(nGameLines[0]);
                result.dictAnalyseResult["nWinCards"] = [nHandCards[0] === 0, nHandCards[1] === 0, nHandCards[2] === 0];
                result.dictAnalyseResult["win"]  += 1 * _bet;
                result.dictAnalyseResult["mul"] = 1;
            }
        }

        // 一个免费算一倍
        let nCount = 0;
        for (var i in nHandCards) {
            if (freeCards.includes(nHandCards[i])) {
                nCount += freeTimes.get(nHandCards[i])
            }
        }
        result.dictAnalyseResult["mul"] = result.dictAnalyseResult["mul"] + nCount;
    }
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
 * @param nFreeCard
 * @param nLowerLimit
 * @param nColumnNumber
 * @param nBet
 * @param winJackpot
 * @param game_odds
 * @returns {{}}
 * @constructor
 */
module.exports.AnalyseColumnSolt = function (nHandCards, nMagicCard, nFreeCards, freeTimes, nLowerLimit, nColumnNumber, nBet, winJackpot, game_odds, result) {
    const nFreeCard = nFreeCards.length === 0 ? -1 : nFreeCards[0];
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
    var now_time = Number(new Date());
    //# 校验手牌是否满足列数
    //# 生成列的结合
    var i = 0;
    var columns = [];
    while (i < nColumnNumber) {
        var column = [];
        for (var str_j in nHandCards) {
            var j = parseInt(str_j);
            if (j % nColumnNumber == i) {
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
        if (nWinLines.length == 0) {
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
                    if (nWinLineCards.indexOf(nHandCards[i]) > -1 || nHandCards[i] == nMagicCard) {
                        var temp = [];
                        //# 复制出当前的nWinLine
                        for (var m in nWinLine) {
                            temp.push(nWinLine[parseInt(m)]);
                        }
                        //# 如果nWinLine的长度比列数少一位则满足条件，将角标i添加到新的nWinLine中，然后将nWinLine添加到列表nWinLine中
                        if (temp.indexOf(i) == -1 && nWinLine.length + 1 == nIndex) {
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
                    win_num = game_odds[card][x.length] * nBet
                } else {
                    win_num = game_odds[card][x.length] * nBet;
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
                if (card === nFreeCard) {
                    bIsFree = true;
                    nFreeNum = 10
                }
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

    result.dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
    result.dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
    result.dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
    // result["nBet"] = nBet  //# 下注
    result.dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
    result.dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
    result.dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

    result.dictAnalyseResult["getOpenBox"] = {"bFlag": false, "nWinOpenBox": 0, "win": 0}; //# 开箱子
    result.dictAnalyseResult["getFreeTime"] = {"bFlag": bIsFree, "nFreeTime": nFreeNum};  //# 免费次数
};

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


