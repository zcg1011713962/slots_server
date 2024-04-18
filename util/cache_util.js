const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require('../util/redis_laba_win_pool');
const {getInstand: log} = require("../CClass/class/loginfo");
const ErrorCode = require("./ErrorCode");
const StringUtil = require("./string_util");
const TypeEnum = require("./enum/type");
const dao = require("./dao/dao");

const gamblingBalanceGold= 'gamblingBalanceGold';
const sysBalanceGold= 'sysBalanceGold';
const redisJackpotKey = "jackpot";

const bankPwdErrorTimes= 'bankPwdErrorTimes';
const everydayLuckyCoin= 'everydayLuckyCoin';
const userPlayGameCount= 'userPlayGameCount';
const playGameBetRecord= 'playGameBetRecord';

const sendEmailExpireKey = 'sendEmailCodeExpire';
const VIPDailyGetKey = 'VIPDailyGet';
const VIPMonthlyGetKey = 'VIPMonthlyGet';
const userPlayGameWinScore= 'userPlayGameWinScore';
const userInfoKey = 'userInfo';
const sendEmailKey = 'sendEmailCode';
const newHandGuideFlowKey = 'newHandGuideFlow';
const userDiscountLimitedKey = 'userDiscountLimited';
const newbierPartKey = 'newbierPart';

const firstRechargeContinueRewardKey = 'firstRechargeContinueReward';
const buyCallBackSwitchKey  = 'buyCallBackSwitch';
const paySwitchKey  = 'paySwitch';
const nGamblingWaterLevelGoldKey = 'nGamblingWaterLevelGold';

const userSocketProtocolExpireSecond = 30; // 用户协议过期时间
const emailCodeExpireSecond = 600; // 邮箱验证码过期时间
const emailCodeLongExpireSecond = 800; // 过期校验过期时间

const gameConfig = {
    gameConfigKey: 'gameConfig',
    iconValueKey: 'iconValue',
    controlAwardKey: 'controlAward',
    handCardsKey: 'handCards',
    base: 'base',
    nGameLines: 'nGameLines',
    iconInfos: 'iconInfos',
    iconBind: 'iconBind',
    freeRatio: 'freeRatio',
    bonusRatio: 'bonusRatio'
}

const jackpotConfig = {
    jackpotConfigKey: 'jackpotConfig'
}


