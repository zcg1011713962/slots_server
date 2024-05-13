const schedule = require('node-schedule');
const CacheUtil = require('../../util/cache_util')
const {getInstand: gameInfo} = require("./game");
const log = require('../../CClass/class/loginfo').getInstand
const TypeEnum = require('../../util/enum/type')
const StringUtil = require('../../util/string_util')
const LanguageItem = require("../../util/enum/language");
const dao = require('../../util/dao/dao')

exports.initDayJob = function (userList){
    // 定义每日定时任务
    const dayJob = schedule.scheduleJob('0 0 * * *', async () => {
        log.info('开始清理VIP每日领取状态');
        CacheUtil.clearVIPDailyGetKey();
        log.info('开始清理每日领取幸运币上限');
        CacheUtil.clearLuckyCoinLimit();
        log.info('每日红点事件推送');
        pushRedPoint(userList);
    })

    // 定义每分钟定时任务
    const mJob = schedule.scheduleJob('*/1 * * * *', async () => {
        try {
            // 发排行榜奖励
            CacheUtil.getRankTime((coinRankStartTime, rechargeRankStartTime, bigWinStartTime, coinRankEndTime, rechargeRankEndTime, bigWinEndTime) =>{
                const coinRankEndDate = coinRankEndTime === -1 ? -1 : new Date(coinRankEndTime);
                const rechargeRankEndDate = rechargeRankEndTime === -1 ? -1 : new Date(rechargeRankEndTime);
                const bigWinEndDate = bigWinEndTime === -1 ? -1 : new Date(bigWinEndTime);
                // 获取日期的时间戳（即去掉小时、分钟、秒、毫秒的部分）
                const coinRankEndTimestamp = coinRankEndDate === -1 ? -1 :  new Date(coinRankEndDate.getFullYear(), coinRankEndDate.getMonth(), coinRankEndDate.getDate()).getTime();
                const rechargeRankEndTimestamp = rechargeRankEndDate === -1 ? -1 : new Date(rechargeRankEndDate.getFullYear(), rechargeRankEndDate.getMonth(), rechargeRankEndDate.getDate()).getTime();
                const bigWinEndTimestamp = bigWinEndDate === -1 ? -1 :  new Date(bigWinEndDate.getFullYear(), bigWinEndDate.getMonth(), bigWinEndDate.getDate()).getTime();

                const currentDate = new Date();
                const currentDateTimestamp = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
                log.info('金币排行榜结束日期:' + coinRankEndTimestamp + '充值排行榜结束日期:' + rechargeRankEndTimestamp + '大富豪排行榜结束日期:' + bigWinEndTimestamp + '当前日期:' + currentDateTimestamp)

                CacheUtil.getRankConfig().then(config =>{
                    CacheUtil.getRankAwardConfig((coinRankJackpot, rechargeRankJackpot, bigWinRankJackpot, rankRatioList) =>{
                        if(coinRankEndTimestamp !== -1 && coinRankEndTimestamp <= currentDateTimestamp){ // 金币排行发奖励
                            config.rankRatioStartTimes.coinRankStartTime = currentDateTimestamp;  // 更新赛季开始时间
                            rankAward(TypeEnum.RankType.coin, coinRankStartTime, coinRankEndTime, coinRankJackpot, rechargeRankJackpot, bigWinRankJackpot, rankRatioList)
                        }
                        if(rechargeRankEndTimestamp !== -1 &&  rechargeRankEndTimestamp <= currentDateTimestamp){ // 充值排行发奖励
                            config.rankRatioStartTimes.rechargeRankStartTime = currentDateTimestamp;  // 更新赛季开始时间
                            rankAward(TypeEnum.RankType.recharge, rechargeRankStartTime, rechargeRankEndTime, coinRankJackpot, rechargeRankJackpot, bigWinRankJackpot, rankRatioList)
                        }
                        if(bigWinEndTimestamp !== -1 &&  bigWinEndTimestamp <= currentDateTimestamp){ // 大富豪排行发奖励
                            // 更新赛季开始时间
                            config.rankRatioStartTimes.bigWinStartTime = currentDateTimestamp; // 更新赛季开始时间
                            rankAward(TypeEnum.RankType.bigwin, bigWinStartTime, bigWinEndTime, coinRankJackpot, rechargeRankJackpot, bigWinRankJackpot, rankRatioList)
                        }
                        // 更新排行榜赛季开始时间
                        CacheUtil.updateRankConfig(config);
                    })
                })
            })
            // 发首充持续奖励
            dao.searchfirstRechargeAwardRecord(rows =>{
                if(rows){
                    rows.forEach(row =>{
                        const userId = row.userId;
                        const id = row.id;
                        gameInfo.saveEmail(LanguageItem.month_card_continue_award_title, TypeEnum.EmailType.first_recharge_continue_award, userId, 0, LanguageItem.month_card_continue_award_content, id, TypeEnum.GoodsType.mixture)
                    })
                }
            });
        } catch (error) {
            log.err('执行每日定时任务：'+ error);
        }
    });
}

exports.initMonthJob = function (){
    // 定义每月定时任务
    const monthJob = schedule.scheduleJob('0 0 1 * *', async () => {
        try {
            log.info('开始清理VIP每月领取状态');
            CacheUtil.clearVIPMonthlyGetKey();
        } catch (error) {
            log.err('每月清理数据：'+ error);
        }
    });
}


