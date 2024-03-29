const schedule = require('node-schedule');
const CacheUtil = require('../../util/cache_util')
const log = require('../../CClass/class/loginfo').getInstand

// 定义每日定时任务
const dayJob = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        CacheUtil.clearVIPDailyGetKey();
        log.info('每日清理数据！');
    } catch (error) {
        log.err('每日清理数据：'+ error);
    }
});


// 定义每月定时任务
const monthJob = schedule.scheduleJob('0 0 1 * *', async () => {
    try {
        CacheUtil.clearVIPMonthlyGetKey();
        log.info('每月清理数据！');
    } catch (error) {
        log.err('每月清理数据：'+ error);
    }
});