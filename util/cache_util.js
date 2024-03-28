const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require('../util/redis_laba_win_pool');
const {getInstand: log} = require("../CClass/class/loginfo");
const ErrorCode = require("./ErrorCode");
const StringUtil = require("./string_util");


const bankPwdErrorTimes= 'bankPwdErrorTimes';
const everydayLuckyCoin= 'everydayLuckyCoin';
const userPlayGameCount= 'userPlayGameCount';
const sendEmailExpireKey = 'sendEmailCodeExpire';
const VIPDailyGetKey = 'VIPDailyGet';
const VIPMonthlyGetKey = 'VIPMonthlyGet';
const userPlayGameWinScore= 'userPlayGameWinScore';
const userInfoKey = 'userInfo';
const sendEmailKey = 'sendEmailCode';
const newHandGuideFlowKey = 'newHandGuideFlow';
const userDiscountLimitedKey = 'userDiscountLimited';

const userSocketProtocolExpireSecond = 30; // 用户协议过期时间
const emailCodeExpireSecond = 600; // 邮箱验证码过期时间
const emailCodeLongExpireSecond = 800; // 过期校验过期时间

const gameConfig = {
    gameConfigKey: 'gameConfig',
    base: 'base',
    nGameLines: 'nGameLines',
    iconInfos: 'iconInfos',
    iconBind: 'iconBind'
}

const jackpotConfig = {
    jackpotConfigKey: 'jackpotConfig'
}


const hallConfig = {
    hallConfigKey: 'hallConfig',
    notice_config: 'notice_config',
    vip_config: 'vip_config',
    black_white_list_config: 'black_white_list_config',
    bank_transfer_config: 'bank_transfer_config',
    shop_config: 'shop_config',
    lucky_coin_config: 'lucky_coin_config',
    sign_in_config: 'sign_in_config',
    invite_download_config: 'invite_download_config',
    newhand_protect_config: 'newhand_protect_config',
    score_config : 'score_config',
    bankrupt_config: 'bankrupt_config',
    turntable_config: 'turntable_config',
    discountLimited_config: 'discountLimited_config'
}


exports.getGameConfig = async function(gameName, gameId){
    try{
        return RedisUtil.hget(gameConfig.gameConfigKey, gameName + gameId).then(config => JSON.parse(config))
    } catch(e){
        log.err('getGameConfig');
    }
}


exports.getJackpotConfig = async function(){
    try{
        return RedisUtil.get(jackpotConfig.jackpotConfigKey).then(config => JSON.parse(config))
    } catch(e){
        log.err('getJackpotConfig');
    }
}


exports.getDiscountLimitedConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.discountLimited_config).then(config => JSON.parse(config))
    } catch(e){
        log.err('getDiscountLimitedConfig');
    }
}

exports.getTurntableConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.turntable_config).then(config => JSON.parse(config))
    } catch(e){
        log.err('getTurntableConfig');
    }
}

exports.getBankruptConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.bankrupt_config).then(config => JSON.parse(config))
    } catch(e){
        log.err('getBankruptConfig');
    }
}

exports.getNoticeConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.notice_config).then(config => JSON.parse(config))
    } catch(e){
        log.err('getNoticeConfig');
    }
}


exports.getScoreConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.score_config).then(config => JSON.parse(config));
    }
    catch(e){
        log.err('getVipConfig');
    }
}

exports.getVipConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.vip_config).then(config => JSON.parse(config).levelConfig)
    }
    catch(e){
        log.err('getVipConfig');
    }
}

exports.getVConfig = async function(){
    try{
        return RedisUtil.hget(hallConfig.hallConfigKey, hallConfig.vip_config).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getVConfig');
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
        return RedisUtil.get(jackpotConfig.jackpotConfigKey).then(config => JSON.parse(config))
    }
    catch(e){
        log.err('getJackpotConfig');
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
exports.getGameJackpot  = function (callback){
    const self = this;
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        self.getJackpotConfig().then(jackpotConfig =>{
            // 游戏奖池
            let gameJackpot = jackpot ? jackpot * (jackpotConfig.jackpot_ratio.game / 100) : 0;
            // 奖池划分比例
            const game_jackpot_ratio = jackpotConfig.game_jackpot_ratio;
            const grandJackpot =  Math.floor((gameJackpot * game_jackpot_ratio[0].ratio / 100).toFixed(2));
            const majorJackpot = Math.floor((gameJackpot * game_jackpot_ratio[1].ratio / 100).toFixed(2));
            const minorJackpot = Math.floor((gameJackpot * game_jackpot_ratio[2].ratio / 100).toFixed(2));
            const miniJackpot = Math.floor((gameJackpot * game_jackpot_ratio[3].ratio / 100).toFixed(2));
            const gJackpot= Math.floor(gameJackpot.toFixed(2));
            callback(gJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot)
        });
    });
}


