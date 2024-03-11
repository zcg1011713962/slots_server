const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require('../util/redis_laba_win_pool');
const laba_config = require('../util/config/laba_config');
const {getInstand: log} = require("../CClass/class/loginfo");
const ErrorCode = require("./ErrorCode");



const bankPwdErrorTimes= 'bankPwdErrorTimes';
const everydayLuckyCoin= 'everydayLuckyCoin';
const userPlayGameCount= 'userPlayGameCount';

const sendEmailExpireKey = 'send_email_code_expire_';
const sendEmailKey = 'send_email_code_';



// 增加银行输入密码错误次数
exports.addBankPwdErrorCount = function (userId) {
    const key = bankPwdErrorTimes + userId;
    RedisUtil.get(key).then(v =>{
        if(v){
            RedisUtil.client.incrby(key, 1);
        }else{
            RedisUtil.set(key, 0).then(r =>{
                RedisUtil.expire(key, 300).then(a=>{
                    RedisUtil.client.incrby(key, 1);
                });
            });
        }
    })
}
// 查询银行输入密码错误次数
exports.searchBankPwdErrorCount = function (userId) {
    const key = bankPwdErrorTimes + userId;
    return RedisUtil.get(bankPwdErrorTimes);
}


// 获取游戏奖池
exports.getGameJackpot  = function getGameJackpot(socket){
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        // 游戏奖池
        let gameJackpot = jackpot ? jackpot * laba_config.game_jackpot_ratio : 0;
        socket.emit('gameJackpotResult', {
            gameJackpot: gameJackpot.toFixed(2),
            grand_jackpot: (gameJackpot * laba_config.grand_jackpot_ratio).toFixed(2),
            major_jackpot: (gameJackpot * laba_config.major_jackpot_ratio).toFixed(2),
            minor_jackpot: (gameJackpot * laba_config.minor_jackpot_ratio).toFixed(2),
            mini_jackpot: (gameJackpot * laba_config.mini_jackpot_ratio).toFixed(2),
        });
    });
}

exports.pushGameJackpot  = function pushGameJackpot(userList){
    if(userList){
        // 奖池推送
        redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
            for (const item in userList) {
                // 游戏奖池
                let gameJackpot = jackpot ? jackpot * laba_config.game_jackpot_ratio : 0;
                const ret = {
                    gameJackpot: gameJackpot.toFixed(2),
                    grand_jackpot: (gameJackpot * laba_config.grand_jackpot_ratio).toFixed(2),
                    major_jackpot: (gameJackpot * laba_config.major_jackpot_ratio).toFixed(2),
                    minor_jackpot: (gameJackpot * laba_config.minor_jackpot_ratio).toFixed(2),
                    mini_jackpot: (gameJackpot * laba_config.mini_jackpot_ratio).toFixed(2),
                }
                userList[item]._socket.emit("pushGamblingWinPool", ret);
            }
        });
    }
}


// 设置每个用户的幸运配置
exports.activityLuckyConfig  = function activityLuckyConfig(userId, luckyCoinConfig){
    RedisUtil.hget(everydayLuckyCoin, userId).then(ret =>{
        if(!ret){
            // 没进入过每日活动的用户默认配置
            const startTime =  new Date().getTime();
            const endTime = startTime + luckyCoinConfig.luckyRushTime * 60 * 1000;
            const ret = {
                luckyCoin: 0,  // 活动幸运币数量
                doLuckyCoinTask: 0, // 幸运活动每日完成的任务数量
                luckyCoinTask: luckyCoinConfig.luckyCoinTask,
                luckyRushStartTime: startTime,
                luckyRushEndTime: endTime,
                luckyCoinGetStatus: 1 ,// 幸运币领取状态0不可领取 1可领取 默认第一次可领取
                luckyCoinTaskGetStatus: 0 // 任务领取状态0不可领取 1可领取
            }
            RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(ret));
        }
    });
}

// 更新用户幸运活动配置
exports.updateActivityLuckyConfig  = function updateActivityLuckyConfig(userId, data){
    // 更新用户配置
    return RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(data));
}


// 获取每个用户的幸运配置
exports.getActivityLuckyDetailByUserId  = function getActivityLuckyDetailByUserId(userId, callback){
    RedisUtil.hget(everydayLuckyCoin, userId).then(ret =>{
        if(ret){
            const luckyDetail = JSON.parse(ret);
            callback(luckyDetail);
        }else {
            callback(null);
        }
    });
}

// 获取所有用户的幸运配置
exports.getActivityLuckyDetail  = function getActivityLuckyDetail(callback){
    RedisUtil.hgetall(everydayLuckyCoin).then(ret =>{
        if(ret){
            callback(ret);
        }else {
            callback(null);
        }
    });
}


// 增加玩家玩游戏次数
exports.addPlayGameCount  = function addPlayGameCount(userId){
    RedisUtil.hget(userPlayGameCount, userId).then(count =>{
        count = count ? count + 1 : 1;
        RedisUtil.hmset(userPlayGameCount, userId, count);
        // 幸运活动增加玩游戏次数
        RedisUtil.hget(everydayLuckyCoin, userId).then(ret =>{
            const d = JSON.parse(ret);
            const doLuckyCoinTask = d.doLuckyCoinTask;
            d.doLuckyCoinTask = parseInt(doLuckyCoinTask) + 1;
            if(Number(doLuckyCoinTask) < Number(d.luckyCoinTask)){
                RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(d));
            }
        });
    });
}


// 获取玩家玩游戏次数
exports.getPlayGameCount  = function getPlayGameCount(userId){
    return RedisUtil.hget(userPlayGameCount, userId);
}

// 邮箱验证码-存储过期key
exports.cacheEmailExpireCode  = function cacheEmailExpireCode(verificationCode, toEmail, callback){
    try {
        RedisUtil.set(sendEmailExpireKey + toEmail, verificationCode).then(ret1 =>{
            RedisUtil.expire(sendEmailExpireKey + toEmail, 480).then(ret2 =>{
                if(ret1 && ret2){
                    callback(1);
                }else{
                    callback(0);
                }
            });
        });
    }catch (e){
        log.err(e);
        callback(0);
    }
}
// 邮箱验证码-存储
exports.cacheEmailCode  = function cacheEmailCode(verificationCode, toEmail, callback){
    // 邮箱验证码设置
    RedisUtil.set(sendEmailExpireKey + toEmail, verificationCode).then(ret1 =>{
        RedisUtil.expire(sendEmailKey + toEmail, 240).then(ret2 =>{
            if(ret1 && ret2){
                callback(1);
            }else{
                callback(0);
            }
        });
    });
}



