
exports.record  = function record(socket, lines, serverId, gameId, userId, nBetSum, winscore, score_before, score_current, freeCount, sourceFreeCount, resFreeCount, changeType, lotteryLogList, scoreChangeLogList, resultArray) {
    // 摇奖日志
    lotteryLogList.push({
        userid: userId,
        bet: nBetSum,
        lines: lines,
        nBetSum: nBetSum,
        score_before: score_before,
        score_win: winscore,
        score_current: score_current,
        result_array: resultArray,
        score_linescore: nBetSum,
        free_count_win: freeCount,
        free_count_before: sourceFreeCount,
        free_count_current: resFreeCount
    });

    // 金币变化量日志
    scoreChangeLogList.push({
        userid: userId,
        score_before: score_before,
        score_change: winscore - nBetSum,
        score_current: score_current,
        change_type: changeType,
        isOnline: true
    });

    // 用户输赢日志
    const CoinLog = [];
    CoinLog.push({
        userId: userId,
        useCoin: nBetSum,
        winCoin: winscore - nBetSum,
        tax: 0,
        serverId: serverId,
        gameId: gameId
    });
    socket.emit("insertMark", CoinLog);
};