exports.delayPushGameJackpot = function (userInfo, userList) {
    let u = userInfo;
    let items = userList;

    // 延时1秒发送跑马灯
    setTimeout(() => {
        const us = []
        us[u.userid] = items[u.userid];
        this.pushGameJackpot(us);
    }, 1000);
}


exports.pushGameJackpot  = function (userList){
    if(userList && userList.length > 0){
        this.getGameJackpot((gJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot) =>{
            for (const userId in userList) {
                const jackpot = {
                    gameJackpot: gJackpot,
                    grand_jackpot: grandJackpot,
                    major_jackpot: majorJackpot,
                    minor_jackpot: minorJackpot,
                    mini_jackpot: miniJackpot,
                }
                log.info('推送奖池数据' + userId + 'jackpot' + JSON.stringify(jackpot) + 'user:' + userList[userId])
                if(userList[userId]) userList[userId]._socket.emit("pushGamblingWinPool", jackpot);
            }
        })
    }
}


// 设置每个用户的幸运配置
exports.activityLuckyConfig  = function (userId, callback){
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
exports.updateActivityLuckyConfig  = function (userId, data){
    // 更新用户配置
    return RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(data));
}


// 获取每个用户的幸运配置
exports.getActivityLuckyDetailByUserId  = function (userId, callback){
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
exports.getActivityLuckyDetail  = function (callback){
    RedisUtil.hgetall(everydayLuckyCoin).then(ret =>{
        if(ret){
            callback(ret);
        }else {
            callback(null);
        }
    });
}


// 增加玩家玩游戏次数
exports.addPlayGameCount = function (userId){
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
                    if(StringUtil.compareNumbers(doLuckyCoinTask, d.luckyCoinTask)){
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
exports.getPlayGameCount  = function (userId){
    return RedisUtil.hget(userPlayGameCount, userId);
}


// 获取玩家赢金币数值
exports.getPlayGameWinscore  = function getPlayGameWinscore(userId){
    return RedisUtil.hget(userPlayGameWinScore, userId);
}

// 记录玩家赢金币数值
exports.playGameWinscore  = function playGameWinscore(userId, winScore){
    this.getPlayGameWinscore(userId).then(winscore =>{
        const oldWin = winscore ? winscore : 0;
        const win = Number(oldWin) +  Number(winScore);
        return RedisUtil.hmset(userPlayGameWinScore, userId, win);
    })
}

// 邮箱验证码-存储过期key
exports.cacheEmailExpireCode  = function (verificationCode, toEmail, callback){
    try {
        RedisUtil.set(sendEmailExpireKey + toEmail, verificationCode).then(ret1 =>{
            RedisUtil.expire(sendEmailExpireKey + toEmail, emailCodeLongExpireSecond).then(ret2 =>{
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
exports.cacheEmailCode  = function (verificationCode, toEmail, callback){
    // 邮箱验证码设置
    RedisUtil.set(sendEmailKey + toEmail, verificationCode).then(ret1 =>{
        RedisUtil.expire(sendEmailKey + toEmail, emailCodeExpireSecond).then(ret2 =>{
            if(ret1 && ret2){
                callback(1);
            }else{
                callback(0);
            }
        });
    });
}


// 邮箱验证码-校验
exports.verifyEmailCode  = function (code, email, callback){
    // 是否过期存储
    RedisUtil.get(sendEmailExpireKey + email).then(expireCode => {
        RedisUtil.get(sendEmailKey + email).then(verificationCode => {
            try {
                if (parseInt(verificationCode) === parseInt(code)) {
                    log.info('校验验证码成功' + email + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code, ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.msg);
                } else if (verificationCode && expireCode === code) {
                    log.info('过期的校验码' + email + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_EXPIRED.code, ErrorCode.EMAIL_CODE_EXPIRED.msg);
                } else {
                    log.err('错误的验证码' + email + ' verificationCode:' + verificationCode + 'code:' + code);
                    callback(ErrorCode.EMAIL_CODE_FAILED.code, ErrorCode.EMAIL_CODE_FAILED.msg);
                }
            } catch (e) {
                log.err(e);
                log.err('错误的验证码' + email + ' verificationCode:' + verificationCode + 'code:' + code);
                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg);
            }
        });
    });
}


// 设置用户调用协议记录
exports.recordUserProtocol  = async function (userId, protocol){
    try {
        const key = protocol + '_' + userId;
        const setResult = await RedisUtil.setNxAsync(key, new Date().getTime());
        console.log('recordUserProtocol:' + key + 'setResult' + setResult)
        if (setResult === 1) {
            // 如果设置成功，则设置过期时间
            await RedisUtil.expire(key, userSocketProtocolExpireSecond);
        }
        return setResult;
    }catch (e){
        log.err(e)
    }
}

// 删除用户调用协议记录
exports.delUserProtocol  = async function (userId, protocol){
    const key = protocol + '_' + userId;
    console.log('delUserProtocol:', key)
    await RedisUtil.del(key);
}


// VIP每日领取
exports.VIPDailyGet  = function VIPDailyGet(userId, callback){
    RedisUtil.hmset(VIPDailyGetKey, userId, new Date().getTime()).then(ok =>{
        if(ok){
            callback(1)
        }else{
            callback(0)
        }
    }).catch(e =>{
        log.err(e)
        callback(0)
    })
}
// 是否领取了VIP每日金币
exports.isVIPDailyGet  = function isVIPDailyGet(userId, callback){
    RedisUtil.hget(VIPDailyGetKey, userId).then(ok =>{
        if(ok){
            callback(1)
        }else{
            callback(0)
        }
    }).catch(e =>{
        log.err(e)
        callback(0)
    })
}

// 是否领取了VIP每月金币
exports.isVIPMonthlyGet  = function isVIPMonthlyGet(userId, callback){
    RedisUtil.hget(VIPMonthlyGetKey, userId).then(ok =>{
        if(ok){
            callback(1)
        }else{
            callback(0)
        }
    }).catch(e =>{
        log.err(e)
        callback(0)
    })
}

// VIP每月领取
exports.VIPMonthlyGet  = function VIPMonthlyGet(userId, callback){
    RedisUtil.hmset(VIPMonthlyGetKey, userId, new Date().getTime()).then(ok =>{
        if(ok){
            callback(1)
        }else{
            callback(0)
        }
    }).catch(e =>{
        log.err(e)
        callback(0)
    })
}


// 清理VIP每月领取
exports.clearVIPMonthlyGetKey  = function clearVIPMonthlyGetKey(){
    RedisUtil.del(VIPMonthlyGetKey)
}


// 清理VIP每日领取
exports.clearVIPDailyGetKey  = function clearVIPDailyGetKey(){
    RedisUtil.del(VIPDailyGetKey)
}


// 获取活动奖池
exports.getActivityJackpot = function(callback){
    const self = this;
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        self.getJackpotConfig().then(config =>{
            const activityJackpot= jackpot ? jackpot * config.jackpot_ratio.activity / 100 : 0;
            const val = Math.floor(activityJackpot.toFixed(2))
            callback(val)
        })
    })
}


// 存储用户信息
exports.setUserInfo = function(userId, userInfo){
    const v = {
        isVip: userInfo.is_vip,
        totalRecharge : userInfo.totalRecharge,
        withdrawLimit : userInfo.withdrawLimit
    }
   return RedisUtil.hmset(userInfoKey, userId , JSON.stringify(v))
}

// 获取用户信息
exports.getUserInfo = function(userId){
    return RedisUtil.hget(userInfoKey, userId);
}

// 是否破产
exports.isBankrupt = function isBankrupt(currScore, currBankScore, callback) {
    // 是否破产
    // （携带账户+银行账户）金币小于破产补助金时
    this.getBankruptConfig().then(config =>{
        const bustTimes = config.Bust_times;
        const bustBonus = config.Bust_Bonus;
        const bankrupt = Number(currScore) + Number(currBankScore) < bustBonus;
        callback(bankrupt, bustBonus , bustTimes);
    });
}


// 获取每个用户新手引导流程
exports.getNewHandGuideFlowKey = function(userId){
    RedisUtil.hget(newHandGuideFlowKey, userId).then(val =>{
        if(!val){
           /* const flow = [

            ]
            // 首次进入大厅
            RedisUtil.hmset(newHandGuideFlowKey, userId, )*/
        }


    })
}

// 设置限时折扣
exports.userDiscountLimited  = function (userId, callback){
    this.getDiscountLimitedConfig().then(config =>{
        const expire = config[0].Discount_time * 60;
        const key = userDiscountLimitedKey + '_' + userId;
        const currTime = new Date().getTime();
        RedisUtil.set(key, currTime).then(r =>{
            if(r){
                RedisUtil.expire(key, expire).then(o =>{
                    if(r && o){
                        callback(currTime)
                    }else{
                        callback(0)
                    }
                });
            }else{
                callback(0)
            }
        })
    })

}

// 获取限时折扣
exports.getUserDiscountLimited  = function (userId){
    const key = userDiscountLimitedKey + '_' + userId;
    return RedisUtil.get(key);
}

