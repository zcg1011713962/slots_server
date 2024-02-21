const http_bc = require("./../util/http_broadcast");
exports.build  = function build(dictAnalyseResult, gameName, nHandCards, userId, nBetSum, winscore, freeCount, GamblingBalanceLevelBigWin, user, sendMessage_mul){
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
    if(nHandCards) {
        // 手牌加1处理，返回给客户端
        dictAnalyseResult["nHandCards"] = [];
        for (let i in nHandCards) {
            dictAnalyseResult["nHandCards"].push(parseInt(nHandCards[i]) + 1)
        }
    }
    console.log("库存", GamblingBalanceLevelBigWin.nGamblingBalanceGold);
    console.log("用户赢金币", winscore);

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