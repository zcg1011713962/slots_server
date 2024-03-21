const schedule = require('node-schedule');
const CacheUtil = require('../../util/cache_util')

// 定义每日定时任务
const dayJob = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        CacheUtil.clearVIPDailyGetKey();
        console.log('每日清理数据！');
    } catch (error) {
        console.error('每日清理数据：', error);
    }
});


// 定义每月定时任务
const monthJob = schedule.scheduleJob('0 0 1 * *', async () => {
    try {
        CacheUtil.clearVIPMonthlyGetKey();
        console.log('每月清理数据！');
    } catch (error) {
        console.error('每月清理数据：', error);
    }
});