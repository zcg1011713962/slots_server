const schedule = require('node-schedule');
const CacheUtil = require('../../util/cache_util')
const {getInstand: gameInfo} = require("./game");
const log = require('../../CClass/class/loginfo').getInstand
const TypeEnum = require('../../util/enum/type')


exports.initDayJob = function (userList){
    // 定义每日定时任务
    const dayJob = schedule.scheduleJob('0 0 * * *', async () => {
        try {
            log.info('开始清理VIP每日领取状态');
            CacheUtil.clearVIPDailyGetKey();

            log.info('开始清理每日领取幸运币上限');
            CacheUtil.clearLuckyCoinLimit();

            log.info('每日红点事件推送');
            for (const userId in userList) {
                let luckObject = {
                    luckyCoin: 0,
                    luckyRushStartTime: 0,
                    luckyRushEndTime: 0,
                    luckyCoinGetStatus: 0
                }
                gameInfo.loginUserInfo(userId, luckObject, (ret) =>{
                    if(ret.dailyGet || ret.monthlyGet){
                        log.info(userId + '推送红点事件类型' + TypeEnum.UndoEvenType.vipGet)
                        userList[userId]._socket.emit('undoEven', {code: 1, data: {type: TypeEnum.UndoEvenType.vipGet}});
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
        } catch (error) {
            log.err('每日清理数据：'+ error);
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