exports.interval = function (gameInfo) {
    const period = 2000;
    setInterval(function () {
        // 幸运币活动刷新
        gameInfo.refreshLuckCoinActivity();
        // 批量更新用户信息
        gameInfo.batchUpdateAccount();
        // 保存log
        gameInfo.score_changeLog();
        gameInfo.diamond_changeLog();
    }, period);
}

function pushRedPoint(userList){
    for (const userId in userList) {
        let luckObject = {
            luckyCoin: 0,
            luckyRushStartTime: 0,
            luckyRushEndTime: 0,
            luckyCoinGetStatus: 0
        }
        gameInfo.loginUserInfo(userId, luckObject, (ret) =>{
            if(ret.dailyGet){
                log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.vipDailyGet)
                userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.vipDailyGet}});
            }
            if(ret.monthlyGet){
                log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.vipMonthlyGet)
                userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.vipMonthlyGet}});
            }
            if(ret.currSignInFlag === 0){
                log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.currSignIn)
                userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.currSignIn}});
            }
            if(ret.unReadEmail === 1){
                log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.email)
                userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.email}});
            }
            if(ret.currDateInvite === 1){
                log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.bindPromote)
                userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.bindPromote}});
            }
        })
    }
}


function rankAward (type,rankStartTime, rankEndTime, coinRankJackpot, rechargeRankJackpot, bigWinRankJackpot, rankRatioList){
    // 奖励人数
    const awardNum = rankRatioList.length;
    rankRatioList.sort((a, b) => a - b);
    const sum = rankRatioList.reduce((acc, val) => acc + val, 0);
    const percentages = rankRatioList.map(element => (element / sum));
    // 奖励各名次的奖池比例
    if(TypeEnum.RankType.coin === type){
        // 金币排行
        gameInfo.searchCoinRank(coinRank =>{
            const awardUsers = coinRank.slice(0, awardNum);
            // 给每个用户发奖励
            for(let i = 0; i < awardUsers.length; i++){
                const userId = awardUsers[i].userId;
                const currAwardVal = StringUtil.rideNumbers(coinRankJackpot, percentages[i], 2)
                log.info('金币排行榜给用户:' + userId  + '金币数量:' + currAwardVal + '名次:' + (i + 1))
                // 插入排行奖励表
                dao.rankAwardRecord(userId, type, TypeEnum.GoodsType.gold, currAwardVal, rankStartTime, rankEndTime, (i + 1), insertId =>{
                    CacheUtil.DecrJackpot(currAwardVal).then(r =>{
                        // 发邮件奖励
                        gameInfo.saveEmail(LanguageItem.coin_rank_award_title, TypeEnum.EmailType.rank_award, userId, 0, LanguageItem.coin_rank_award_content, insertId, TypeEnum.GoodsType.gold)
                    });
                })
            }
        })
    }else if(TypeEnum.RankType.recharge === type){
        // 充值排行
        gameInfo.searchRechargeRank(rechargeRank =>{
            const awardUsers = rechargeRank.slice(0, awardNum);
            // 给每个用户发奖励
            for(let i = 0; i < awardUsers.length; i++){
                const userId = awardUsers[i].userId;
                const currAwardVal = StringUtil.rideNumbers(rechargeRankJackpot, percentages[i], 2)
                log.info('充值排行榜给用户:' + userId + '金币数量:' + currAwardVal + '名次:' + (i + 1))
                // 插入充值奖励表
                dao.rankAwardRecord(userId, type, TypeEnum.GoodsType.gold, currAwardVal, rankStartTime, rankEndTime, (i + 1), insertId =>{
                    CacheUtil.DecrJackpot(currAwardVal).then(r =>{
                        // 发邮件奖励
                        gameInfo.saveEmail(LanguageItem.coin_rank_award_title, TypeEnum.EmailType.rank_award, userId, 0, LanguageItem.coin_rank_award_content, insertId, TypeEnum.GoodsType.gold)
                    })
                })
            }
        })
    }else if(TypeEnum.RankType.bigwin === type){
        // 大富豪排行
        gameInfo.searchBigWinToday(bigWinTodayRank =>{
            const awardUsers = bigWinTodayRank.slice(0, awardNum);
            // 给每个用户发奖励
            for(let i = 0; i < awardUsers.length; i++){
                const userId = awardUsers[i].userId;
                const currAwardVal = StringUtil.rideNumbers(bigWinRankJackpot, percentages[i], 2)
                log.info('大富豪排行排行榜给用户:' +'金币数量:' + currAwardVal + '名次:' + (i + 1))
                // 插入充值奖励表
                dao.rankAwardRecord(userId, type, TypeEnum.GoodsType.gold, currAwardVal, rankStartTime, rankEndTime, (i + 1), insertId =>{
                    CacheUtil.DecrJackpot(currAwardVal).then(r =>{
                        // 发邮件奖励
                        gameInfo.saveEmail(LanguageItem.coin_rank_award_title, TypeEnum.EmailType.rank_award, userId, 0, LanguageItem.coin_rank_award_content, insertId, TypeEnum.GoodsType.gold)
                    })
                })
            }
        })
    }
}

