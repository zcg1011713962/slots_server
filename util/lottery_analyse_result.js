const http_bc = require("./../util/http_broadcast");
const log = require("../CClass/class/loginfo").getInstand
const CacheUtil = require('../util/cache_util')
const TypeEnum = require('../util/enum/type')
const StringUtil = require('../util/string_util')

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
        bonusList: [null, null, null], // 轮子开宝箱
        getBigWin: { // 空白图案-特殊奖
            bFlag: false,
        },
        getJackpot:{  // jackpot奖
            bFlag: false,
            bVal: 0
        },
        nMultiple: 0,
        mul: 0,
        nWinCardsDetail: [],
        nBetTime: Number(new Date())
    };
}

exports.build  = function (userId, nickname, gameName, nBetSum, currFreeCount, currGoldCoin, dictAnalyseResult, sendMessage_mul){
    try {
        //判断是否需要发送中奖信息到通知服
        if (http_bc && dictAnalyseResult["win"] >= nBetSum * sendMessage_mul) {
            let data = {
                userId: userId,
                nickName: nickname,
                gameName: gameName,
                win: dictAnalyseResult["win"]
            };
            http_bc.send(data);
        }
    }catch (e){
        log.err('发送中奖信息到通知服' + e)
    }

    if (currFreeCount) {
        dictAnalyseResult["is_free"] = true;
    } else {
        dictAnalyseResult["is_free"] = false;
    }
    dictAnalyseResult["user_score"] = currGoldCoin;
    dictAnalyseResult["getFreeTime"]["nFreeTime"] = currFreeCount;
    return JSON.stringify(dictAnalyseResult);
}


exports.lotteryReturn = function (currGoldCoin, winscore, freeCount, resFreeCount, dictAnalyseResult){
    return {
        ResultCode: TypeEnum.LotteryResultCode.normal,
        ResultData: {
            userscore: currGoldCoin,
            winscore: winscore,
            viewarray: dictAnalyseResult,
            winfreeCount: freeCount,
            freeCount: resFreeCount
        }
    }
}