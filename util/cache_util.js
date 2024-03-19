const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require('../util/redis_laba_win_pool');
const laba_config = require('../util/config/laba_config');
const {getInstand: log} = require("../CClass/class/loginfo");
const ErrorCode = require("./ErrorCode");

const bankPwdErrorTimes= 'bankPwdErrorTimes';
const everydayLuckyCoin= 'everydayLuckyCoin';
const userPlayGameCount= 'userPlayGameCount';
const sendEmailExpireKey = 'sendEmailCodeExpire';
const sendEmailKey = 'sendEmailCode';
const transferCheckKey = 'transferCheck';


const hallConfig = {
    hallConfigKey: 'hallConfig',
    notice_config: 'notice_config',
    vip_config: 'vip_config',
    activity_jackpot_config: 'activity_jackpot_config',
    black_white_list_config: 'black_white_list_config',
    bank_transfer_config: 'bank_transfer_config',
    shop_config: 'shop_config',
    lucky_coin_config: 'lucky_coin_config',
    sign_in_config: 'sign_in_config',
    customer_service_config: 'customer_service_config',
    invite_download_config: 'invite_download_config',
    newhand_protect_config: 'newhand_protect_config'
}


exports.getNoticeConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.notice_config).then(config => JSON.parse(config))
    } catch(e){
        log.err('getNoticeConfig');
    }
}


exports.getVipConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.vip_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getVipConfig');
    }
}

exports.getShopConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.shop_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getShopConfig');
    }
}


exports.getBankTransferConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.bank_transfer_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getBankTransferConfig');
    }
}

exports.getSignInConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.sign_in_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getSignInConfig');
    }
}

exports.getActivityJackpotConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.activity_jackpot_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getActivityJackpotConfig');
    }
}

exports.getLuckyCoinConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.lucky_coin_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getLuckyCoinConfig');
    }
}

exports.getDownloadExtConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.invite_download_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getDownloadExtConfig');
    }
}

exports.getCustomerServiceConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.customer_service_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getCustomerServiceConfig');
    }
}

exports.getNewhandProtectConfig  = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.newhand_protect_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getNewhandProtectConfig');
    }
}

exports.getBlackWhiteListConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.black_white_list_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getBlackWhiteListConfig');
    }
}


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
exports.activityLuckyConfig  = function activityLuckyConfig(userId, callback){
    this.getLuckyCoinConfig().then(luckyCoinConfig =>{
        RedisUtil.hget(everydayLuckyCoin, userId).then(ret =>{
            if(!ret){
                // 没进入过每日活动的用户默认配置
                const startTime =  new Date().getTime();
                const endTime = startTime + luckyCoinConfig.luckyRushTime * 60 * 1000;
                const ret = {
                    luckyCoin: luckyCoinConfig.turntableCoin,  // 活动幸运币数量
                    doLuckyCoinTask: 0, // 幸运活动每日完成的任务数量
                    luckyCoinTask: luckyCoinConfig.luckyCoinTask,
                    luckyRushStartTime: startTime,
                    luckyRushEndTime: endTime,
                    luckyCoinGetStatus: 1 ,// 幸运币领取状态0不可领取 1可领取 默认第一次可领取
                    luckyCoinTaskGetStatus: 0, // 任务领取状态0不可领取 1可领取
                    pushStatus: 1 // 推送状态(防止重复推送用) 默认第一次可领取，所以默认推送
                }
                RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(ret)).then(r =>{
                    callback(1)
                });
            }else{
                callback(1)
            }
        });
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
    try{
        RedisUtil.hget(userPlayGameCount, userId).then(count =>{
            count = count ? parseInt(count) + 1 : 1;
            RedisUtil.hmset(userPlayGameCount, userId, count);
            // 幸运活动增加玩游戏次数
            RedisUtil.hget(everydayLuckyCoin, userId).then(ret =>{
                const d = JSON.parse(ret);
                if(d && d.doLuckyCoinTask){
                    const doLuckyCoinTask = d.doLuckyCoinTask;
                    d.doLuckyCoinTask = parseInt(doLuckyCoinTask) + 1;
                    if(Number(doLuckyCoinTask) < Number(d.luckyCoinTask)){
                        RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(d));
                    }
                }
            });
        });
    }catch (e){
        log.err('addPlayGameCount' + e)
    }
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
    RedisUtil.set(sendEmailKey + toEmail, verificationCode).then(ret1 =>{
        RedisUtil.expire(sendEmailKey + toEmail, 240).then(ret2 =>{
            if(ret1 && ret2){
                callback(1);
            }else{
                callback(0);
            }
        });
    });
}


// 邮箱验证码-校验
exports.verifyEmailCode  = function verifyEmailCode(code, email, callback){
    // 是否过期存储
    RedisUtil.get(sendEmailExpireKey + email).then(expireCode => {
        RedisUtil.get(sendEmailKey + email).then(verificationCode => {
            try {
                if (parseInt(verificationCode) === parseInt(code)) {
                    log.info('校验验证码成功' + email + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code, ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.msg);
                } else if (verificationCode && expireCode === code) {
                    log.info('校验验证码失败，过期的校验码' + email + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_EXPIRED.code, ErrorCode.EMAIL_CODE_EXPIRED.msg);
                } else {
                    log.err('校验验证码失败' + email + ' verificationCode:' + verificationCode + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_FAILED.code, ErrorCode.EMAIL_CODE_FAILED.msg);
                }
            } catch (e) {
                log.err(e);
                log.err('校验验证码失败' + email + ' verificationCode:' + verificationCode + 'code:' + code);
                callback(ErrorCode.EMAIL_CODE_FAILED.code, ErrorCode.EMAIL_CODE_FAILED.msg);
            }
        });
    });
}


// 设置用户调用协议记录
exports.recordUserProtocol  = async function recordUserProtocol(userId, protocol, callback){
    try {
        const key = protocol + '_' + userId;
        const setResult = await RedisUtil.setNxAsync(key, new Date().getTime());
        if (setResult === 1) {
            // 如果设置成功，则设置过期时间
            await RedisUtil.expire(key, 30);
        }
        return setResult;
    }catch (e){
        log.err(e)
    }
}

// 删除用户调用协议记录
exports.delUserProtocol  = async function delUserProtocol(userId, protocol){
    const key = protocol + '_' + userId;
    await RedisUtil.del(key);
}