const serverConfig = {
    serverConfigKey: 'serverConfig',
    urlKey: 'url'
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






// 初始奖池
exports.initJackpot  = function () {
    // 如果不存在奖池,初始化奖池
    this.get_redis_win_pool().then(jackpot =>{
        if(!jackpot){
            RedisUtil.set(redisJackpotKey, 0);
        }
    });
}

// 累加奖池
exports.IncrJackpot  = function (val) {
    if(val > 0){
        RedisUtil.incrementByFloat(redisJackpotKey, val);
    }
};

// 累减奖池
exports.DecrJackpot  = function (val) {
    return RedisUtil.decrementFloat(redisJackpotKey, val)
};

// 获取奖池
exports.getJackpot  = function get_redis_win_pool() {
    return RedisUtil.get(redisJackpotKey);
};


// 初始化用户库存
exports.initGamblingBalanceGold  = function () {
    this.getGamblingBalanceGold().then(val =>{
        if(!val){
            RedisUtil.set(gamblingBalanceGold, 0);
        }
    });
}
// 初始化系统库存
exports.initSysBalanceGold  = function () {
    this.getSysBalanceGold().then(val =>{
        if(!val){
            RedisUtil.set(sysBalanceGold, 0);
        }
    });
}

// 获取用户库存
exports.getGamblingBalanceGold  = function () {
    return RedisUtil.get(gamblingBalanceGold);
}

exports.IncrGamblingBalanceGold  = function (increment) {
    if(increment > 0){
        RedisUtil.incrementByFloat(gamblingBalanceGold, increment);
    }
}


exports.DecrGamblingBalanceGold  = function (increment) {
    return RedisUtil.decrementFloat(gamblingBalanceGold, increment);
}

// 获取系统库存
exports.getSysBalanceGold  = function () {
    return RedisUtil.get(sysBalanceGold);
}

exports.IncrSysBalanceGold  = function (increment) {
    if(increment > 0){
        return RedisUtil.incrementByFloat(sysBalanceGold, increment);
    }
}

exports.DecrSysBalanceGold  = function (increment) {
    return RedisUtil.decrementFloat(sysBalanceGold, increment);
}







exports.getServerUrlConfig = async function(){
    try{
        return RedisUtil.hget(serverConfig.serverConfigKey, serverConfig.urlKey).then(config => JSON.parse(config))
    } catch(e){
        log.err('getGameConfig');
    }
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
    self.getJackpot().then(function (jackpot) {
        self.getJackpotConfig().then(jackpotConfig =>{
            // 游戏奖池
            let gJackpot = jackpot ? StringUtil.rideNumbers(jackpot, (jackpotConfig.jackpot_ratio.game / 100), 2) : 0;
            // 奖池划分比例
            const game_jackpot_ratio = jackpotConfig.game_jackpot_ratio;
            const grandJackpot =  StringUtil.rideNumbers(gJackpot, game_jackpot_ratio[3].ratio / 100, 2);
            const majorJackpot = StringUtil.rideNumbers(gJackpot , game_jackpot_ratio[2].ratio / 100, 2);
            const minorJackpot = StringUtil.rideNumbers(gJackpot , game_jackpot_ratio[1].ratio / 100, 2);
            const miniJackpot = StringUtil.rideNumbers(gJackpot , game_jackpot_ratio[0].ratio / 100, 2);
            const gameJackpot= StringUtil.toFixed(gJackpot, 2);
            callback(gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig)
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
        log.info(u.userid + '延时500毫秒推送奖池')
        this.pushGameJackpot(us);
    }, 500);
}


exports.pushGameJackpot  = function (userList){
    if(userList && userList.length > 0){
        this.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) =>{
            for (const userId in userList) {
                const jackpot = {
                    gameJackpot: gameJackpot,
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


exports.setActivityLuckyConfig = function (userId) {
    const self = this;
    return self.getLuckyCoinConfig().then(luckyCoinConfig =>{
        // 没进入过每日活动的用户默认配置
        const startTime =  new Date().getTime();
        const endTime = startTime + luckyCoinConfig.luckyRushTime * 60 * 1000;
        const userLuckyConfig = {
            luckyCoin: luckyCoinConfig.turntableCoin,  // 活动幸运币数量
            doLuckyCoinTask: 0, // 幸运活动每日完成的任务数量
            luckyCoinTask: luckyCoinConfig.luckyCoinTask,
            luckyRushStartTime: startTime,
            luckyRushEndTime: endTime,
            luckyCoinGetStatus: 1 ,// 幸运币领取状态0不可领取 1可领取 默认第一次可领取
            luckyCoinTaskGetStatus: 0, // 任务领取状态0不可领取 1可领取
            pushStatus: 1, // 推送状态(防止重复推送用) 默认第一次可领取，所以默认推送
            currCoinCount: 0 // 当日领取幸运币数量
        }
        return RedisUtil.hmset(everydayLuckyCoin, userId, JSON.stringify(userLuckyConfig)).then(ok =>{
            if(ok){
                return JSON.stringify(userLuckyConfig);
            }
            return null;
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
    const self = this;
    RedisUtil.hget(everydayLuckyCoin, userId).then(async userLuckyConfig => {
        if (userLuckyConfig) {
            callback(JSON.parse(userLuckyConfig));
        } else {
            // 设置每个用户的幸运配置
            await self.setActivityLuckyConfig(userId).then(ret =>{
                callback(JSON.parse(ret));
            });
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
                const doLuckyCoinTask = d.doLuckyCoinTask === undefined ? 0 : parseInt(d.doLuckyCoinTask);
                if(d){
                    d.doLuckyCoinTask = doLuckyCoinTask + 1;
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


// 增加玩家摇奖次数
exports.updatePlayGameBetRecord  = function (userId, v){
    RedisUtil.hmset(playGameBetRecord, userId, v).then(r =>{});
}


// 获取玩家摇奖次数
exports.getPlayGameBetRecord  = function (userId){
    return RedisUtil.hget(playGameBetRecord, userId).then(it => JSON.parse(it));
}



// 获取玩家赢金币数值
exports.getPlayGameWinscore  = function getPlayGameWinscore(userId){
    return RedisUtil.hget(userPlayGameWinScore, userId).then(winscore =>{
        if(winscore){
            return winscore;
        }
        return 0;
    });
}

// 记录玩家赢分差
exports.playGameWinscore  = function playGameWinscore(userId, winScore){
    return this.getPlayGameWinscore(userId).then(winscore =>{
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
    callback(ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code, ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.msg);
    // 是否过期存储
   /* RedisUtil.get(sendEmailExpireKey + email).then(expireCode => {
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
    });*/
}


// 设置用户调用协议记录
exports.recordUserProtocol  = async function (userId, protocol){
    try {
        const key = protocol + '_' + userId;
        const setResult = await RedisUtil.setNxAsync(key, new Date().getTime());
        log.info('协议被调用:' + key + 'code:' + setResult)
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
    log.info('协议被释放:' + key)
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

// 清理幸运币每日领取上限
exports.clearLuckyCoinLimit  = function clearLuckyCoinLimit(){
    RedisUtil.del(everydayLuckyCoin)
}


// 获取活动奖池
exports.getActivityJackpot = function(callback){
    const self = this;
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        self.getJackpotConfig().then(config =>{
            const activityJackpot= jackpot ? jackpot * config.jackpot_ratio.activity / 100 : 0;
            callback(StringUtil.toFixed(activityJackpot, 2))
        })
    })
}


// 存储用户基础信息
exports.setUserInfo = function(userId, userInfo){
    const obj = {
        userId: userInfo.Id,
        account : userInfo.Account,
        nickname : userInfo.nickname,
        score : userInfo.score,
        diamond : userInfo.diamond,
        sign: userInfo.sign
    }
    return RedisUtil.client.hmset(`${userInfoKey}:${userId}`, obj)
}

// 获取用户信息
exports.getUserInfo = function(userId, callback){
    return RedisUtil.client.hgetall(`${userInfoKey}:${userId}`, (err, user) => {
        if (err) {
            log.err(userId + '获取用户信息:' + err);
            callback(0)
        } else {
            callback(1, user)
        }
    });
}

// 设置免费次数
exports.setFreeCount = function(userId, freeCount){
    return RedisUtil.client.hmset(`${userInfoKey}:${userId}`, 'freeCount', freeCount);
}

// 获取免费次数
exports.getFreeCount = function(userId){
    return RedisUtil.hget(`${userInfoKey}:${userId}`, 'freeCount');
}

// 扣免费次数
exports.reduceFreeCount = function(userId, reduceFreeCount, callback){
    this.getFreeCount(userId).then(freeCount =>{
        if(freeCount >= reduceFreeCount){
            RedisUtil.client.hincrby(`${userInfoKey}:${userId}`, 'freeCount', -reduceFreeCount, (err, currFreeCount) => {
                if (err) {
                    log.err(userId + '扣免费次数' + err);
                    callback(0)
                } else {
                    log.info(userId + '扣免费次数' + reduceFreeCount + '成功,当前免费次数:' + currFreeCount);
                    const beforeFreeCount = freeCount;
                    callback(1, beforeFreeCount, currFreeCount)
                }
            });
        }else{
            callback(0)
        }
    })
}

// 给用户加免费次数
exports.addFreeCount = function(userId, freeCount, callback){
    if(freeCount > 0){
        RedisUtil.client.hincrby(`${userInfoKey}:${userId}`, 'freeCount', freeCount, (err, currFreeCount) => {
            if (err) {
                log.err(userId + '增加免费次数' + err);
                callback(0)
            } else {
                log.info(userId + '增加免费次数' + freeCount + '成功,当前免费次数:' + currFreeCount);
                callback(1)
            }
        });
    }else{
        callback(1)
    }
}

// 获取用户金币
exports.getGoldCoin = function(userId){
    return RedisUtil.hget(`${userInfoKey}:${userId}`, 'score').then(coin => { return StringUtil.toFixed(coin, 2)});
}

// 给用户加金币
exports.addGoldCoin = function(userId, coinsToAdd, type, callback){
    if(coinsToAdd > 0){
        dao.addAccountScore(userId, coinsToAdd, ret =>{
            if (!ret) {
                log.err(userId + '增加金币失败,数量:'+ coinsToAdd + '类型:' +  type);
                callback(0)
                return;
            }
            RedisUtil.client.hincrbyfloat(`${userInfoKey}:${userId}`, 'score', `${coinsToAdd}`, (err, val) => {
                if(err){
                    log.err(userId + '增加金币失败,数量:'+ coinsToAdd + '类型:' +  type + 'err:' + err);
                    callback(0)
                    return;
                }
                const currGoldCoin = StringUtil.toFixed(val, 2);
                log.info(userId + '增加金币' + coinsToAdd + '类型:' +  type + '当前金币:' + currGoldCoin);
                const beforeGoldCoins = currGoldCoin - coinsToAdd;
                // 金币记录
                dao.scoreChangeLog(userId, beforeGoldCoins, coinsToAdd,  currGoldCoin, type, 1)
                callback(1, currGoldCoin)
            });
        })
    }else{
        callback(1)
    }
}


// 给用户加钻石
exports.addDiamond = function(userId, diamondToAdd, type, callback){
    dao.addAccountDiamond(userId, diamondToAdd, ret =>{
        if (!ret) {
            log.err(userId + '增加钻石失败,数量:'+ diamondToAdd + '类型:' +  type);
            callback(0)
            return;
        }
        RedisUtil.client.hincrby(`${userInfoKey}:${userId}`, 'diamond', diamondToAdd, (err, currDiamond) => {
            if(err){
                log.err(userId + '增加钻石失败,数量:'+ diamondToAdd + '类型:' +  type + 'err:' + err);
                callback(0)
                return;
            }
            log.info(userId + '增加钻石' + diamondToAdd + '类型:' +  type + '当前钻石:' + currDiamond);
            const beforeDiamond = currDiamond - diamondToAdd;
            // 钻石记录
            dao.diamondChangeLog(userId, beforeDiamond, diamondToAdd,  currDiamond, type, 1)
            callback(1, currDiamond)
        });
    })

}

// 给用户减金币
exports.reduceGoldCoin = function(userId, coinsToReduce, type, callback){
    this.getGoldCoin(userId).then(goldCoin =>{
        if(goldCoin >= coinsToReduce){
            dao.reduceAccountScore(userId, coinsToReduce, ret =>{
                if (!ret) {
                    log.err(userId + '减少金币失败,数量:'+ coinsToReduce + '类型:' +  type);
                    callback(0)
                    return;
                }
                RedisUtil.client.hincrbyfloat(`${userInfoKey}:${userId}`, 'score', -coinsToReduce, (err, val) => {
                    if (err) {
                        log.err(userId + '减少金币' + err);
                        callback(0)
                    } else {
                        const currGoldCoin = StringUtil.toFixed(val, 2);
                        log.info(userId + '减少金币:' + coinsToReduce + '类型:' + type +'当前金币:' + currGoldCoin);
                        const beforeGoldCoins = goldCoin;
                        // 金币记录
                        dao.scoreChangeLog(userId, beforeGoldCoins, -coinsToReduce,  currGoldCoin, type, 1)
                        callback(1, beforeGoldCoins, currGoldCoin)
                    }
                });
            })
        }else{
            callback(0)
        }
    })

}

// 扣费用
exports.feeCost = function(userId, nBetSum, type, callback){
    const self = this;
    self.getFreeCount(userId).then(freeCount =>{
        freeCount = freeCount == null ? 0 : parseInt(freeCount)
        self.getGoldCoin(userId).then(goldCoin =>{
            if(freeCount > 0){
                // 扣免费次数
                self.reduceFreeCount(userId, 1, (ret) =>{
                    if(ret){
                        callback(1, freeCount, goldCoin)
                    }else{
                        callback(0, 0, 0)
                    }
                });
            }else{
                // 扣金币
                if(goldCoin > 0 && goldCoin >= nBetSum){
                    self.reduceGoldCoin(userId, nBetSum, type,(ret) =>{
                        if(ret){
                            callback(1, freeCount, goldCoin)
                        }else{
                            callback(0, 0, 0)
                        }
                    });
                }else{
                    callback(0, 0, 0)
                }
            }
        })
    })
}





// 是否破产
exports.isBankrupt = function isBankrupt(currScore, currBankScore, callback) {
    // 是否破产
    // （携带账户+银行账户）金币小于破产补助金时
    this.getBankruptConfig().then(config =>{
        const bustTimes = config.Bust_times;
        const bustBonus = config.Bust_Bonus;
        const bankrupt = Number(currScore) + Number(currBankScore) < bustBonus;
        callback(bankrupt, bustBonus, bustTimes);
    });
}


// 获取每个用户新手引导流程
exports.getNewHandGuideFlowKey = function(userId, firstRecharge, callback){
    RedisUtil.hget(newHandGuideFlowKey, userId).then(it => JSON.parse(it)).then(newHandGuideFlowItem =>{
        if(!newHandGuideFlowItem){
            // 首次进入大厅
            const newHandGuideFlow = Object.values(TypeEnum.NewHandGuideFlow);
            newHandGuideFlowItem = newHandGuideFlow.map((element, index) => {
                return {
                    'order': index,
                    'type': element,
                    'lastPopDate': StringUtil.currDateTime()
                };
            });
            RedisUtil.hmset(newHandGuideFlowKey, userId, JSON.stringify(newHandGuideFlowItem))
            callback(newHandGuideFlowItem);
        }else{
            // 再次进游戏-更新步骤
            // 推广码填写（终生一次）移除
            newHandGuideFlowItem = newHandGuideFlowItem.filter(item => item.type !== TypeEnum.NewHandGuideFlow.promoCode);
            // 首充过的移除
            if(firstRecharge){
                newHandGuideFlowItem = newHandGuideFlowItem.filter(item => item.type !== TypeEnum.NewHandGuideFlow.firstRecharge);
            }

            const temp = newHandGuideFlowItem.slice()
            // 当日弹过的把时间置为明天
            for (const index in newHandGuideFlowItem) {
                if(newHandGuideFlowItem[index].lastPopDate === StringUtil.currDateTime() || newHandGuideFlowItem[index].lastPopDate === StringUtil.currDateTime() + 24 * 60 * 60 * 1000){
                    // 置为明天的日期
                    newHandGuideFlowItem[index].lastPopDate = StringUtil.currDateTime() + 24 * 60 * 60 * 1000;
                    temp.splice(0,1);
                }
            }
            RedisUtil.hmset(newHandGuideFlowKey, userId, JSON.stringify(newHandGuideFlowItem))
            callback(temp);
        }
    })
}

// 设置限时折扣
exports.userDiscountLimited  = function (userId, callback){
    this.getDiscountLimitedConfig().then(config =>{
        const expire = config[0].Discount_time * 60;
        const key = userDiscountLimitedKey + '_' + userId;
        const currTime = new Date().getTime();
        const endTime = currTime + expire * 60;

        RedisUtil.set(key, currTime).then(r =>{
            if(r){
                RedisUtil.expire(key, expire).then(o =>{
                    if(r && o){
                        callback(1, currTime, endTime)
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



// 设置购买首充持续奖励
exports.setFirstRechargeContinueReward  = function (userId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, lastGetTime){
    const obj = {
        buyContinueRewardGold: buyContinueRewardGold,
        buyContinueRewardDiamond: buyContinueRewardDiamond,
        buyContinueDays: buyContinueDays,
        lastGetTime: lastGetTime
    }
    return RedisUtil.hmset(firstRechargeContinueRewardKey, userId, JSON.stringify(obj));
}


// 获取购买首充持续奖励
exports.getFirstRechargeContinueReward  = function (userId){
    return RedisUtil.hget(firstRechargeContinueRewardKey, userId);
}


// 购买回调开关
exports.buyCallBackSwitch = function(){
    return RedisUtil.get(buyCallBackSwitchKey).then(code =>{
        if(code){
            return 1;
        }else{
            return 0;
        }
    });
}

// 购买回调开关
exports.paySwitch = function(){
    return RedisUtil.get(paySwitchKey).then(code =>{
        if(code){
            return 1;
        }else{
            return 0;
        }
    });
}

// 购买回调开关
exports.getGamblingWaterLevelGold = function(){
    return RedisUtil.get(nGamblingWaterLevelGoldKey).then(nGamblingWaterLevelGold =>{
        if(nGamblingWaterLevelGold){
            return nGamblingWaterLevelGold;
        }else{
            return 0;
        }
    });
}



exports.getNewbierPartMul = function(userId){
    return RedisUtil.hget(newbierPartKey, userId).then(newbierPart =>{
        if(!newbierPart){
            return this.getNewhandProtectConfig().then(c =>{
                const item = c.newbierPart[0];
                const removedItem = c.newbierPart.shift();
                return RedisUtil.hmset(newbierPartKey, userId, JSON.stringify(c.newbierPart)).then(r =>{
                    return removedItem;
                });
            })
        }else{
            const part = JSON.parse(newbierPart);
            const removedItem = part.shift();
            return RedisUtil.hmset(newbierPartKey, userId, JSON.stringify(part)).then(r =>{
                return removedItem;
            });
        }
    });
}



exports.setControlAward = function(map){
    return RedisUtil.hmset(gameConfig.gameConfigKey ,gameConfig.controlAwardKey, map);
}

exports.getControlAwardByRtp = function(rtp){
    return RedisUtil.hget(gameConfig.gameConfigKey, gameConfig.controlAwardKey).then(jsonString =>{
        const rtpMap = new Map(JSON.parse(jsonString));
        const rtpArr = [...rtpMap.keys()];
        for(let i = 0; i < rtpArr.length; i++) {
            if(i === 0 && rtp <= rtpArr[i]){
                return rtpMap.get(rtpArr[i])
            }else if(i === rtpArr.length - 1 && rtp > rtpArr[i]){
                return rtpMap.get(rtpArr[i]);
            }else{
                const [min, max] = rtpArr[i];
                if(rtp > min && rtp < max){
                    return rtpMap.get(rtpArr[i]);
                }
            }
        }
    })
}

exports.getIconValue = function(){
    return RedisUtil.hget(gameConfig.gameConfigKey, gameConfig.iconValueKey).then(r => JSON.parse(r));
}

// 钻石游戏手牌
exports.setHandCards = function(gameId, mulCardsMap){
    return RedisUtil.hmset(gameConfig.gameConfigKey, gameConfig.handCardsKey + gameId, mulCardsMap);
}

// 钻石游戏手牌
exports.getHandCardsByMul = function(gameId, mul){
    return RedisUtil.hget(gameConfig.gameConfigKey, gameConfig.handCardsKey + gameId).then(jsonString =>{
        const storedMap = new Map(JSON.parse(jsonString));
        if(storedMap.has(mul)){
            return storedMap.get(mul)
        }
        return null;
    })
}

// 钻石游戏手牌倍数数组
exports.getHandCardsMuls = function(gameId){
    return RedisUtil.hget(gameConfig.gameConfigKey, gameConfig.handCardsKey + gameId).then(jsonString =>{
        const storedMap = new Map(JSON.parse(jsonString));
        return Array.from(storedMap.keys());
    })
}


// 钻石游戏手牌
exports.setHandCards = function(gameId, mulCardsMap){
    return RedisUtil.hmset(gameConfig.gameConfigKey, gameConfig.handCardsKey + gameId, mulCardsMap);
}
