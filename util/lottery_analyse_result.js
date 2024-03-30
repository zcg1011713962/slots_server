const http_bc = require("./../util/http_broadcast");
const log = require("../CClass/class/loginfo")

exports.initResult  = function (nBetSum) {
    // 初始化手牌结果
    return {
        code: 2,
        nHandCards: [],  //# 结果手牌
        nWinLines: [],  //# 中奖的线数的检索
        nWinLinesDetail: [],  //# 中奖线数上中奖的牌的检索
        nWinDetail: [],  //# 每条线中多少钱
        nBet: nBetSum, // # 下注总额
        win: 0,  //# 中奖总额
        nWinCards: [],  //# 位数与手牌数相同，中奖的为True，没中奖的为False
        getOpenBox: {   // 开宝箱
            bFlag: false,
            nWinOpenBox: 0
        },
        getFreeTime: { // 免费次数
            bFlag: false,
            nFreeTime: 0,
            nIndex: 0
        },
        bonusList: [null, null, null], // 轮子大奖
        getBigWin: { // 空白图案-特殊奖
            bFlag: false,
        },
        getJackpot:{  // jackpot奖
            bFlag: false,
            bVal: 0
        },
        nMultiple: 0,
        nWinCardsDetail: [],
        nBetTime: Number(new Date())
    };
}

exports.build  = function build(dictAnalyseResult, gameName, nHandCards, userId, nBetSum, winscore, freeCount, GamblingBalanceLevelBigWin, user, sendMessage_mul){
    try {
        //判断是否需要发送中奖信息到通知服
        if (http_bc && dictAnalyseResult["win"] >= nBetSum * sendMessage_mul) {
            let data = {
                userId: userId,
                nickName: user._nickname,
                gameName: gameName,
                win: dictAnalyseResult["win"]
            };
            http_bc.send(data);
        }
    }catch (e){
        log.err(e)
    }

    if(nHandCards) {
        // 手牌加1处理，返回给客户端
        dictAnalyseResult["nHandCards"] = [];
        for (let i in nHandCards) {
            dictAnalyseResult["nHandCards"].push(parseInt(nHandCards[i]) + 1)
        }
    }

    // 增加免费次数，增加金币
    user.winscore(winscore);
    user.AddFreeCount(freeCount);
    // 剩余免费次数
    const resFreeCount = user.getFreeCount();
    if (resFreeCount) {
        dictAnalyseResult["is_free"] = true;
    } else {
        dictAnalyseResult["is_free"] = false;
    }
    dictAnalyseResult["user_score"] = user.getScore();
    dictAnalyseResult["getFreeTime"]["nFreeTime"] = resFreeCount;
    return JSON.stringify(dictAnalyseResult);
}


exports.lotteryReturn = function lotteryReturn(score_current, winscore, freeCount, resFreeCount, dictAnalyseResult, scorePool){
    return {
        code: 1,
        userscore: score_current,
        winscore: winscore,
        viewarray: dictAnalyseResult,
        winfreeCount: freeCount,
        freeCount: resFreeCount,
        score_pool: scorePool
    };
}