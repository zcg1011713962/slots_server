const http_bc = require("./../util/http_broadcast");
const log = require("../CClass/class/loginfo").getInstand
const CacheUtil = require('../util/cache_util')
const TypeEnum = require('../util/enum/type')
const StringUtil = require('../util/string_util')
const ErrorCode = require("./ErrorCode");

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
            nIndex: 0,
            card: [], // 挖矿游戏特殊玩法
            cardList: []  // 挖矿游戏特殊玩法
        },
        bonusList: [null, null, null], // 轮子开宝箱
        getBigWin: { // 老虎特殊玩法
            bFlag: false,
        },
        getJackpot:{  // jackpot奖
            bFlag: false,
            bVal: 0
        },
        fWildNum: 0, // 大象、公牛特殊玩法
        fWildTotalNum: 0, // 大象、公牛特殊玩法
        goldWin: [], // 挖矿游戏特殊玩法赢分
        goldWinDetail: {}, // 挖矿游戏特殊玩法赢分详情
        nMultiple: 0,
        mul: 0,
        nWinCardsDetail: [],
        nBetTime: Number(new Date())
    };
}

exports.winNoticeMsg  = function (config, user, dictAnalyseResult, result){
    try {
        // 击中奖池跑马灯
        if (http_bc && dictAnalyseResult['getJackpot'].bFlag) {
            const noticeMsg = [{
                type: TypeEnum.notifyType.hitJackpot, // 4
                content_id: ErrorCode.HIT_JACKPOT_NOTIFY.code, // p0004
                extend: {
                    userId: config.userId,
                    nickName: user.nickname,
                    headimgurl: user.headimgurl,
                    gameName: config.gameName,
                    gameId: config.gameId,
                    jackpot: dictAnalyseResult['getJackpot'].bVal,
                    jackpotIndex: config.jackpotIndex
                }
            }]
            http_bc.sendNoticeMsg(noticeMsg);
            log.info(config.userId + '击中奖池,发送跑马灯')
        }
        CacheUtil.getNoticeConfig().then(cf => {
            const nSwitch = cf.noticeSystemControl ? Number(cf.noticeSystemControl) : 0;
            const noticeSystemScore = cf.noticeSystemScore;
            // 中奖大于配置，侧边栏展示
            if(nSwitch === 1 && noticeSystemScore && Number(noticeSystemScore) < result.winItem.finVal){
                const noticeMsg = [{
                    type: TypeEnum.notifyType.bigWin, // 5
                    content_id: ErrorCode.BIG_WIN_NOTIFY.code, // p0005
                    extend: {
                        userId: config.userId,
                        nickName: user.nickname,
                        headimgurl: user.headimgurl,
                        gameName: config.gameName,
                        gameId: config.gameId,
                        bigWin: result.winItem.finVal
                    }
                }]
                http_bc.sendNoticeMsg(noticeMsg);
                log.info(config.userId + '中奖大于配置，侧边栏展示')
            }
        });
    }catch (e){
        log.err('击中奖池跑马灯到通知服' + e)
    }
}

exports.analyseResultBuild = function (currFreeCount, currGoldCoin, dictAnalyseResult){
    if (currFreeCount) {
        dictAnalyseResult["is_free"] = true;
    } else {
        dictAnalyseResult["is_free"] = false;
    }
    dictAnalyseResult["user_score"] = currGoldCoin;
    if(currFreeCount > 0){
        dictAnalyseResult["getFreeTime"]['bFlag'] = true;
    }
    dictAnalyseResult["getFreeTime"]["nFreeTime"] = currFreeCount;
    return JSON.stringify(dictAnalyseResult);
}


exports.lotteryReturn = function (currGoldCoin, winscore, freeCount, resFreeCount, dictAnalyseResult, resDictList, newHandFlag){
    if(resDictList.length > 0){ // 足球
        return {
            ResultCode: TypeEnum.LotteryResultCode.normal,
            ResultData: {
                userscore: currGoldCoin,
                winscore: winscore,
                viewarray: resDictList,
                freeCount: freeCount,
                getFreeTime: resFreeCount,
                dictAnalyseResult: dictAnalyseResult,
                newHandFlag: newHandFlag
            }
        }
    }
    return {
        ResultCode: TypeEnum.LotteryResultCode.normal,
        ResultData: {
            userscore: currGoldCoin,
            winscore: winscore,
            viewarray: dictAnalyseResult,
            winfreeCount: freeCount,
            freeCount: resFreeCount,
        }
    }
}