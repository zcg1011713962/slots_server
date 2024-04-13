const schedule = require('node-schedule');
const CacheUtil = require('../../util/cache_util')
const log = require('../../CClass/class/loginfo').getInstand

// 定义每日定时任务
const dayJob = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        log.info('开始清理VIP每日领取状态');
        CacheUtil.clearVIPDailyGetKey();

        log.info('开始清理每日领取幸运币上限');
        CacheUtil.clearLuckyCoinLimit();

    } catch (error) {
        log.err('每日清理数据：'+ error);
    }
});


// 定义每月定时任务
const monthJob = schedule.scheduleJob('0 0 1 * *', async () => {
    try {
        log.info('开始清理VIP每月领取状态');
        CacheUtil.clearVIPMonthlyGetKey();
    } catch (error) {
        log.err('每月清理数据：'+ error);
    }
});