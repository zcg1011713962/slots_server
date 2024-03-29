const User = require("./User");
const dao = require("../../util/dao/dao");
const ymDao = require("./../dao/ym_dao");
const crypto = require('crypto');
const ServerInfo = require('./../config/ServerInfo').getInstand;
const schedule = require("node-schedule");
const log = require("../../CClass/class/loginfo").getInstand;
const async = require('async');
const RobotConfig = require('./../config/RobotConfig');
const redis_laba_win_pool = require("./../../util/redis_laba_win_pool");
const redis_send_and_listen = require("./../../util/redis_send_and_listen");
const SendEmail = require('../../util/email_send_code');
const RedisUtil = require('../../util/redis_util');
const ErrorCode = require('../../util/ErrorCode');
const gameConfig = require('../config/gameConfig');
const StringUtil = require('../../util/string_util');
const Config = require("../config/read_turntable_config").getInstand;
const LABA = require("../../util/laba");
const CacheUtil = require("../../util/cache_util");
const LanguageItem = require("../../util/enum/language");
const TypeEnum = require("../../util/enum/type");
const HashCodeUtil = require("../../util/hashcode_util");
const PayAPI = require('../class/pay_api');
const {GoodsType} = require("../../util/enum/type");
const CommonEvent = require('../../util/event_util');



var GameInfo = function () {

    var _gameinfo = "";

    var Game = function () {

        //初始化游戏
        this.init = function () {

            //初始化用户列表
            this.userList = {};
            //在线人数为0
            this.onlinePlayerCount = 0;
            //统计
            this.winTotal = 0;
            //维护模式
            this.maintain = false;

            this._loginList = [];

            this.gameRank = {};
            // 离线的用户
            this.tempuserList = {};

            this.sendCardList = {};

            this.score_changeLogList = [];

            this.diamond_changeLogList = [];

            this.lineOutList = {};
            var self = this;
            dao.selectServerLog(function (Result, rows) {
                if (Result) {
                    self.server_log_list = rows
                }
            });

            this.checkNo = {};

            this._io = {};

            this.gm_socket = {};   //gm登录socket

            this.test = false;

            this.todayId = 0;
            // 初始化奖池
            redis_laba_win_pool.redis_win_pool_init();

            const rule = new schedule.RecurrenceRule();
            const times = [];
            for (var i = 0; i < 60; i++) {
                times.push(i);
            }
            rule.second = times;
            var self = this;
            schedule.scheduleJob(rule, function () {
                if (self.maintain) {
                    self.disconnectAllUser();
                }
                const nowDate = new Date();
                const now_hours = nowDate.getHours();
                const minute = nowDate.getMinutes();
                const second = nowDate.getSeconds();
                self.game_second = second;
                if (second === 0) {
                    // 奖池推送
                    CacheUtil.pushGameJackpot(self.userList);
                }
                if (now_hours == 5) {
                    this.sendCardList = {};
                }
            });
        };

        this.disconnectAllUser = function () {
            for (const itme in this.userList) {
                this.userList[itme]._socket.disconnect();
            }
            console.log("服务器开启维护，已经全部离线");
        };

        this.setIo = function (_io) {
            this._io = _io;
        };

        this.setGMSocket = function (_gm, _socket) {
            this.gm_socket[_gm] = _socket;
        };


        this.Setmaintain = function (_flag) {
            this.maintain = _flag;
        };

        this.isMaintain = function () {
            return this.maintain;
        };

        //判断是否是同一scoket连续登录，不允许
        this.isLoginAgain = function (socket) {
            if (socket.userId) {
                return this.userList[socket.userId].Islogin();
            } else {
                return false;
            }
        };

        //添加用户
        this.addUser = function (userInfo, socket, callback_a) {
            log.info("添加用户:" + userInfo.Id);

            const newDate = new Date();
            const key = "slezz;e3";
            const md5 = crypto.createHash('md5');
            const content = userInfo.Id + userInfo.score + newDate + key;
            userInfo.sign = md5.digest('hex');

            //在没有添加用户之前找到道具列表
            const self = this;
            //console.log(userInfo);
            async.waterfall([
                //callback到最后
                function (callback) {
                    dao.getPropByUserId(userInfo.Id, function (result, row) {
                        log.info(userInfo.Id + "登录获取道具");
                        if (result) {
                            var proplist = {};
                            for (var i = 0; i < row.length; i++) {
                                proplist[row[i].propid] = row[i].propcount;
                            }
                            userInfo.propList = proplist;
                        } else {
                            userInfo.propList = {};
                        }
                        // 用户信息
                        self.userList[userInfo.Id] = new User(userInfo, socket);

                        // 每日转盘活动
                        CacheUtil.activityLuckyConfig(userInfo.Id, ret =>{
                            if(ret){
                                // 构建返回的用户信息
                                CacheUtil.getActivityLuckyDetailByUserId(socket.userId, ret =>{
                                    let luckObject = {
                                        luckyCoin: 0,
                                        luckyRushStartTime: 0,
                                        luckyRushEndTime: 0,
                                        luckyCoinGetStatus: 0
                                    }
                                    if(ret){
                                        luckObject.luckyCoin = ret.luckyCoin;
                                        luckObject.luckyRushStartTime = ret.luckyRushStartTime;
                                        luckObject.luckyRushEndTime = ret.luckyRushEndTime;
                                        luckObject.luckyCoinGetStatus = ret.luckyCoinGetStatus;
                                    }
                                    self.loginUserInfo(userInfo.Id, luckObject, loginUser =>{
                                        result = {code: ErrorCode.LOGIN_SUCCESS.code, msg: ErrorCode.LOGIN_SUCCESS.msg, Obj: loginUser};
                                        callback(null, result);
                                    });
                                });
                            }else{
                                callback("设置用户信息失败", result);
                            }
                        });
                    })
                },
                function (result, callback) {//读取重要数据
                    dao.getScore(userInfo.Id, function (Result, rows) {
                        if (Result) {
                            result.Obj.score = rows.score;
                            result.Obj.diamond = rows.diamond;
                            log.info("登录获取金币:" + result);
                            callback(null, result);
                        }
                    })
                },
                function (result, callback) {
                    log.info(userInfo.Id + "登录添加金币");
                    dao.LoginaddTempScore(userInfo.Id, function (Result, rows) {
                        if (Result) {
                            for (var i = 0; i < rows.length; ++i) {
                                var youScore = self.userList[userInfo.Id]._score;
                                self.userList[userInfo.Id]._score += rows[i].score;
                                result.Obj.score += rows[i].score;
                                var youNowScore = self.userList[userInfo.Id]._score;

                                var userInfolog = {
                                    userid: userInfo.Id,
                                    score_before: youScore,
                                    score_change: rows[i].score,
                                    score_current: youNowScore,
                                    change_type: rows[i].change_type,
                                    isOnline: false
                                };
                                self.score_changeLogList.push(userInfolog);
                            }
                        }
                        callback(null, result);
                    });
                },
                function (result, callback) {
                    log.info(userInfo.Id + "登录添加钻石");
                    dao.LoginaddTempDiamond(userInfo.Id, function (Result, rows) {
                        if (Result) {
                            for (var i = 0; i < rows.length; ++i) {
                                var youScore = self.userList[userInfo.Id]._diamond;
                                self.userList[userInfo.Id]._diamond += rows[i].score;
                                result.Obj.diamond += rows[i].score;
                                var youNowScore = self.userList[userInfo.Id]._diamond;

                                var userInfolog = {
                                    userid: userInfo.Id,
                                    diamond_before: youScore,
                                    diamond_change: rows[i].score,
                                    diamond_current: youNowScore,
                                    change_type: rows[i].change_type,
                                    isOnline: false
                                };
                                self.diamond_changeLogList.push(userInfolog);
                            }
                        }
                        callback(null, result);
                    });
                },
                function (result, callback) {
                    // 登录成功返回结果
                    const login_token_key = 'login_token_key:';
                    redis_laba_win_pool.get_redis_win_pool().then(function (data) {
                        // 生成新token返回
                        StringUtil.generateUniqueToken().then(token =>{
                            RedisUtil.set(login_token_key + token , userInfo.Id).then(ret1 =>{
                                const expire = 7 * 24 * 60 * 60;
                                RedisUtil.expire(login_token_key + token, expire).then(ret2 =>{
                                    if(ret1 && ret2){
                                        result.Obj.token = token;
                                        result.win_pool = data;
                                        socket.emit('loginResult', result);
                                        ++self.onlinePlayerCount;

                                        log.info('登录结果' + JSON.stringify(result));
                                        callback(null, result);
                                    }
                                });
                            });
                        })
                    });
                }
            ], function (err, result) {
                try {
                    const userId = userInfo.Id;
                    if (self.userList[userId]) {
                        self.userList[userId].loginEnd = true;
                    }
                    if (err) {
                        console.log(err);
                        console.log(result);
                        callback_a(0);
                    } else {
                        socket.emit('ServerListResult', {GameInfo: ServerInfo.getServerAll()});
                        //发送是否在房间信息
                        const linemsg = self.getLineOutMsg(userId);

                        if (linemsg.Result && linemsg.tableId != -1 && linemsg.seatId != -1) {
                            socket.emit('lineOutMsg', {
                                gameId: linemsg.gameId,
                                serverId: linemsg.serverId,
                                tableId: linemsg.tableId,
                                seatId: linemsg.seatId,
                                tableKey: linemsg.tableKey
                            });
                        }
                        // VIP进大厅
                        CacheUtil.getNoticeConfig().then(config => {
                            if (userInfo.housecard > config.vipEnterHallNoticeLevel) {
                                //
                                log.info("VIP进入大厅:" + userInfo.Id + "VIP等级:" + userInfo.housecard)
                                self.vipEnterHall(userInfo);
                            }
                            callback_a(1);
                        });

                        log.info("大厅在线人数:" + self.getOnlinePlayerCount());
                    }
                }catch (e){
                    log.err(e)
                    callback_a(0);
                }
            });
        };
        
        this.vipEnterHall = function (userInfo) {
            // 延时1秒发送跑马灯
            setTimeout(() => {
                const noticeMsg = [{
                    type: TypeEnum.notifyType.vipEnterHall,
                    content_id: "c2000",
                    extend:{
                        vipLevel: userInfo.housecard,
                        nickName: userInfo.nickname,
                        userId: userInfo.Id
                    }
                }]
                this.sendAllNotifyMsg(noticeMsg)
            }, 1000);
        }


        //获得在线人数
        this.getOnlinePlayerCount = function () {
            return this.onlinePlayerCount;
        };

        //在线所有人
        this.getOnlinePlayer = function () {
            return this.userList;
        };

        this.setCleanGameIdByUserId = function (_userinfo) {
            if (_userinfo.userId) {
                log.info(_userinfo.userId + "清除游戏ID")
                if (this.userList[_userinfo.userId]) {
                    this.userList[_userinfo.userId].resetGame();
                    log.info("游戏ID" + this.userList[_userinfo.userId].getGameId())
                }
            }
        };

        //删除用户
        this.deleteUser = function (_userinfo) {
            if (_userinfo.userId) {
                log.info("用户" + _userinfo.userId + "删除!");
                // 用户在大厅，非机器人
                if (this.userList[_userinfo.userId] && !this.userList[_userinfo.userId].getGameId() && !this.userList[_userinfo.userId].deleteFlag && !this.userList[_userinfo.userId]._Robot) {
                    log.info("用户" + _userinfo.userId + "没有游戏ID");
                    // 用户置为离线
                    this.userList[_userinfo.userId].deleteFlag = true;
                    // 放到离线用户集合
                    this.tempuserList[_userinfo.userId] = this.userList[_userinfo.userId];
                    // 移除用户
                    delete this.userList[_userinfo.userId];
                    // 人数减少
                    --this.onlinePlayerCount;
                }
            }
        };

        this.deleteUserNoLoginGame = function (userid, flag) {
            if (this.userList[userid]) {
                //console.log("进入这里" + this.userList[userid].getRoomId())
                if (!this.userList[userid].getGameId() && !this.userList[userid]._ageinLogin) {
                    delete this.userList[userid];
                    --this.onlinePlayerCount;
                }

                if (flag) {
                    delete this.userList[userid];
                    --this.onlinePlayerCount;
                    //console.log("未登录游戏离线!同时在线:" + this.onlinePlayerCount + "人")

                }
                //console.log(this.userList);
            }
        };


        this.GameUpdateDiamond = function (_info) {
            //俱乐部扣除群主房卡用
            if (_info.sendUserId) {
                if (_info.diamond > 0) {
                    var userInfo = {sendUserId: _info.sendUserId, sendCoin: 0, change_type: 0, diamond: _info.diamond};
                    this.GameBalance(userInfo);
                    // sendStr = '{"status":0,"msg":"俱乐部创建房间 房卡扣除 群主:"}'
                    log.info("创建房间 房卡扣除1 群主:", _info.sendUserId, _info.diamond)
                } else {
                    var userInfo = {sendUserId: _info.sendUserId, sendCoin: 0, change_type: 0, diamond: _info.diamond};

                    this.GameBalanceSub(userInfo, function (_sendStr) {
                        log.info("创建房间 房卡扣除2 群主:", _info.sendUserId, _info.diamond)
                        log.info(_sendStr)
                    });
                }
            } else {
                log.info("创建房间 房卡扣除 群主没有id", _info.sendUserId, _info.diamond)
            }

        };


        // 获得用户当前分数
        this.getUserscore = function (_userId) {
            if (_userId) {
                return this.userList[_userId]._score;
            }
        };

        // 增加用户分数
        this.addUserscore = function (_userId, score) {
            if (_userId && score) {
                this.userList[_userId]._score += score;
            }
        };

        //获得用户
        this.getUser = function (_userId) {
            if (_userId) {
                return this.userList[_userId];
            }
        };

        // 获取用户登录返回信息
        this.loginUserInfo = function (userId, luckObject, callback) {
            try {
                const user = this.userList[userId];
                if(!user){
                    return null;
                }
                CacheUtil.getDownloadExtConfig().then(downloadExtConfig =>{
                    CacheUtil.isVIPDailyGet(userId, dailyGet =>{
                        CacheUtil.isVIPMonthlyGet(userId, monthlyGet =>{
                            const ret =  {
                                account: user._account,  // 用户名
                                id: user._userId,       // 用户ID
                                nickname: user._nickname, // 昵称
                                score: user._score,  // 用户金币数量
                                sign: user._sign,
                                proplist: user._proList,
                                headimgurl: user._headimgurl, // 头像ID
                                diamond: user._diamond, // 钻石数量
                                phoneNo: user._phoneNo, // 手机号
                                official: user._official,
                                isVip: user.is_vip,  // 是否VIP
                                totalRecharge: user.totalRecharge, // 总充值
                                vip_level: user.vip_level, // VIP等级
                                vip_score: user.vip_score, // VIP点数
                                dailyGet: dailyGet,   // 是否领取了每日金币
                                monthlyGet: monthlyGet, // 是否领取了每月金币
                                firstRecharge: user.firstRecharge, // 是否购买首充礼包
                                bankScore: user.bankScore, // 银行积分，也就是银行里的金币
                                bankLock: user.bankLock,  // 银行是否被锁定
                                addDate: user.addDate, // 注册时间
                                existBankPwd: user.bankPwd ? 1 : 0, // 是否设置了银行密码
                                email: user._email ? user._email : '' , // 邮箱
                                firstLogin: user.LoginCount > 1 ? 0 : 1, // 是否首次登录
                                inviteCode: user.inviteCode ? user.inviteCode : '', // 邀请码
                                ptLink: downloadExtConfig.download_url ? downloadExtConfig.download_url : '', // 推广链接
                                currTime: new Date().getTime(), // 当前时间戳
                                luckyRushStartTime: luckObject.luckyRushStartTime, // 幸运金币刷新开始时间
                                luckyRushEndTime: luckObject.luckyRushEndTime, // 幸运金币刷新结束时间
                                luckyCoin: luckObject.luckyCoin ,// 幸运金币数量
                                luckyCoinGetStatus: luckObject.luckyCoinGetStatus, // 幸运金币可领取状态
                                p: user._p, // king
                                step :  user.step // 新手指引步数
                            };
                            callback(ret);
                        })
                    })
                });
            }catch (e){
                log.err(e)
                callback(null)
            }
        }

        //获得用户
        this.webGetUser = function (_account, callback) {
            var format = {};
            if (_account) {
                dao.webGetUser(_account, function (code, result) {
                    format.code = code;
                    format.nickname = result.nickname;
                    format.ticket = result.giftTicket;
                    format.userId = result.userId;
                    callback(format);
                })
            } else {
                callback(format);
            }
        }

        this.sendHallShopCallBack =function (userId, shopType, code, msg, data) {
            if(this.userList[userId]){
                // 大厅
                if (TypeEnum.ShopType.store === shopType) {
                    this.userList[userId]._socket.emit('ShoppingResult', {code: code, data: data});
                } else if (TypeEnum.ShopType.free_turntable === shopType) {
                    this.userList[userId]._socket.emit('turntableResult', {code: code, data: data});
                }else if (TypeEnum.ShopType.discount_Limited === shopType) {
                    this.userList[userId]._socket.emit('discountLimitedResult', {code: code, data: data});
                }
            }else{
                log.info('购物回调，用户不在大厅' + userId)
            }
        }

        this.sendGameShopCallBack =function (userId, shopType, serverId ,code, msg, data) {
            try {
                /*const socket = this._io.sockets[serverId];
                const params = {
                    shopCallBack: 'ShopCallBack',
                    protocel : 'ShoppingResult'
                }*/
                if (TypeEnum.ShopType.store === shopType) {
                    this._io.sockets.emit('ShoppingResult', {code: code, data: data});
                } else if (TypeEnum.ShopType.free_turntable === shopType) {
                    this._io.sockets._socket.emit('turntableResult', {code: code, data: data});
                } else if (TypeEnum.ShopType.discount_Limited === shopType) {
                    this._io.sockets._socket.emit('discountLimitedResult', {code: code, data: data});
                }
            }catch (e){

            }
        }

        //商城购买
        this.Shopping = function (userId, productId, count, service, shopType, callback) {
            CacheUtil.getServerUrlConfig().then(config =>{
                try {
                    const hallUrl = config.hallUrl ? config.hallUrl : '';
                    // 生成订单ID
                    const orderId = StringUtil.generateOrderId();

                    if(TypeEnum.ShopType.store === shopType){
                        this.storeBuy(orderId, userId, productId, count, service, hallUrl, callback)
                    }else if(TypeEnum.ShopType.free_turntable === shopType){
                        this.turntableBuy(orderId, userId, productId, service, hallUrl, callback);
                    }else if(TypeEnum.ShopType.discount_Limited === shopType){
                        this.discountLimitedBuy(orderId, userId, productId, service, hallUrl, callback);
                    }else{
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    }
                }catch (e) {
                    log.err('ShoppingResult' + e);
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        };
        
        this.discountLimitedBuy = function (orderId, userId, productId, service, hallUrl, callback) {
            const self = this;

            CacheUtil.getUserDiscountLimited(userId).then(ok =>{
                if(!ok){
                    callback(0,"限时折扣时间已过")
                    return;
                }
                // 查询购买的金币道具的数量和价值
                CacheUtil.getDiscountLimitedConfig().then(config =>{
                    const shopItem = config.find(item => item.id === productId);
                    if(!shopItem){
                        callback(0,"商品不存在")
                        return;
                    }
                    // 原价
                    const price = parseFloat(shopItem['source_price']);
                    // 折扣价
                    const amount = parseFloat(shopItem['target_price']);
                    // 巴西币
                    const currencyType = TypeEnum.CurrencyType.Brazil_BRL;

                    const callbackUrl = hallUrl + '/shoppingCallBack?userId=' + userId+'&orderId=' + orderId;
                    // 下购买订单
                    PayAPI.buyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res =>{
                        try{
                            log.info(userId + '下购买订单' + res)
                            const orderResult = JSON.parse(res);
                            if(orderResult && orderResult.code === 200){
                                self.getVipLevel(userId, vipLevel =>{
                                    // 记录订单详情
                                    dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, shopItem.type, price, 2, service, 0, TypeEnum.ShopType.store,ret =>{
                                        if(ret){
                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                        }else{
                                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                        }
                                    })
                                })
                            }else{
                                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                            }
                        }catch (e){
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    });
                })
            })

        }
        
        this.turntableBuy = function (orderId, userId, productId, service, hallUrl, callback) {
            const self = this;
            // 获取幸运币配置
            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                const buyMulPriceItem = luckyCoinConfig.turntableBuyMulPrice.find(item => item.id === productId);
                if (!buyMulPriceItem) {
                    log.err('没有该商品' + productId)
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg);
                    return;
                }
                // 价格
                const amount = buyMulPriceItem.price;
                // 货币类型
                const currencyType = buyMulPriceItem.currencyType;
                // 购买倍数
                const mul = buyMulPriceItem.mul;

               log.info('购买免费转盘门票' + 'amount:' + amount + 'currencyType:' +  currencyType + 'mul:' + mul)

                const callbackUrl = hallUrl + '/shoppingCallBack?userId=' + userId+'&orderId=' + orderId;
                // 下购买订单
                PayAPI.buyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res =>{
                    try{
                        log.info(userId + '下购买订单' + res)
                        const orderResult = JSON.parse(res);
                        if(orderResult && orderResult.code === 200){
                            self.getVipLevel(userId, vipLevel =>{
                                // 记录订单详情
                                dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, TypeEnum.GoodsType.turntableTicket, amount, 0, service, mul, TypeEnum.ShopType.free_turntable, ret =>{
                                    if(ret){
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                    }else{
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                })
                            })
                        }else{
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    }catch (e){
                        log.err(e)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    }
                })
            });
        }
        
        this.storeBuy = function (orderId, userId, productId, count, service, hallUrl, callback) {
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getShopConfig().then(shopConfig =>{
                const shopItem = shopConfig.find(item => item.id === productId);
                if(!shopItem){
                    callback(0,"商品不存在")
                    return;
                }

                let firstRecharge =  1; // 默认购买过首充礼包
                self.buyFirstRecharge(userId, d =>{
                    firstRecharge = d;
                    // 已经首充不用
                    if(firstRecharge === 1 && shopItem.group === TypeEnum.ShopGroupType.rechargeGift){
                        callback(0,"已经购买过首充礼包")
                        return;
                    }
                    // 原价
                    const price = parseFloat(shopItem['source_price']) * count;
                    // 折扣价
                    const amount = parseFloat(shopItem['target_price']) * count;
                    // 巴西币
                    const currencyType = TypeEnum.CurrencyType.Brazil_BRL;

                    const callbackUrl =  hallUrl + '/shoppingCallBack?userId=' + userId+'&orderId=' + orderId;
                    // 下购买订单
                    PayAPI.buyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res =>{
                        try{
                            log.info(userId + '下购买订单' + res)
                            const orderResult = JSON.parse(res);
                            if(orderResult && orderResult.code === 200){
                                self.getVipLevel(userId, vipLevel =>{
                                    // 记录订单详情
                                    dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, shopItem.type, price, shopItem.group, service, 0, TypeEnum.ShopType.store,ret =>{
                                        if(ret){
                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                        }else{
                                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                        }
                                    })
                                })
                            }else{
                                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                            }
                        }catch (e){
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    });

                });
            })
        } 
        

        // 充值统计
        this.rechargeCount = function (userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage) {
            const self = this;
            dao.checkTotalCharge(parseInt(userId), (res, data) => {
                if (!amount || amount < 0) {
                    return;
                }
                try {
                    if (res === 1) {
                        data.totalRecharge += Number(amount);
                        const housecard = data.housecard;
                        const scoreFlow = data.score_flow ? data.score_flow : 0;
                        // 计算充值获得VIP积分
                        const rechargeVipScore = data.totalRecharge * (recharge_vip_socre_percentage/ 100);
                        const flowVipScore = (scoreFlow / score_amount_ratio) * (flow_vip_socre_percentage / 100);

                        // VIP积分=充值获得积分+消费流水获得积分
                        const vScore = StringUtil.addNumbers(rechargeVipScore, flowVipScore);
                        log.info('充值成功' + userId + '增加货币类型:' + currencyType + '数量:' + amount + '总充值获得VIP积分:' + rechargeVipScore + '流水获得VIP积分' + flowVipScore + '当前VIP积分' + vScore);

                        // 计算VIP等级
                        this.getVipLevelByScore(vScore, vipLevel => {
                            // 更新VIP积分
                            if(self.userList[userId]){
                                self.userList[userId].vip_score = vScore;
                            }
                            self.updateVipScore(userId, vScore);
                            // VIP升级
                            self.vipUpgrade(userId, vipLevel, housecard);
                            // 更新下级充值返点
                            self.juniorRecharge(userId, currencyType, amount, score_amount_ratio);
                            // 修改累计充值
                            self.addTotalCharge(userId, amount, vipLevel);
                        });
                    }
                } catch (e) {
                    log.info(e)
                }
            });
        }


        // 购买订单回调
        this.shoppingCallBack = function (userId, orderId, callback) {
            try {
                // 查询订单
                dao.searchOrder(userId, orderId, row => {
                    if(!row){
                        log.err(userId + '无此订单' + orderId)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        return;
                    }

                    const goodsType = row.goodsType;
                    const price = row.price;
                    const amount = row.amount;
                    const currencyType = row.currencyType;
                    const group = row.group;
                    const shopType = row.shopType;
                    const mul = row.mul;
                    const service = row.service;

                    if(TypeEnum.ShopType.store === shopType){
                        this.storeBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, callback)
                    }else if(TypeEnum.ShopType.free_turntable === shopType){
                        this.freeTurntableBuyCallback(userId, orderId, mul, shopType, service, callback)
                    }else{
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    }
                })
            }catch (e){
                log.err(e)
                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
            }
        }



        // 提现结果回调
        this.withdrawCallBack = function (userId, orderId, callback) {
            try {
                dao.searchWithdrawRecordByOrdeId(userId, orderId, (code, row) => {
                    if(!code){
                        log.err(userId + '无此提现记录' + orderId)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        return;
                    }
                    const payStatus = row.payStatus;
                    const status = row.status;
                    const lScore = row.lockBankScore;
                    // 支付失败 或者审核不通过
                    if((payStatus === -1 || status === 2) && lScore){
                        // 归还银行积分
                        dao.lockBankScore(userId, lScore, ret =>{
                            if(ret){
                                log.info('用户:' + userId + '订单:'+  orderId+ '归还银行积分:' + lScore)
                                dao.updateWithdrawPayStatus(userId, orderId, 4, ret =>{});
                            }
                        })
                    }
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                })
            }catch (e){
                log.err(e)
                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
            }
        }
        
        
        this.bankruptGrant = function (userId, callback) {
            dao.searchUserById(userId, (code, row) =>{
                if(!code){
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    return;
                }
                const currScore = row.score;
                const currBankScore = row.bankScore;
                // 已经领取的补助金次数
                const getBustTimes = row.bustTimes;

                CacheUtil.isBankrupt(currScore, currBankScore, (bankrupt, bustBonus , bustTimes) =>{
                    const remainTimes = StringUtil.reduceNumbers(bustTimes, getBustTimes);
                    log.info(userId + '破产:' + bankrupt + '已领取次数:' + getBustTimes )
                    if(bankrupt && StringUtil.compareNumbers(getBustTimes, bustTimes)){   // 破产且还有补助金领取次数
                        // 发放补助金
                        dao.addAccountScore(userId, Number(bustBonus), (r) =>{
                            if(!r){
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                return;
                            }
                            if(this.userList[userId]) this.userList[userId]._score +=  Number(bustBonus);
                            // 减少领取次数
                            dao.addGetBustTimes(userId, ret =>{
                                if(!ret){
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                    return;
                                }
                                log.info(userId + '破产补助金发放' + bustBonus + '剩余领取次数' + remainTimes)
                                const data = {
                                    bankrupt: true,
                                    bustBonus: bustBonus,
                                    bustTimes: remainTimes
                                }
                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                            })
                        })
                    }else{
                        const data = {
                            bankrupt: false,
                            bustBonus: bustBonus,
                            bustTimes: remainTimes
                        }
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                    }
                })
            })

        }

        // 商城购买回调
        this.storeBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, callback) {

            let sourceVal = 0; // 原价金币数量
            let addVal = 0; // 增加金币数量
            let totalVal = 0; // 总金币数量
            const self = this;
            self.getVipLevel(userId, vipLevel => {
                try {
                    CacheUtil.getVConfig().then(vConfig =>{

                        const config  = self.getVipConfigByLevel(vConfig.levelConfig, vipLevel)
                        // 充值获得VIP积分百分比
                        const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                        // 游戏有效投注获得VIP积分百分比
                        const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                        // 增加VIP积分(VIP点数)
                        let addVipPoint = Number(price *  recharge_vip_socre_percentage/ 100);

                        CacheUtil.getScoreConfig().then(scoreConfig => {
                            const score_amount_ratio = scoreConfig.score_amount_ratio
                            // 充值统计VIP升级
                            self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage);

                            // 购买金币
                            if (TypeEnum.GoodsType.gold === goodsType) {
                                // 充值得到的金币
                                let sourceScore = Math.floor(price * score_amount_ratio);

                                // 获取VIP等级额外加金币
                                const shopScoreAddRate = config.shopScoreAddRate ? config.shopScoreAddRate : 0;
                                const addScore = parseFloat((sourceScore * ((shopScoreAddRate - 100) / 100)).toFixed(2));
                                const score = sourceScore + addScore;

                                sourceVal = sourceScore;
                                addVal = addScore;
                                totalVal = score;
                            } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                sourceVal = price;
                                addVal = 0;
                                totalVal = sourceVal;
                            }

                            if (TypeEnum.GoodsType.gold === goodsType) {
                                // 账户增加金币
                                dao.addAccountScore(userId, totalVal, ret =>{
                                    if(ret){
                                        if(this.userList[userId]) this.userList[userId]._score +=  Number(totalVal);
                                        log.info('订单金额' + amount + '货币类型'+ currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                    }
                                })
                            } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                if(self.userList[userId]){
                                    // 账户增加钻石
                                    self.adddiamond(userId, totalVal);
                                }else{

                                }
                            }
                            // 更新订单状态
                            dao.updateOrder(userId, orderId, ret =>{})

                            const result = {
                                vipLevel: vipLevel,
                                addVipPoint: addVipPoint,
                                firstRecharge: 1,
                                goodsType: goodsType,
                                sourceVal: sourceVal,
                                addVal: addVal,
                                totalVal: totalVal,
                                shopScoreAddRate: config.shopScoreAddRate
                            }

                            if (self.userList[userId]) {
                                // 是否购买了首充礼包
                                if (group === TypeEnum.ShopGroupType.rechargeGift && !self.userList[userId].firstRecharge) {
                                    // 更新为已购买首充礼包
                                    self.userList[userId].firstRecharge = 1;
                                }
                                result.firstRecharge = self.userList[userId].firstRecharge;
                                result.vipLevel = self.userList[userId].vip_level;
                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service)
                            } else {
                                // 查询是否购买首充礼包
                                dao.searchFirstRecharge(userId, row => {
                                    result.firstRecharge = row.firstRecharge;
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service)
                                })
                            }

                        })
                    })
                } catch (e) {
                    log.err(e)
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }

        // 免费转盘购买回调
        this.freeTurntableBuyCallback = function (userId, orderId, mul, shopType, service, callback) {
            this.turntableCharge(userId, mul, (code, msg, data) =>{
                if(code){
                    // 更新订单状态
                    dao.updateOrder(userId, orderId, ret =>{})
                }
                callback(code, msg, data,  shopType, service)
            });
        }


        // 获取VIP等级
        this.getVipLevel = function (userId, callback) {
            dao.getVipLevel(userId, vipLevel =>{
                callback(vipLevel)
            })
        }

        // 获取是否购买过首充商品
        this.buyFirstRecharge = function (userId , callback) {
            try{
                if(this.IsPlayerOnline(userId)){
                    const firstRecharge = this.userList[userId].firstRecharge;
                    callback(firstRecharge)
                }else{
                    dao.searchFirstRecharge(userId, row =>{
                        const firstRecharge = row.firstRecharge;
                        callback(firstRecharge)
                    })
                }
            }catch (e){
                callback(1)
            }
        }
        
        // 兑换礼物
        this.exchangeGift = function (socket, cdkey, callback) {
            const userId = socket.userId;
            // 是否存在
            ymDao.cdKeySearch(cdkey, row =>{
                if(row){
                    if(row.status === 1){
                        callback(0, "已使用过的兑换卷")
                        return;
                    }
                    // 更新兑换卷状态=已使用
                    ymDao.cdKeyGet(userId, cdkey, r =>{
                        if(r){
                            const result = {
                                vipLevel: this.userList[userId].vip_level,
                                goodsType: [TypeEnum.GoodsType.gold, TypeEnum.GoodsType.diamond],
                                sourceVal: [10000, 10]
                            }
                            callback(1, ErrorCode.SUCCESS.msg, result)
                        }else{
                            callback(0, ErrorCode.ERROR.msg)
                        }
                    });
                }else{
                    callback(0, "不存在的兑换卷")
                }
            })
        }

        // VIP领取金币
        this.vipGetGold = function (userId, type, callback) {
            const vipLevel = this.userList[userId].vip_level;
            const beforeScore = this.userList[userId]._score;

            CacheUtil.getVipConfig().then(config =>{
                const currConfig = config.find(item => item.level === vipLevel);
                if(!this.userList[userId].is_vip){
                    callback(0, "非VIP不能领取")
                    return;
                }

                if(type === TypeEnum.VipGetGoldType.dailyGet){ //  每日领取
                    CacheUtil.isVIPDailyGet(userId, dailyGet =>{
                        if(dailyGet){
                            callback(0, "不要重复领取")
                            return
                        }
                        CacheUtil.VIPDailyGet(userId, ret =>{
                            if(ret){
                                this.userList[userId]._score += parseInt(currConfig.dailyGetGold);
                                log.info(userId + 'VIP等级'+ vipLevel + '领取前金币:'+ beforeScore + '每日领取金币:' + currConfig.dailyGetGold + '领取后金币:' +  this.userList[userId]._score)
                                dao.scoreChangeLog(userId, beforeScore, currConfig.dailyGetGold, this.userList[userId]._score, TypeEnum.ScoreChangeType.vipDaylyGet, 1);
                                callback(1,ErrorCode.SUCCESS.msg , {type : TypeEnum.GoodsType.gold})
                            }else{
                                callback(0, ErrorCode.ERROR.msg)
                            }
                        })
                    })
                }else if(type === TypeEnum.VipGetGoldType.monthlyGet){  // 每月领取
                    CacheUtil.isVIPMonthlyGet(userId, monthlyGet =>{
                        if(monthlyGet){
                            callback(0, "不要重复领取")
                            return
                        }
                        CacheUtil.VIPMonthlyGet(userId, ret =>{
                            if(ret){
                                this.userList[userId]._score += parseInt(currConfig.monthlyGetGold);
                                log.info(userId + 'VIP等级'+ vipLevel + '领取前金币:'+ beforeScore + '每月领取金币:' + currConfig.monthlyGetGold + '领取后金币:' +  this.userList[userId]._score)
                                dao.scoreChangeLog(userId, beforeScore, currConfig.monthlyGetGold, this.userList[userId]._score, TypeEnum.ScoreChangeType.vipMonthlyGet, 1);
                                callback(1, ErrorCode.SUCCESS.msg, {type : TypeEnum.GoodsType.gold})
                            }else{
                                callback(0, ErrorCode.ERROR.msg)
                            }
                        })
                    })
                }else{
                    callback(0, ErrorCode.ERROR.msg)
                }
            })
        };


        // 查询能领取多少金币
        this.vipGetGoldDetail = function (socket) {
            const vipLevel = this.userList[socket.userId].vip_level;

            CacheUtil.getVipConfig().then(config =>{
                const currConfig = config.find(item => item.level === vipLevel);
                CacheUtil.isVIPDailyGet(socket.userId, dailyGet =>{
                    CacheUtil.isVIPMonthlyGet(socket.userId, monthlyGet =>{
                        const result ={
                            vipLevel: vipLevel,
                            monthlyGetGold: currConfig.monthlyGetGold,
                            dailyGetGold: currConfig.dailyGetGold,
                            dailyGet: dailyGet,
                            monthlyGet: monthlyGet
                        }
                        socket.emit('vipGetGoldDetailResult', result);
                    })
                })
            });
        };

        //用户是否在线
        this.IsPlayerOnline = function (_userId) {
            if (!_userId) {	//传输ID错误
                console.log("查询在线,参数错误");
                return 0;
            }
            if (this.userList[_userId]) {
                return 1;
            } else {
                return 0;
            }
        };

        // 查询用户签到详情页
        this.searchUserSignInDetail = function (socket, callback) {
            CacheUtil.getSignInConfig().then(config =>{

                // 查询当前用户签到第几天了
                dao.searchUserSignIn(socket.userId, res =>{
                    if(res){
                        // 获取当前日期
                        const consecutiveDays = res.consecutive_days;

                        const currentDate = new Date();
                        const currentDateString = currentDate.toISOString().split('T')[0];

                        const lastSignInDate = res.last_sign_in_date.toISOString().split('T')[0];

                        let currSignInFlag = 0;
                        if(currentDateString === lastSignInDate){
                            currSignInFlag = 1;
                        }
                        // 当日已签到
                        const signInConfig = config.map(item =>{
                            let signInFlag = 0;
                            if(consecutiveDays >= item.id ){
                                signInFlag = 1;
                            }
                            return {
                                id: item.id,
                                award: item.award,
                                valRatio: item.valRatio,
                                signInFlag: signInFlag,
                            }
                        });
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, {currSignInFlag: currSignInFlag, signInConfig})
                    }else{
                        let currSignInFlag = 0;
                        // 当日未签到
                        const signInConfig = config.map(item =>{
                            let signInFlag = 0;
                            return {
                                id: item.id,
                                award: item.award,
                                valRatio: item.valRatio,
                                signInFlag: signInFlag
                            }
                        });
                        // 没签到过
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, {currSignInFlag: currSignInFlag, signInConfig})
                    }
                });
            });
        }

        // 用户签到
        this.signIn = function (socket, callback) {
            const userId = socket.userId;

           dao.userSignIn(userId, (res, connection) =>{
               if(res.rcode){
                   log.info('用户签到' + userId + 'code:' + res.rcode,'lastDay:' , res.lastDay)
                   try {
                       const consecutiveDays = res.rcode;
                       CacheUtil.getSignInConfig().then(config => {
                           const signInConfig = config.find(item => item.id = consecutiveDays);
                           const level = this.userList[userId].vip_level;
                           CacheUtil.getVipConfig().then(vipConfig => {
                               const currVipConfig = vipConfig.find(item => item.level === level);
                               // 提交签到事务
                               connection.commit( err => {
                                   connection.release();
                                   if(err){
                                       callback(0)
                                   }else{
                                       for (let i = 0; i < signInConfig.award.length; i++) {
                                           if (signInConfig.award[i].type === 0) {
                                               const addScore = parseInt(signInConfig.award[0].val * currVipConfig.dailySignScoreAddRate / 100);
                                               // 发放金币
                                               const beforeScore = this.userList[userId]._score;
                                               this.userList[userId]._score += addScore;
                                               dao.scoreChangeLog(userId, beforeScore, addScore, this.userList[userId]._score, TypeEnum.ScoreChangeType.daySign, 1);
                                               console.log(userId, '签到天数', consecutiveDays , '每日签到前金币', beforeScore, '未加成前领取金币', signInConfig.award[0].val, '加成百分比', currVipConfig.dailySignScoreAddRate, '每日签到后金币', this.userList[userId]._score)
                                           } else if (signInConfig.award[i].type === 1) {
                                               // 发放钻石
                                           }
                                       }
                                       callback(1)
                                   }
                               });

                           })
                       })
                   }catch (e){
                       // 回滚签到事务
                       connection.rollback();
                       log.err('签到失败' + e)
                   }
               }else{
                   callback(0)
               }
           });
        }

        // 获取大厅幸运币详情页
        this.getHallLuckyPageDetail = function (socket) {
            const self = this;
            CacheUtil.getActivityJackpot(activityJackpot =>{
                // 获取幸运币配置
                self.getTurntableJackpot(activityJackpot, turntableJackpot =>{
                    self.getLuckGlodJackpot(activityJackpot, luckGlodJackpot =>{
                        const now = new Date().getTime();
                        CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                            CacheUtil.getActivityLuckyDetailByUserId(socket.userId, ret =>{
                                if(ret){
                                    const luckyCoin = ret.luckyCoin;
                                    const luckyCoinGetStatus = ret.luckyCoinGetStatus;
                                    const doLuckyCoinTask = ret.doLuckyCoinTask;
                                    const luckyRushStartTime = ret.luckyRushStartTime;
                                    const luckyRushEndTime = ret.luckyRushEndTime;
                                    const luckyCoinTaskStatus = ret.luckyCoinTaskGetStatus;
                                    const data = {
                                        turntableJackpot: turntableJackpot, // 转盘活动奖池
                                        luckGlodJackpot: luckGlodJackpot, // 幸运币活动奖池
                                        luckyRushStartTime: luckyRushStartTime, // 幸运币刷新开始时间
                                        luckyRushEndTime: luckyRushEndTime, // 幸运币刷新结束时间
                                        currTime: now, // 服务器当前时间
                                        luckyCoinGetStatus: luckyCoinGetStatus, // 幸运币是否可领取
                                        luckyCoinTask: luckyCoinConfig.luckyCoinTask, // 每日任务数量
                                        doLuckyCoinTask: doLuckyCoinTask, // 完成任务数量
                                        luckyCoinTaskStatus: luckyCoinTaskStatus, // 任务是否可以领币 0可领 1不可领
                                        luckyCoin: luckyCoin // 当前用户幸运币个数
                                    }
                                    socket.emit('hallLuckyPageDetailResult', {code:1, data: data});
                                }
                            });
                        });
                    });
                });
            })
        }
        
        // 领取幸运币
        this.getLuckyCoin = function (socket, type, callback) {
            const userId = socket.userId;

            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                CacheUtil.getActivityLuckyDetailByUserId(userId, ret =>{
                    if(ret){
                        const luckyCoin = ret.luckyCoin;
                        const luckyCoinGetStatus = ret.luckyCoinGetStatus;
                        const luckyCoinTaskGetStatus = ret.luckyCoinTaskGetStatus;
                        if(luckyCoin === luckyCoinConfig.luckyCoinGetLimit){
                            callback(0, "领取上限")
                            return;
                        }
                        if(!luckyCoinGetStatus && !luckyCoinTaskGetStatus){
                            log.info('不可领取幸运币,用户:'+  userId +'间隔领取状态' + luckyCoinGetStatus + '完成任务状态' +luckyCoinTaskGetStatus);
                            callback(0, "不可领取状态")
                            return;
                        }
                        const now = new Date().getTime();
                        const luckyRushTimeMs = luckyCoinConfig.luckyRushTime * 60 * 1000;
                        // 更新状态
                        if(type === 0){
                            // 每隔一段时间领取幸运币
                            ret.luckyCoinGetStatus = 0;
                            // 更新领取时间
                            ret.luckyRushStartTime = now;
                            ret.luckyRushEndTime = now + luckyRushTimeMs;
                        }else if(type === 1){
                            // 做完任务领取幸运币
                            ret.luckyCoinTaskGetStatus = 0;
                            // 任务可以重做
                            ret.doLuckyCoinTask = 0;
                        }
                        // 领取币+1
                        ret.luckyCoin = luckyCoin + 1;
                        ret.pushStatus = 1; // 可推送状态

                        // 幸运金奖池-发放幸运金
                        const tempScore = 1000;
                        const beforeScore = this.userList[userId]._score;
                        this.userList[userId]._score += tempScore;
                        dao.scoreChangeLog(userId, beforeScore, tempScore, this.userList[userId]._score, TypeEnum.ScoreChangeType.luckyCoinGive, 1);

                        CacheUtil.updateActivityLuckyConfig(userId, ret).then( result =>{
                            if(result){
                                const d = {
                                    GoodsType: 0,
                                    val: tempScore
                                }
                                log.info('幸运币领取成功，用户:'+ userId + '金币:' + tempScore + '领取前:' + beforeScore + '领取后:' +  this.userList[userId]._score);
                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, d)
                            }else{
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            }
                        });
                    }
                });
            });
        }

        // 获取幸运币活动配置
        this.getLuckyCoinDetail = function (socket, val) {
            const self = this;
            try {
                const userId = socket.userId;
                // 获取幸运币配置
                CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                    CacheUtil.getActivityJackpot(activityJackpot =>{

                        self.getTurntableJackpot(activityJackpot, turntableJackpot =>{
                            self.getBaseMul(userId, activityJackpot, null, baseMul =>{
                                // 获取转盘图案
                                const iconInfos = Config.iconInfos.map(str => parseInt(str, 10));

                                let ret = {};
                                if(val){
                                    // 付费转盘
                                    ret = {
                                        baseMul: baseMul,
                                        turntableJackpot: turntableJackpot,
                                        iconInfos: iconInfos,  // 获取转盘的格子
                                        turntableBuyMulPrice: luckyCoinConfig.turntableBuyMulPrice,
                                    }
                                }else{
                                    // 免费转盘
                                    ret = {
                                        baseMul: baseMul,
                                        turntableJackpot: turntableJackpot,
                                        iconInfos: iconInfos
                                    }
                                }
                                socket.emit('luckyCoinDetailResult', {code: 1, data: ret});
                            });
                        })
                    })
                });
            }catch (e){
                log.err('getLuckyCoinDetail' + e);
                socket.emit('luckyCoinDetailResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
            }
        }



        // 收费转盘
        this.turntableCharge = function (userId, mul, callback){
            const self = this;
            redis_laba_win_pool.get_redis_win_pool().then(async function (jackpot) {
                // 活动奖池
                self.turntable(userId, mul,(code, msg, data) =>{
                    callback(code, msg, data)
                });
            });
        }


        // 转动转盘
        this.turntable = function (userId, betMul, callback) {
            const self = this;

            CacheUtil.getTurntableConfig().then(config =>{
                try {
                    if (!config) {
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                        return;
                    }
                    if (!config.coinConfig.includes(betMul)) {
                        callback(0, '输入有误')
                        return;
                    }

                    const cards = config.iconInfos.map(item => item.icon_type);
                    const weight_two_array = config.colWeight;
                    const col_count = config.baseLine.col_count;
                    const line_count = config.baseLine.line_count;
                    const iconTypeBind = config.iconBind;
                    const cardsNumber = 1;
                    let iconBindSwitch = iconTypeBind ? 1 : 0;
                    let lotteryCount = 0;

                    CacheUtil.getActivityJackpot(activityJackpot => {
                        // 转盘奖池
                        self.getTurntableJackpot(activityJackpot, turntableJackpot => {
                            let nHandCards = [];
                            let win = 0;
                            let dictAnalyseResult = {};

                            (async () => {
                                while (true) {
                                    dictAnalyseResult = {
                                        nWinLines: 0,  //  中奖的下标
                                        betMul: betMul, // 下注倍数
                                        win: 0,  // 中奖总额
                                        baseMul: 0, // 基础倍数
                                        iconMul: 0,  // 图案倍数
                                        turntableGameAddRate: 0, // VIP加成
                                        activityJackpot: 0, // 活动奖池
                                        turntableJackpot: 0, // 转盘奖池
                                        turntableMaxMul: 0, // 转盘最大倍数
                                        maxTurntableGameAddRate: 0, // 转盘VIP最大加成
                                        maxBuyMul: 0, // 转盘最大购买倍数
                                        nBetTime: Number(new Date()) // 下注时间
                                    };
                                    // 生成图案
                                    nHandCards = LABA.createHandCards(cards, weight_two_array, col_count, line_count, cardsNumber, -1, iconBindSwitch, iconTypeBind, 0, -1);

                                    let winIndex = nHandCards[0];
                                    dictAnalyseResult["nWinLines"] = winIndex;
                                    // 基础倍数*转盘倍数*VIP加成*购买倍数
                                    win = await this.getWin(userId, activityJackpot, betMul, winIndex, dictAnalyseResult);
                                    dictAnalyseResult["win"] = win;

                                    if (win === 0) {
                                        break
                                    }
                                    // 获得奖励不能大于转盘总奖池
                                    if (!iconTypeBind && turntableJackpot < win) {
                                        if (++lotteryCount > 30) {
                                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                            return;
                                        }
                                        console.log('获得奖励不能大于转盘总奖池')
                                        continue;
                                    }
                                    break;
                                }

                                // 发放奖励 返回结果
                                if (win > 0) {
                                    // 扣减总奖池
                                    redis_laba_win_pool.redis_win_pool_decrby(win).then(turntableJackpot => {
                                        log.info('大厅转盘活动' + userId + "赢" + win + "剩余奖池" + turntableJackpot)
                                        if (this.userList[userId]) {
                                            this.userList[userId].winscore(win)
                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                        } else {
                                            dao.addAccountScore(userId, win, ret => {
                                                if(ret){
                                                    if(this.userList[userId]) this.userList[userId]._score += Number(win);
                                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                                }else{
                                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                }
                            })();
                        });
                    })
                }catch (e){
                    log.err(e)
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }


            })

        }


        // 获取赢的金币
        this.getWin = async function (userId, activityJackpot, betMul, winIndex, dictAnalyseResult) {
            const self = this;
            return new Promise((resolve, reject) => {
                // 获取基础倍数
                self.getBaseMul(userId, activityJackpot, dictAnalyseResult, baseMul =>{
                    self.getTurntableGameAddRate(userId, turntableGameAddRate =>{
                        try {
                            // 奖金币 = 基础倍数 * 中奖倍数 * VIP转盘加成 * 下注倍数
                            const win = baseMul * Config.icon_mul[0][winIndex] * turntableGameAddRate * betMul;

                            dictAnalyseResult["baseMul"] = baseMul;
                            dictAnalyseResult["iconMul"] = Config.icon_mul[0][winIndex];
                            dictAnalyseResult["turntableGameAddRate"] = turntableGameAddRate;
                            console.log('转盘获得金币:' + win + '免费转盘基础倍数:', baseMul, '赢倍数:', Config.icon_mul[0][winIndex], '转盘加成:', turntableGameAddRate, '下注倍数:', betMul)
                            resolve(win);
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            });
        }


        this.getBaseMul = function (userId, activityJackpot, dictAnalyseResult, callback) {
            try{
                const self = this;
                // 获取VIP最大加成
                self.getMaxTurntableGameAddRate(maxTurntableGameAddRate =>{
                    self.getTurntableJackpot(activityJackpot, turntableJackpot =>{
                        CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                            const maxItem = luckyCoinConfig.turntableBuyMulPrice.reduce((max, current) => (current.mul > max.mul ? current : max), luckyCoinConfig.turntableBuyMulPrice[0]);
                            const maxBuyMul =  maxItem.mul;
                            const turntableMaxMul = Math.max(...Config.icon_mul[0]);

                            if(dictAnalyseResult){
                                dictAnalyseResult['activityJackpot'] = activityJackpot;
                                dictAnalyseResult['turntableJackpot'] = turntableJackpot;
                                dictAnalyseResult['turntableMaxMul'] = turntableMaxMul;
                                dictAnalyseResult['maxTurntableGameAddRate'] = maxTurntableGameAddRate;
                                dictAnalyseResult['maxBuyMul'] = maxBuyMul;
                            }
                            // 计算转盘奖池基础倍数(向下取整) = 当前奖池/转盘最大倍数/VIP加成/购买倍数最大值
                            const val = turntableJackpot / turntableMaxMul / maxTurntableGameAddRate / maxBuyMul;
                            const mul = Math.floor(val * 100) / 100;
                            // 基础倍数
                            const baseMul = Number(mul.toFixed(2))
                            console.log('计算转盘基础倍数 活动奖池:'+ activityJackpot + '转盘奖池:', turntableJackpot, '转盘最大倍数:', turntableMaxMul, 'VIP最大加成:', maxTurntableGameAddRate, '购买倍数最大值:', maxBuyMul, '未取向下取整前', val, '基础倍数', baseMul)
                            callback(baseMul);
                        });
                    });
                });
            }catch (e){
                log.err(e)
                callback(0)
            }
        }
        
        this.getTurntableGameAddRate = function (userId, callback) {
            // 获取VIP转盘加成
            dao.getVipLevel(userId, vipLevel =>{
                CacheUtil.getVipConfig().then(vipConfig =>{
                    const c =  vipConfig.find(item => item.level === vipLevel).turntableGameAddRate;
                    const turntableGameAddRate =  c ? (c / 100) : 1;
                    callback(turntableGameAddRate);
                }).catch(e =>{
                    log.err(e)
                    callback(1);
                })
            })
        }

        this.getMaxTurntableGameAddRate = function (callback) {
            try{
                CacheUtil.getVipConfig().then(config =>{
                    // 获取VIP转盘最大加成
                    const maxItem = config.reduce((max, current) => (current.turntableGameAddRate > max.turntableGameAddRate ? current : max), config[0]);
                    const maxTurntableGameAddRate = maxItem.turntableGameAddRate;
                    const max =  maxTurntableGameAddRate ? (maxTurntableGameAddRate / 100) : 1;
                    callback(max)
                })
            }catch (e){
                log.err(e)
                callback(1)
            }
        }

        // 获取转盘奖池
        this.getTurntableJackpot = function (activityJackpot, callback) {
            // 获取活动奖励配置
            CacheUtil.getActivityJackpotConfig().then(config =>{
                try {
                    const totalRatio = config.activity_jackpot_ratio.freeRatio.totalRatio;
                    const turntableRatio = config.activity_jackpot_ratio.freeRatio.turntableRatio;
                    // 转盘游戏总奖池
                    const turntableJackpot = parseInt(activityJackpot * (totalRatio / 100) * (turntableRatio / 100));
                    callback(turntableJackpot)
                } catch (e) {
                    log.err(e)
                    callback(0)
                }
            })
        }

        // 获取幸运金奖池
        this.getLuckGlodJackpot = function (activityJackpot, callback) {
            // 获取活动奖励配置
            CacheUtil.getActivityJackpotConfig().then(config =>{
                try {
                    const totalRatio = config.activity_jackpot_ratio.freeRatio.totalRatio;
                    const turntableRatio = config.activity_jackpot_ratio.freeRatio.luckyGoldRatio;
                    // 转盘游戏总奖池
                    const luckGlodJackpot = parseInt(activityJackpot * (totalRatio / 100) * (turntableRatio / 100));
                    callback(luckGlodJackpot)
                } catch (e) {
                    log.err(e)
                    callback(0)
                }
            })

        }

        // 绑定邀请码
        this.bindInviteCode =function (socket, inviteCode, callback) {

            dao.existInviteCode(inviteCode, row =>{
                const userId = socket.userId;
                if(!row){
                    // 错误的邀请码
                    callback(0, '错误的邀请码')
                }else if(row.userId === userId){
                    // 自己的邀请码
                    callback(0, '自己的邀请码')
                }else{
                    const agentUserId = row.userId;
                    // 绑定 事务connection
                    ymDao.bindIniteCode(agentUserId , userId, (row, connection) =>{
                        if(row){
                            log.info('成功绑定邀请码,代理人:' + agentUserId + '用户:' + userId)
                            CacheUtil.getDownloadExtConfig().then(downloadExtConfig =>{
                                // 送的数量
                                const onceMaxAgentReward = downloadExtConfig.reward_agent_once.find(item => item.type === TypeEnum.GoodsType.gold).reward;
                                const onceMaxInviteeReward = downloadExtConfig.reward_invitee_once.find(item => item.type === TypeEnum.GoodsType.gold).reward;
                                const inviteeRewardGold = onceMaxInviteeReward ? parseInt(onceMaxInviteeReward) : 0;
                                const agentRewardGold = onceMaxAgentReward ? parseInt(onceMaxAgentReward) : 0;

                                // 给代理人增加人头数
                                this.addInvitedNumber(agentUserId, agentRewardGold, connection, ret =>{
                                    if(ret){
                                        // 提交事务
                                        connection.commit(err => {
                                            connection.release();
                                            if(err){
                                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                            }else{
                                                // 给绑定用户立即送金币
                                                const beforeScore = this.userList[userId]._score;
                                                this.userList[userId]._score += inviteeRewardGold;
                                                dao.scoreChangeLog(userId, beforeScore, inviteeRewardGold, this.userList[userId]._score, TypeEnum.ScoreChangeType.inviteBindUser, 1);
                                                log.info('代理' + agentUserId + '邀请用户' + userId + '送给用户金币' + inviteeRewardGold)
                                                // 返点记录（代理人金币未领取）
                                                ymDao.agentRebateRecord(agentUserId, userId, TypeEnum.CurrencyType.Brazil_BRL, 0, agentRewardGold, TypeEnum.AgentRebateType.bindInviteCode, TypeEnum.AgentRebateStatus.unissued, row =>{
                                                    if(row){
                                                        // 发邮件通知代理人
                                                        this.saveEmail(LanguageItem.new_hand_bind_title, TypeEnum.EmailType.agent_bind_inform, agentUserId, 0, LanguageItem.new_hand_bind_content, row.insertId, TypeEnum.GoodsType.gold)
                                                    }
                                                })
                                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                                            }
                                        })
                                    }else{
                                        connection.release();
                                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                    }
                                });
                            });
                        }else{
                            log.info('邀请码重复绑定' + userId + '邀请码:' + inviteCode)
                            callback(0, '重复绑定')
                        }
                    });
                }
            });
        }

        // 增加绑定人头数
        this.addInvitedNumber = function (userId, gold, connection, callback) {
            ymDao.searchCurrDayInvite(userId, ret =>{
                if(ret){
                    // 推广奖励表 增加邀请人数 累计奖励
                    ymDao.addInviteSends(userId, gold, connection, r =>{
                        if(r){
                            callback(1)
                        }else{
                            callback(0)
                        }
                    })
                }else{
                    // 推广奖励表 新增奖励记录
                    ymDao.insertInviteSends(userId, gold, connection, r=>{
                        if(r){
                            callback(1)
                        }else{
                            callback(0)
                        }
                    });
                }
            })

        }


        // 查询绑定的邀请码
        this.searchInvitedCode = function (socket) {
            ymDao.searchInviteUser(socket.userId, row =>{
                if(row){
                    dao.searchInvitedCode(row.invite_uid, ret =>{
                        if(ret){
                            socket.emit('searchInvitedCodeResult', {code:1, data: {inviteCode: ret.invite_code}});
                        }else{
                            socket.emit('searchInvitedCodeResult', {code:1, data: {inviteCode: ''}});
                        }
                    })
                }else{
                    socket.emit('searchInvitedCodeResult', {code:1, data: {inviteCode: ''}});
                }
            });
        }


        this.searchInvitedDetail = function (userId, callback) {
            const result = {
                totalRebate: 0, // 总收入
                todayRebate: 0, // 今日佣金
                yestRebate: 0,  // 昨日佣金
                totalNum: 0, // 团队人数
                todayNum: 0, // 今日新增人数
                yestNum: 0, // 昨日新增人数
                waitGetRebate: 0 // 待领取佣金
            }
            ymDao.inviteDetail(userId, row =>{
                if(row){
                    result.totalRebate = row.totalRebate;
                    result.todayRebate = row.todayRebate;
                    result.yestRebate = row.yestRebate;
                    result.totalNum = row.totalNum;
                    result.todayNum = row.todayNum;
                    result.yestNum = row.yestNum;
                    result.waitGetRebate = row.waitGetRebate;
                }
                callback(result);
            })
        }

        // 查询返点记录
        this.searchAgentRebateRecord = function (socket) {
            ymDao.searchAgentRebateRecord(socket.userId, row =>{
                if(row){
                    socket.emit('searchAgentRebateRecordResult', {code:1, data: row});
                }else{
                    socket.emit('searchAgentRebateRecordResult', {code:1, data:[]});
                }
            })
        }

        // 领取返点
        this.getRebate = function (socket, callback) {
            const userId = socket.userId;
            // 查询未领取的返点
            ymDao.searchInviteSend(userId, row =>{

                if(row){
                    const ids = row.map(item => item.id);
                    let goldSum = row.reduce((accumulator, item) => {
                        return accumulator + item.rebate_glod;
                    }, 0);
                    // 领取返点
                    ymDao.agentUpdateRebateById(ids, TypeEnum.AgentRebateStatus.success,r =>{
                        if(r){
                            // 增加金币 金币流水
                            row.forEach(item =>{
                                log.info('领取返点'+ userId +'类型:' + item.type + '金币数量:' + item.rebate_glod);
                                const beforeScore = this.userList[userId]._score;
                                this.userList[userId]._score += item.rebate_glod;
                                dao.scoreChangeLog(userId, beforeScore, item.rebate_glod, this.userList[userId]._score, item.type, 1)
                            })
                            log.info('领取返点'+ userId + '金币总数:' + goldSum);
                            // 记录领取返点记录
                            ymDao.agentGetRebateRecord(socket.userId, goldSum, ret =>{
                                if(ret){
                                    this.searchInvitedDetail(socket.userId, result =>{
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg);
                                    });
                                }
                            })
                        }else{
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    });
                }else{
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }

        // 查询代理人返点记录
        this.searchAgentGetRebateRecord =function (socket) {
            ymDao.searchAgentGetRebateRecord(socket.userId, row =>{
                if(row){
                    socket.emit('getRebateRecordResult', {code:1, data: row});
                }else{
                    socket.emit('getRebateRecordResult', {code:1, data: []});
                }
            })
        }



        // 注销账号
        this.logoutAccount =function (socket) {
            dao.logoutAccount(socket.userId, row =>{
                if(row){
                    socket.emit('logoutAccountResult', {code:1, msg:"成功"});
                }else{
                    socket.emit('logoutAccountResult', {code:0, msg:"失败"});
                }
            })
        }

        // 客服信息
        this.customerServiceInfo =function (socket) {
            ymDao.searchCustomerServiceInfo(socket.userId, row =>{
                if(row){
                    const ret = row.map(item =>{
                       return {
                           id: item.id,
                           name: item.name,
                           email: item.email,
                           url: item.customer_url
                       }
                    });
                    socket.emit('customerServiceInfoResult', {code:1, data: ret});
                }else{
                    socket.emit('customerServiceInfoResult', {code:1, data: []});
                }
            })
        }

        //建议反馈
        this.feedback = function (socket, txt, callback) {
            ymDao.insertFeedback(socket.userId, txt, row =>{
                if(row){
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                }else{
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        // 联系我们-问题答案
        this.contactUs = function (socket, callback) {
            ymDao.searchIssue(row =>{
                if(row){
                    callback(ErrorCode.SUCCESS.code, row)
                }else{
                    callback(ErrorCode.SUCCESS.code, [])
                }
            })
        }


        // 设置语言
        this.setLang = function (socket, language) {
           dao.updateLang(socket.userId, language, ret =>{
               if(ret){
                   this.userList[socket.userId].language = language;
                   socket.emit('langResult', {code:1, msg:"成功"});
               }else{
                   socket.emit('langResult', {code:0, msg:"失败"});
               }
           });
        }


        //获得用户当前分数
        this.getPlayerScore = function (_userId, _callback) {
            if (!_userId) {	//传输ID错误
                console.log("查询分数,参数错误");
                return -1;
            }
            var sendStr;
            if (this.userList[_userId]) {//未找到用户
                if (this.userList[_userId].getGameId()) {
                    //游戏在线
                    var gameScoket = ServerInfo.getScoket(this.userList[_userId].getGameId());
                    gameScoket.emit('getgold', {userid: _userId});
                    gameScoket.on('getgoldResult', function (msg) {
                        //console.log(msg);
                        if (msg.Result) {
                            //sendStr = msg.score.toString();
                            sendStr = JSON.stringify({
                                status: 0,
                                msg: "",
                                data: {score: msg.score, diamond: msg.diamond}
                            });
                            _callback(sendStr);
                        } else {
                            sendStr = '{"status":1,"msg":"在线查询分数失败"}';
                            _callback(sendStr);
                        }
                        gameScoket.removeAllListeners('getgoldResult');
                    })
                } else {
                    //只是在登录服务器
                    //sendStr = this.userList[_userId].getScore().toString();
                    sendStr = '{"status":0,"msg":"","data":{"score":' + this.userList[_userId].getScore() + ',"diamond":' + this.userList[_userId].getDiamond() + '}}';
                    _callback(sendStr)
                    //return this.userList[_userId].getScore();
                }

            } else {
                sendStr = '{"status":1,"msg":"在线查询分数失败"}';
                _callback(sendStr);
            }
        };

        //给在线的用户加分
        this.addgold = function (_userId, score, callback) {

            if (!_userId) {					//传输ID错误
                console.log("加分,未登录")
                return 0;
            }
            if (!this.userList[_userId]) {	//未找到用户
                console.log("加分,未登录")
                return 0
            } else {
                const gameScoket = ServerInfo.getScoket(this.userList[_userId].getGameId());
                if(gameScoket){
                    var self = this;
                    gameScoket.emit('addgold', {userid: _userId, addgold: score})
                    gameScoket.on('addgoldResult', function (msg) {
                        if (msg.Result) {
                            //可以成功加减分
                            const score_before = self.userList[_userId].getScore();
                            self.userList[_userId].addgold(score)
                            callback(1, score_before);
                        } else {
                            callback(0)
                        }
                        gameScoket.removeAllListeners('addgoldResult');
                    })
                }
            }

        }

        //给在线的用户加钻石
        this.adddiamond = function (_userId, diamond, callback) {
            this.userList[_userId]._diamond += diamond;
        }


        //进入游戏
        this.LoginGame = function (_userId, _sign, gametype, _enCoin) {
            //用户添加游戏ID
            if (!this.userList[_userId]) {
                log.err("进入游戏,用户" + _userId + "不存在");
                return {_userId: 0, msg: "用户不存在"};
            }

            if (this.userList[_userId].deleteFlag) {
                log.err("进入游戏,用户正在删除" + _userId);
                return {_userId: 0, msg: "用户不存在"};
            }

            //先获得是否在断线列表中****
            var linemsg = this.getLineOutMsg(_userId);

            if (_enCoin === -1) {
                log.err("进入房间条件出错!")
                return {_userId: 0, msg: "进入房间条件出错!"};
            }

            if (this.userList[_userId]._Robot && RobotConfig.robotEnterCoin[gametype]) {
                this.userList[_userId]._score = Math.floor(Math.random() * (RobotConfig.robotEnterCoin[gametype].max - RobotConfig.robotEnterCoin[gametype].min)) + RobotConfig.robotEnterCoin[gametype].min;
                log.info(gametype);
                log.info(this.userList[_userId]._score);
            }


            //获得对应游戏所需要进入的金币
            if (this.userList[_userId]._sign == _sign) {
                log.info(_userId + "进入游戏" + gametype);
                this.userList[_userId].loginGame(gametype);
                var userInfo = {};
                userInfo._userId = this.userList[_userId]._userId;
                userInfo._account = this.userList[_userId]._account;
                userInfo._score = this.userList[_userId]._score;
                userInfo._nickname = this.userList[_userId]._nickname;
                userInfo.freeCount = this.userList[_userId].freeCount;
                userInfo.LoginCount = this.userList[_userId].LoginCount;
                userInfo.LotteryCount = this.userList[_userId].LotteryCount;
                userInfo.propList = this.userList[_userId]._proList;
                userInfo._headimgurl = this.userList[_userId]._headimgurl;
                userInfo._Robot = this.userList[_userId]._Robot;
                userInfo._diamond = this.userList[_userId]._diamond;   //钻石
                userInfo.is_vip = this.userList[_userId].is_vip;   //vip
                userInfo.vip_score = this.userList[_userId].vip_score;   //vip积分
                userInfo.bankScore = this.userList[_userId].bankScore;   //银行积分
                userInfo.totalRecharge = this.userList[_userId].totalRecharge;   //银行积分
                return userInfo;
            } else {
                log.err("用户进入游戏" + _userId + "密码错误!");
                return {_userId: 0, msg: "密码错误!"};
            }

        };

        // 在大厅的用户，不应该在游戏内 断开游戏连接
        this.existGameDel = function (userId) {
            const gameId = this.userList[userId].getGameId();
            if (gameId) {
                // 在大厅的用户，不应该在游戏内 断开游戏连接
                const gameScoket = ServerInfo.getScoket(gameId);
                log.info('在大厅的用户，不应该在游戏内 断开游戏连接userId', + userId + 'gameId' + gameId);
                if(gameScoket) gameScoket.emit('disconnectUser', {userId: userId});
            }
        }




        //新邮件推送
        this.haveNewEmail = function (data) {
            //如果用户在线并且在大厅
            switch (data.type) {
                case 2:
                    if (this.userList[data.userid]) {
                        if (!this.userList[data.userid].getGameId()) {
                            this.userList[data.userid]._socket.emit('newEmailResult', {Result: 1});
                        }
                    }
                    break;
                case 999:
                    for (let i in this.userList) {
                        if (!this.userList[i].getGameId()) {
                            this.userList[i]._socket.emit('newEmailResult', {Result: 1});
                        }
                    }
                    break;
            }

        };
        // 查询邮件
        this.getEmail = function (_socket) {
            this.searchEmail(_socket.userId, newList =>{
                if (newList.length > 0) {
                    _socket.emit('getEmailResult', {code: 1, data: newList});
                } else {
                    _socket.emit('getEmailResult', {code: 0, msg: "未查到新邮件"});
                }
            });
        };
        // 查询邮件
        this.searchEmail = function (userId, callback) {
            let emails = [];
            dao.selectEmailTypes(userId, (code, types) =>{
                if(code){
                    // 查询邮件
                    dao.selectEmail(types, userId, (code, res) => {
                        if (code) {
                            for (let i = 0; i < res.length; i++) {
                                emails.push(res[i]);
                            }
                        }
                        callback(emails);
                    });
                }else{
                    callback(emails);
                }
            });
        }
        // 设置邮件已读
        this.setEmailRead = function (_socket, _info) {
            dao.setEmailisRead(_info.id, (code) => {
                if (code) {
                    // 返回已读后邮件
                    this.searchEmail(_socket.userId, newList =>{
                        if (newList.length > 0) {
                            _socket.emit('setEmailReadResult', {code: 1, data: newList});
                        }else{
                            _socket.emit('setEmailReadResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };

        // 全部已读
        this.setEmailAllRead = function (_socket) {
            dao.setEmailisAlllReadByUserId(_socket.userId, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList =>{
                        if (newList.length > 0) {
                            _socket.emit('setEmailAllReadResult', {code: 1, data: newList});
                        }else{
                            _socket.emit('setEmailAllReadResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };

        // 删除指定邮件
        this.delEmailById = function (_socket, id) {
            dao.delEmailById(id, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList =>{
                        if (newList.length > 0) {
                            _socket.emit('delEmailByIdResult', {code: 1, data: newList});
                        }else{
                            _socket.emit('delEmailByIdResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };

        // 邮件已读全部删除
        this.emailAllDel = function (_socket) {
            dao.delEmailisAlllReadByUserId(_socket.userId, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList =>{
                        if (newList.length > 0) {
                            _socket.emit('emailAllDelResult', {code: 1, data: newList});
                        }else{
                            _socket.emit('emailAllDelResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };

        //领取邮件金币
        this.lqCoin_email = function (_socket, _info) {
            let state = _info.state;
            let id = _info.id;
            let coin = _info.coin;
            dao.updateCoinLogState(state, id, (code) => {
                if (code) {
                    //获得金币
                    let sendInfo = {
                        sendUserId: _socket.userId,
                        sendCoin: coin,
                        change_type: 11,
                        diamond: 0
                    };
                    this.GameBalance(sendInfo);

                    _socket.emit('lqCoin_emailResult', {Result: 1, data: {state: state, id: id}});
                } else {
                    console.log("updateCoinLogState失败");
                }
            });
        };


        // 查询账户信息
        this.searchAccountByDeviceCode = function (deviceCode, callback) {
            dao.searchAccountByDeviceCode(deviceCode, callback);
        }

        // 更新账户信息
        this.updateAccountByDeviceCode = function (deviceCode, account,  callback) {
            dao.updateAccountByDeviceCode(deviceCode, account, callback);
        }

        // 线注对应jackpot
        this.betsJackpot = function (gameId, callback) {
            const serverInfo = ServerInfo.getServerInfoById(gameId);
            if (serverInfo) {
                const gameName = serverInfo.GameName;
                CacheUtil.getGameConfig(gameName, gameId).then(gameConfig => {
                    try {
                        callback(gameConfig.betsJackpot);
                    }catch (e){
                        log.err('betsJackpot' + e)
                        callback(0);
                    }
                })
            } else {
                callback(0);
            }

        }

        // 保存新手步数
        this.saveGuideStep = function (userId, step, callback) {
            dao.updateGuideStep(userId, step, row =>{
                if(row){
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                }else{
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            });
        }


        //检测昵称
        this.checkNickName = function (_socket, _info) {
            //被赠送id
            //金额
            //log.info("收到来自" + _socket.userId + "检测ID");
            if (parseInt(_info.userId, 10) != _info.userId && _info.userId < 1) {
                _socket.emit('checkNickNameResult', {resultCode: 0, msg: "检测ID错误"});
                return;
            }
            var self = this;

            dao.checkNickName(_info.userId, function (result, nickName) {
                if (self.userList[_socket.userId]) {
                    if (result) {
                        //log.info("发送" + _socket.userId + "检测ID");
                        self.userList[_socket.userId]._socket.emit("checkNickNameResult", {
                            resultCode: 1,
                            nickName: nickName
                        });
                    } else {
                        self.userList[_socket.userId]._socket.emit("checkNickNameResult", {
                            resultCode: 0,
                            nickName: ""
                        });
                    }
                } else {
                    log.err("检测ID:" + _socket.userId + "不存在");
                }
            });
        };
        //检测昵称
        this.checkNickName2 = function (_socket, _info) {
            //被赠送账号
            //金额
            //log.info("收到来自" + _socket.userId + "检测ID");
            var self = this;

            dao.checkNickName2(_info.userName, function (result, nickName) {
                if (self.userList[_socket.userId]) {
                    if (result) {
                        //log.info("发送" + _socket.userId + "检测ID");
                        self.userList[_socket.userId]._socket.emit("checkNickNameResult", {
                            resultCode: 1,
                            nickName: nickName
                        });
                    } else {
                        self.userList[_socket.userId]._socket.emit("checkNickNameResult", {
                            resultCode: 0,
                            nickName: ""
                        });
                    }
                } else {
                    log.err("检测ID:" + _socket.userId + "不存在");
                }
            });
        };

        //修改昵称
        this.updateNickName = function (socket, _info) {
            const userId  = socket.userId;
            if (!this.userList[userId]) {
                log.err("更新用户ID,用户" + userId + "不存在");
                socket.emit('updateNickNameResult', {code: 0, msg: "ID不存在"});
                return;
            }

            if (_info.newNickName == "") {
                socket.emit('updateNickNameResult', {code: 0, msg: "昵称不能为空"});
                return;
            }

            dao.updateNickName(userId, _info.newNickName, function (result, nickName) {
                if (result) {
                    socket.emit("updateNickNameResult", {code: 1, msg: "修改成功"});
                } else {
                    socket.emit("updateNickNameResult", {code: 0, msg: "修改失败"});
                }
            });
        }

        //修改头像
        this.updateHeadUrl = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                _socket.emit('updateHeadUrlResult', {code: 0, msg: "ID不存在"});
                return;
            }

            //头像
            if (_info.url === null || _info.url === undefined) {
                _socket.emit('updateHeadUrlResult', {code: 0, msg: "头像不能为空"});
                return;
            }
            var self = this;

            dao.updateHeadUrl(_socket.userId, _info.url, function (result, head_url) {
                if (self.userList[_socket.userId]) {
                    if (result) {
                        self.userList[_socket.userId]._headimgurl = _info.url;
                        self.userList[_socket.userId]._socket.emit("updateHeadUrlResult", {
                            code: 1,
                            msg: "修改成功",
                            url: _info.url
                        });
                    } else {
                        self.userList[_socket.userId]._socket.emit("updateHeadUrlResult", {code: 0, msg: "修改失败"});
                    }
                }
            });
        }




        // 绑定银行卡
        this.bindBankCard = function (userId, account, bankType, name, cpf, callback) {
            dao.addBank(userId, account, name, cpf, bankType, function (result, nickName) {
                if (result) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg);
                } else {
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg);
                }
            });
        };



        this.sendEmail = function (info) {
            var self = this;

            dao.sendEmail(info, function (result, idx) {
                if (result) {
                    if (self.userList[info.userId]) {
                        var prize = {
                            id: idx,
                            propId: info.winPropId,
                            propCount: info.winPropCount,
                            winScore: info.winScore,
                            rankidx: 0,
                            isGetPrize: 0,
                            type: info.type,
                            sendCoinUserId: info.sendCoinUserId,
                            nickName: info.nickName
                        };

                        self.userList[info.userId]._socket.emit("addPrize", prize);
                        //判断是否已经有此条记录
                        var same = false;
                        if (self.userList[info.userId] && self.userList[info.userId]._prize) {
                            for (var j = 0; j < self.userList[info.userId]._prize.length; j++) {
                                if (self.userList[info.userId]._prize[j].id == prize.id) {
                                    same = true;
                                    break;
                                }
                            }
                        }

                        if (!same) {
                            self.userList[info.userId]._prize.push(prize);
                        }

                    }
                }
            });
        };



        // 发送邮箱验证码
        this.sendEmailCode = function (_socket, toEmail, callback) {
            // 邮箱地址校验
            if (!emailValidator(toEmail)) {
                callback(ErrorCode.EMAIL_INPUT_ERROR.code, ErrorCode.EMAIL_INPUT_ERROR.msg)
                return;
            }

            SendEmail(toEmail,  code =>{
                //if(code){
                    // const verificationCode = code;
                    const verificationCode = 666666;
                    CacheUtil.cacheEmailExpireCode(verificationCode, toEmail, ret =>{
                        if(ret){
                            // 存储验证码
                            CacheUtil.cacheEmailCode(verificationCode, toEmail, flag =>{
                                if(flag){
                                    log.info('邮箱验证码发送成功' + toEmail + 'code:' + verificationCode);
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                                }else{
                                    log.err('邮箱验证码发送失败' + toEmail);
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                }
                            });
                        }else{
                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                        }
                    });
                //}
            });
        };

        // 绑定邮箱验证码
        this.bindEmail = function (socket, email, code, callback) {
            // 邮箱地址校验
            if (!emailValidator(email)) {
                callback(0, ErrorCode.EMAIL_INPUT_ERROR.msg)
                return;
            }
            // 判断邮箱是否绑定
            dao.emailSearch(email, exits =>{
                if(exits){
                    console.log('邮箱已绑定', socket.userId, 'email:', email);
                    callback(0, ErrorCode.EMAIL_BINDED.msg)
                }else{
                    // 验证码校验
                    this.verifyEmailCode(email, code, (c, msg) =>{
                        if(c === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                            // 绑定邮箱
                            dao.emailBind(socket.userId, email, ret =>{
                                if(ret){
                                    // 转正式账号
                                    this.changleOfficial(socket.userId);
                                    const result = {
                                        goodsType: [TypeEnum.GoodsType.diamond],
                                        sourceVal: [30]
                                    }
                                    callback(ErrorCode.SUCCESS.code, result)
                                }else{
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                }
                            });
                        }else{
                            callback(0, msg)
                        }
                    });
                }
            });
        }

        this.changleOfficial = function (userId) {
            // 绑定邮箱成功 转为正式账号
            this.userList[userId]._official = 1;
            dao.changleOfficial(userId, ret =>{
                if(ret){
                    console.log('转正成功', userId)
                }
            })
        }

        // 注册
        this.registerByEmail = function (_socket, email, code, callback) {
            if(isNaN(code)){
                callback(ErrorCode.EMAIL_CODE_INPUT_ERROR.code, ErrorCode.EMAIL_CODE_INPUT_ERROR.msg)
                return;
            }
            this.verifyEmailCode(email, code, (code, msg) =>{
                if(code === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                    //判断邮箱是否注册
                    dao.emailSearch(email, exits =>{
                        if(exits){
                            log.info('邮箱已注册' + email);
                            callback(ErrorCode.ACCOUNT_REGISTERED_ERROR.code, ErrorCode.ACCOUNT_REGISTERED_ERROR.msg)
                            return;
                        }
                        // 生成账户密码
                        const time = StringUtil.generateTime();
                        const account = StringUtil.generateAccount('ABC', time);
                        const king = StringUtil.generateKing();
                        const nickname = StringUtil.generateNickName(time);
                        const pwd = StringUtil.pwdEncrypt(account, king);
                        // 通过邮箱注册
                        dao.registerByEmail(_socket, email, account, pwd, nickname, king, row =>{
                            if(row){
                                log.info('邮箱注册成功' + email);
                                callback(ErrorCode.REGISTER_SUCCESS.code, ErrorCode.REGISTER_SUCCESS.msg)
                                // 设置邀请码
                                this.setInviteCode(row.Id);
                            }else{
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            }
                        });
                    });
                }else{
                    callback(code, msg)
                }
            });
        }

        this.verifyEmailCode = function (email, code, callback) {
            CacheUtil.verifyEmailCode(code, email, callback);
        }

        // 设置邀请码
        this.setInviteCode = function (userId){
            try {
                if(!userId) return;
                const inviteCode = HashCodeUtil.generateInviteCode(userId);
                dao.saveInviteCode(userId, inviteCode);
            }catch (e){
                log.err('设置邀请码' + e)
            }
        }


        //领奖
        this.getPrize = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                return;
            }
            var prize = this.userList[_socket.userId]._prize;

            if (!prize || prize.length <= 0) {
                _socket.emit('getPrizeResult', {Result: 0, msg: "领奖列表为空"});
                return;
            }

            var found = false;
            for (var i = 0; i < prize.length; i++) {
                if (_info.id == prize[i].id) {
                    found = true;
                    if (!prize[i].isGetPrize) {
                        prize[i].isGetPrize = 1;
                        _socket.emit('getPrizeResult', {
                            Result: 1,
                            msg: "成功领取",
                            data: {
                                winPropId: prize[i].propId,
                                winPropCount: prize[i].propCount,
                                winScore: prize[i].winScore
                            }
                        });
                        var myNowScore = this.userList[_socket.userId].getScore();
                        log.info(_socket.userId + "领取前" + myNowScore);
                        //内存添加金币
                        this.userList[_socket.userId].addgold(prize[i].winScore);

                        var myAfScore = this.userList[_socket.userId].getScore();
                        log.info(_socket.userId + "成功领取" + prize[i].winScore);
                        log.info(_socket.userId + "剩余" + myAfScore);
                        //内存添加道具
                        if (this.userList[_socket.userId]._proList[prize[i].propId]) {
                            this.userList[_socket.userId]._proList[prize[i].propId] += prize[i].propCount;
                        } else {
                            this.userList[_socket.userId]._proList[prize[i].propId] = prize[i].propCount;
                        }
                        var info = {
                            userId: _socket.userId,
                            propId: prize[i].propId,
                            propCount: prize[i].propCount,
                            roomid: 0,
                            typeid: 3
                        };
                        //数据库添加道具
                        dao.updateProp(info, function (result) {
                        });
                        //数据库更新
                        dao.getPrize(_info.id, function (Result) {
                        });

                        //给自己做钱的记录
                        var score_change = prize[i].winScore;
                        if (prize[i].winScore > 0) {
                            var userInfo = {
                                userid: _socket.userId,
                                score_before: myNowScore,
                                score_change: score_change,
                                score_current: myAfScore,
                                change_type: 6,
                                isOnline: true
                            };
                            this.score_changeLogList.push(userInfo);
                        }

                        return;
                    } else {
                        _socket.emit('getPrizeResult', {Result: 0, msg: "奖品已经领取"});
                        return;
                    }
                    break;
                }
            }

            if (!found) {
                _socket.emit('getPrizeResult', {Result: 0, msg: "未能找到领奖ID"});
                return;
            }
        }



        this.getServerRank = function (_socket, _info) {
            _socket.emit('getServerRankResult', {Result: 1, msg: "", data: this.gameRank[_info.serverId]});
        };

        this.setServerRank = function (_info) {
            this.gameRank[_info.serverId] = _info;
        };


        this.refreshLuckCoinActivity = function () {
            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                CacheUtil.getActivityLuckyDetail(ret =>{
                    if(ret){
                        try {
                            const now = new Date().getTime();
                            const luckyRushTimeMs = luckyCoinConfig.luckyRushTime * 60 * 1000;
                            for (const userIdKey in ret) {
                                const luckyItem = JSON.parse(ret[userIdKey]);
                                let update = false;

                                // 可领取状态 未领取
                                if (now >= luckyItem.luckyRushEndTime && luckyItem.luckyCoinGetStatus === 0) {
                                    // 置为可领取
                                    luckyItem.luckyCoinGetStatus = 1;
                                    luckyItem.luckyRushStartTime = now;
                                    luckyItem.luckyRushEndTime = now + luckyRushTimeMs;
                                    // 在线玩家推送幸运币可领取状态
                                    if (this.userList[userIdKey] && luckyItem.pushStatus === 1) {
                                        log.info('在线玩家推送幸运币可领取状态' + userIdKey)
                                        luckyItem.pushStatus = 0;
                                        this.userList[userIdKey]._socket.emit('luckyCoinGetStatus', {
                                            code: 1,
                                            data: {luckyCoinGetStatus: 1}
                                        });
                                    }
                                    update = true;
                                }

                                const doLuckyCoinTask = luckyItem.doLuckyCoinTask;
                                if (doLuckyCoinTask > 0 && doLuckyCoinTask >= luckyCoinConfig.luckyCoinTask) {
                                    luckyItem.luckyCoinTaskGetStatus = 1;
                                    // 在线玩家推送幸运币可领取状态
                                    if (this.userList[userIdKey] && luckyItem.pushStatus === 1) {
                                        log.info('在线玩家推送幸运币可领取状态' + userIdKey)
                                        luckyItem.pushStatus = 0;
                                        this.userList[userIdKey]._socket.emit('luckyCoinGetStatus', {
                                            code: 1,
                                            data: {luckyCoinGetStatus: 1}
                                        });
                                    }
                                    update = true;
                                }
                                if (update) {
                                    CacheUtil.updateActivityLuckyConfig(userIdKey, luckyItem);
                                }
                            }
                        }catch (e){
                            log.err(e)
                        }
                    }
                })
            });
        }

        // 更新账户信息
        this.batchUpdateAccount = function () {
            this.batchUpdateOnLineAccount();
            this.batchUpdateOffLineAccount();
        }

        this.batchUpdateOffLineAccount = function () {
            const self = this;
            let saveList = [];
            // 离线的用户
            for (const k in this.tempuserList) {
                // 登录成功标识
                if (this.tempuserList[k].loginEnd) {
                    saveList.push(this.tempuserList[k]);
                    delete this.tempuserList[k];
                }
            }
            if (saveList.length < 1) {
                return;
            }
            dao.batchUpdateAccount(saveList, function (users) {
                if(users){
                    for (let i = 0; i < users.length; ++i) {
                        log.info("成功保存离线用户信息" + users[i].id + " socre:" + users[i].score + " diamond:" + users[i].diamond + " bankScore:" + users[i].bankScore + " housecard:" + users[i].housecard+ " is_vip:" + users[i].is_vip+ " vip_score:" + users[i].vip_score+ " firstRecharge:" + users[i].firstRecharge);
                        saveList = [];
                    }
                }
            });
        }

        this.batchUpdateOnLineAccount = function () {
            let saveList = [];
            // 离线的用户
            for (const k in this.userList) {
                saveList.push(this.userList[k]);
            }

            if (saveList.length < 1) {
                return;
            }

            dao.batchUpdateAccount(saveList, function (users) {
                const seconds = new Date().getSeconds();
                if(users){
                    for (let i = 0; i < users.length; ++i) {
                        if(seconds % 25 === 0) log.info("成功保存在线用户信息" + users[i].id + '金币:' + users[i].score);
                    }
                }
                saveList = [];
            });
        }

        //金币排行
        this.getCoinRank = function (_socket) {
            dao.getCoinRank((res) => {
                if (res == 0) {
                    console.log("获取金币排行错误");
                } else {
                    _socket.emit("getCoinRankResult", {ResultCode: 1, result: res});
                }
            });
        };
        //钻石排行
        this.getDiamondRank = function (_socket) {
            dao.getDiamondRank((res) => {
                if (res == 0) {
                    console.log("获取钻石排行错误");
                } else {
                    _socket.emit("getDiamondRankResult", {ResultCode: 1, result: res});
                }
            });
        };
        // 商城商品列表
        this.getShoppingGoods = function (userId, callback) {
            CacheUtil.getVConfig().then(config =>{
                const ratio = config.recharge_vip_socre_percentage / 100;
                CacheUtil.getShopConfig().then(shopConfig =>{
                    try {
                        let result = [];
                        for (let i = 0; i < shopConfig.length; i++) {
                            const item = shopConfig[i];
                            item.vip_score = undefined;
                            // 首充需要增加字段
                            if(item.group === 1){
                                item.vip_score = StringUtil.rideNumbers(item.target_price, ratio);
                            }
                            if (result[item.group]) {
                                result[item.group].push(item);
                            } else {
                                result[item.group] = [];
                                result[item.group].push(item);
                            }
                        }
                        const data = {
                            firstRecharge: 1, // 默认买过首充礼包
                            goods : result // 商品列表
                        }

                        if(this.IsPlayerOnline(userId)){  // 用户在大厅
                            data.firstRecharge = this.userList[userId].firstRecharge;
                            callback(1, ErrorCode.SUCCESS.msg, data)
                        }else{ // 用户不在大厅
                            // 查询是否购买过首充商品
                            dao.searchFirstRecharge(userId, rows =>{
                                if(rows){
                                    data.firstRecharge = rows.firstRecharge;
                                }
                                callback(1, ErrorCode.SUCCESS.msg, data)
                            })
                        }
                    }catch (e) {
                        log.err(e)
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    }
                });
            })
        };

        // 限时折扣
        this.discountLimited = function (userId, callback){
            CacheUtil.userDiscountLimited(userId, (ret, currTime, endTime) =>{
                if(!ret){
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                   return;
                }
                CacheUtil.getDiscountLimitedConfig().then(config =>{
                    const ret = {
                        currTime: currTime,
                        endTime: endTime,
                        product: config
                    }
                    if(config){
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, ret)
                    }else{
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    }
                })
            })
        }

        // 全服跑马灯通知
        this.sendAllNotifyMsg = function (noticeMsg) {
            for (const item in this.userList) {
                this.userList[item]._socket.emit('noticeMsg', noticeMsg);
            }
        }
        // 跑马灯通知
        this.sendNotifyMsg = function (userId, noticeMsg) {
            this.userList[userId]._socket.emit('noticeMsg', noticeMsg);
        }


        this.score_changeLog = function () {
            var self = this;
            var saveListTemp = [];
            var ItemTemp;
            var max = 0;
            if (this.score_changeLogList.length > 20) {
                max = 20;
            } else {
                max = this.score_changeLogList.length;
            }

            for (var i = 0; i < max; i++) {
                if (this.score_changeLogList.length > 0) {
                    ItemTemp = this.score_changeLogList.shift();
                    //发送API结束
                    saveListTemp.push(ItemTemp);
                }
            }
            if (saveListTemp.length > 0) {
                dao.score_changeLog(saveListTemp);
            }

        };

        this.diamond_changeLog = function () {
            var self = this;
            var saveListTemp = [];
            var ItemTemp;
            var max = 0;
            if (this.diamond_changeLogList.length > 20) {
                max = 20;
            } else {
                max = this.diamond_changeLogList.length;
            }

            for (var i = 0; i < max; i++) {
                if (this.diamond_changeLogList.length > 0) {
                    ItemTemp = this.diamond_changeLogList.shift();

                    saveListTemp.push(ItemTemp);
                }
            }
            if (saveListTemp.length > 0) {
                dao.diamond_changeLog(saveListTemp);
            }

        };

        this.insertScore_change_log = function (list) {
            for (var i = 0; i < list.length; i++) {
                this.score_changeLogList.push(list[i]);
            }
        };

        this.insertMark = function (list) {
            dao.insert_mark(list);
        };


        this.sendMsg = function (_userId, _info, io) {

            io.sockets.emit('sendMsg', {nickname: this.userList[_userId]._nickname, msg: _info.msg});

        };

        this.sendMsgToUser = function (_socket, _info) {

            if (!this.userList[_socket.userId]) {
                _socket.emit("sendMsgToUserResult", {ResultCode: 1, msg: "请先登录"});
                return;
            }

            if (_info.msg.length < 1 || _info.msg.length > 50) {
                _socket.emit("sendMsgToUserResult", {ResultCode: 1, msg: "字数过长或过短"});
                return;
            }

            //找到对方账号
            var isSendEnd = false;
            if (this.userList[_info.userId]) {
                //对方在线
                this.userList[_info.userId]._socket.emit('sendMsg', {
                    userId: _socket.userId,
                    nickname: this.userList[_socket.userId]._nickname,
                    msg: _info.msg
                });
                isSendEnd = true;
            }

            _socket.emit('sendMsgToUserResult', {ResultCode: 0});

            var info = {
                userId: _socket.userId,
                nickname: this.userList[_socket.userId]._nickname,
                toUserId: _info.userId,
                msg: _info.msg,
                isSendEnd: isSendEnd
            };

            //存入数据库
            dao.addcharLog(info, function () {

            });

        };

        this.sendImgToUser = function (_socket, _info) {

            if (!this.userList[_socket.userId]) {
                _socket.emit("sendMsgToUserResult", {ResultCode: 1, msg: "请先登录"});
                return;
            }

            //找到对方账号
            var isSendEnd = false;
            if (this.userList[_info.userId]) {
                //对方在线
                this.userList[_info.userId]._socket.emit('sendImgMsg', {
                    userId: _socket.userId,
                    nickname: this.userList[_socket.userId]._nickname,
                    img: _info.files
                });
                isSendEnd = true;
            }

            _socket.emit('sendImgMsgToUserResult', {ResultCode: 0});

            var info = {
                userId: _socket.userId,
                nickname: this.userList[_socket.userId]._nickname,
                toUserId: _info.userId,
                msg: "",
                isSendEnd: isSendEnd,
                img: _info.files
            };

            //存入数据库
            dao.addcharLog(info, function () {

            });

        };

        this.getMsgToUser = function (_socket) {
            if (!this.userList[_socket.userId]) {
                _socket.emit("getMsgToUserResult", {ResultCode: 1, msg: "请先登录"});
                return;
            }

            dao.getcharLog(_socket.userId, function (Result, row) {
                // console.log(Result);
                if (Result) {

                    for (var i = 0; i < row.length; ++i) {
                        row[i].addDate = makeDate(row[i].addDate);
                    }


                    //console.log(row.addDate)
                    _socket.emit('getMsgToUserResult', {ResultCode: 0, data: {chatList: row}})
                }
            });
        };

        this.sendMsgToUserBySystem = function (_info) {

            if (_info.msg.length < 1 || _info.msg.length > 50) {
                log.info("系统信息字数过长或过短");
                //_socket.emit("sendMsgToUserResult",{ResultCode:1,msg:"字数过长或过短"})
                return;
            }


            //找到对方账号
            var isSendEnd = false;
            if (this.userList[_info.userId]) {
                //对方在线
                this.userList[_info.userId]._socket.emit('sendMsg', {userId: 10, nickname: "VIP客服:", msg: _info.msg});
                isSendEnd = true;
            }

            var info = {userId: 10, toUserId: _info.userId, msg: _info.msg, nickname: "VIP客服", isSendEnd: isSendEnd}

            //存入数据库
            dao.addcharLog(info, function () {

            });

        };


        //获取用户金币数
        this.getUserCoin = function (socket, _info) {
            dao.getUserCoinById(_info.userid, (result, userCoin) => {
                if (result) {
                    let userItem = this.getUser(_info.userid);
                    if (userItem) {
                        //用户在登录服务器
                        console.log("查询用户游戏在线");
                        this.getPlayerScore(_info.userid, (res) => {
                            let data = JSON.parse(res);
                            socket.emit('getPlayerCoinResult', {
                                userCoin: data.data.score,
                                userId: _info.userid,
                                ResultCode: result
                            });
                        });
                    } else {
                        //console.log("查询用户不在线");
                        socket.emit('getPlayerCoinResult', {
                            userCoin: userCoin,
                            userId: _info.userid,
                            ResultCode: result
                        });
                    }
                } else {
                    socket.emit('getPlayerCoinResult', {
                        ResultCode: result,
                        msg: "用户不存在"
                    });
                }
            });
        };
        //查询用户银行密码
        this.getUserBankPwd = function (userid, callback) {
            dao.getBankPwdById(userid, (result, pwd) => {
                if (result) {
                    callback(pwd);
                }
            });
        };
        // 锁住银行
        this.lockBank = function (userId) {
            this.userList[userId].bankLock = 1;
        }

        // 银行是否锁住
        this.isBankLock = function (userId) {
            return this.userList[userId].bankLock;
        }

        //修改用户银行密码
        this.updateUserBankPwd = function (socket, _info) {
            if (!this.userList[socket.userId]) {
                log.info("用户不在线,无法操作");
                socket.emit('updateBankPwdResult', {code: 0, msg: "用户不在线,无法操作"});
                return false;
            }

            if (!_info.newPwd || _info.newPwd.length < 6 || _info.newPwd.length > 30) {
                log.info("密码不能小于6位并不能大于30位");
                socket.emit('updateBankPwdResult', {code: 0, msg: "密码不能小于6位并不能大于30位"});
                return false;
            }

            if (_info.pwd === _info.newPwd) {
                log.info("新密码不能与旧密码一致");
                socket.emit('updateBankPwdResult', {code: 0, msg: "新密码不能与旧密码一致"});
                return false;
            }

            dao.updateBankPwdById(_info.newPwd, socket.userId, (result) => {
                socket.emit('updateBankPwdResult', {code: 1, msg: "修改成功"});
            });
        };

        // 设置银行卡密码
        this.setUserBankPwd = function (socket, data) {
            dao.updateBankPwdById(data.pwd1, socket.userId, (result) => {
                if(result){
                    this.userList[socket.userId].bankPwd = data.pwd1;
                    socket.emit('setBankPwdResult', {code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
                }else{
                    socket.emit('setBankPwdResult', {code: ErrorCode.SUCCESS.code, msg: ErrorCode.ERROR.msg});
                }
            });
        }


        this.sendCoinServer = function (_info, callback) {
            //console.log(_info)
            var id = parseInt(_info.sendUserId);
            var sendCoin = parseInt(_info.sendCoin);
            if (id <= 0) {
                callback({Result: 0, msg: "赠送ID不能小于0"});
                return;
            }

            if (id == 3051) {
                callback({Result: 0, msg: "不能自己赠送自己"});
                return;
            }

            if (sendCoin < 1000) {
                callback({Result: 0, msg: "赠送金币不能小于1000"});
                return;
            }

            var userItem = this.getUser(id);
            if (userItem) {
                callback({Result: 0, msg: "对方在游戏中,赠送失败!"});
                return;
            }

            var myuserItem = this.getUser(3051);
            if (myuserItem) {
                callback({Result: 0, msg: "3051在游戏中,赠送失败!"});
                return;
            }

            //var myNowScore = this.userList[_socket.userId].getScore();

            //先检查对方金额是否够
            dao.sendcoinServer(id, sendCoin, function (Result) {
                if (Result) {
                    callback({Result: 1, msg: "赠送成功"});
                } else {
                    callback({Result: 0, msg: "id:(" + id + ") 金币不足"});
                }
            });

        };

        // 获取活动配置页
        this.getActivityConfigPage = function (socket) {
            ymDao.searchActivityConfigPage(rows =>{
                if(rows){
                    const d = {
                        currTime: new Date().getTime(),
                        rows
                    }
                    socket.emit('activityPageResult', {code:1, data: d});
                }else{
                    socket.emit('activityPageResult', {code:1, data:[]});
                }
            })
        }

        // 新用户获取金币
        this.getNewhandProtectGlod = function (userId, callback) {
            CacheUtil.getNewhandProtectConfig().then(newHandConfig =>{
                if(this.userList[userId].newHandGive === 0){
                    // 更新新手赠送为已领取
                    dao.setNewHandGive(userId, ret=>{
                        if(ret){
                            this.userList[userId].newHandGive = 1;
                            const giveGold = Number(newHandConfig.giveGold);

                            const beforeScore = this.userList[userId]._score;
                            this.userList[userId]._score += giveGold;
                            log.info(userId + '新手领取金币'+ giveGold + '领取前金币' + beforeScore + '领取后金币' + this.userList[userId]._score)
                            // 金币记录
                            dao.scoreChangeLog(userId, beforeScore, giveGold,  this.userList[userId]._score, TypeEnum.ScoreChangeType.newHandGive, 1)
                            callback(giveGold);
                        }else {
                            callback(0);
                        }
                    })
                }else{
                    callback(0);
                }
            });
        }


        this.GameBalance = function (_info) {
            //被赠送id
            var userInfo = {
                userid: _info.sendUserId,
                addgold: _info.sendCoin,
                change_type: _info.change_type,
                adddiamond: _info.diamond
            };
            if (!_info.sendUserId || _info.sendUserId <= 0) {
                log.err(_info.sendUserId + "结算ID不能等于NULL或小于0");
                return;
            }


            // 用户在游戏中
            const userItem = this.getUser(_info.sendUserId);
            if (userItem && userItem.getGameId()) {
                //存到表,下次添加
                var youScore = userItem.getScore();
                var youDiamond = userItem.getDiamond();
                if (_info.sendCoin) {
                    dao.tempAddScore(_info.sendUserId, _info.sendCoin, _info.change_type);
                }
                if (_info.diamond) {
                    log.info("========================", _info.diamond, _info.sendUserId);
                    dao.tempAddDiamond(_info.sendUserId, _info.diamond, _info.change_type);
                }
                return;
            }

            if (userItem) {
                //用户在登录服务器
                log.info("结算,用户在登录服务器");
                var youScore = userItem.getScore();
                if (_info.sendCoin) {
                    userItem.addgold(_info.sendCoin);
                }
                if (_info.diamond) {
                    userItem.adddiamond(_info.diamond);
                }
                var youNowScore = userItem.getScore();
                var youNowDiamond = userItem.getDiamond();

                if (_info.sendCoin) {
                    userItem._socket.emit('sendCoinResult', {Result: 1, score: _info.sendCoin, msg: "赠送成功"});
                }
                if (_info.diamond) {
                    userItem._socket.emit('sendDiamondResult', {Result: 1, score: _info.diamond, msg: "赠送成功"});
                }

                //给别人做争的记录
                var userInfolog = {
                    userid: _info.sendUserId,
                    score_before: youScore,
                    score_change: _info.sendCoin,
                    score_current: youNowScore,
                    change_type: _info.change_type,
                    isOnline: true
                };
                this.score_changeLogList.push(userInfolog);
            } else {
                log.info("用户完全不在线修改分数!");

                if (_info.sendCoin) {
                    dao.AddGold(userInfo, function (result_u) {
                        if (result_u) {
                            log.info("结算成功");
                        } else {
                            //self.userList[_socket.userId].addgold(_info.sendCoin);
                            log.err("结算失败,用户不存在!");
                        }
                    });
                }
                if (_info.diamond) {
                    userInfo.adddiamond = _info.diamond;
                    dao.AddDiamond(userInfo, function (result_u) {
                        if (result_u) {
                            log.info("结算成功");
                        } else {
                            //self.userList[_socket.userId].addgold(_info.sendCoin);
                            log.err("结算失败,用户不存在!");
                        }
                    });
                }
            }
        };

        // 充值
       /* this.Recharge = function (userId, currencyType, amount, callback) {
            // 查询累计充值
            dao.checkTotalCharge(parseInt(userId), (res, data) => {
                if(!amount || amount < 0){
                    callback(0);
                    return;
                }
                try {
                    if (res === 1) {
                        data.totalRecharge += parseInt(amount);
                        const housecard = data.housecard;
                        const scoreFlow = data.score_flow ? data.score_flow: 0;
                        // 增加账户余额
                        this.add_bx_balance(userId, amount, (ret) => {
                            if (!ret) {
                                log.err('add_bx_balance' + ret);
                                callback(0);
                            } else {
                                log.info('充值成功' + userId +'增加货币类型:' + currencyType  + '数量:' + amount);

                                // 计算充值获得VIP积分
                                const rechargeVipScore = data.totalRecharge * (gameConfig.recharge_vip_socre_percentage / 100);
                                const flowVipScore = (scoreFlow / gameConfig.score_amount_ratio) * (gameConfig.flow_vip_socre_percentage / 100);

                                // VIP积分=充值获得积分+消费流水获得积分
                                const vScore = parseInt(rechargeVipScore) + parseInt(flowVipScore);
                                // 计算VIP等级
                                this.getVipLevelByScore(vScore, vipLevel =>{
                                    // 更新VIP积分
                                    this.userList[userId].vip_score = vScore;
                                    this.updateVipScore(userId, vScore);

                                    // VIP升级
                                    this.vipUpgrade(userId, vipLevel, housecard);
                                    // 更新下级充值返点
                                    this.juniorRecharge(userId, currencyType, amount);
                                    // 修改累计充值
                                    this.updateTotalCharge(userId, data.totalRecharge, amount);
                                    callback(1);
                                });
                            }
                        });

                    } else {
                        callback(0);
                    }
                }catch (e) {
                    log.err(e);
                    callback(0);
                }
            });
        }*/

        // VIP升级
        this.vipUpgrade = function (userId, vipLevel, housecard) {
            // VIP升级
            if (vipLevel > housecard) {
                if(this.userList[userId]) this.userList[userId].vip_level = vipLevel;
                if(this.userList[userId]) this.userList[userId].is_vip = 1;
                // 更新VIP等级
                this.updateVipLevel(userId, vipLevel, callback =>{
                    if(callback){
                        const _nickname = this.userList[userId] ? this.userList[userId]._nickname : userId;
                        const noticeMsg = [{
                            type: TypeEnum.notifyType.vipUpgrade,
                            content_id: "c2001",
                            extend: {
                                currVipLevel: vipLevel,
                                oldVipLevel: housecard,
                                userId: userId,
                                nickName: _nickname
                            }
                        }]
                        // 发送VIP升级通知
                        this.sendAllNotifyMsg(noticeMsg);
                        // VIP升级奖励
                        this.popUpgradeGiveGlod(userId, housecard, vipLevel);
                        // 推首充
                        CommonEvent.pushFirstRecharge(this.userList[userId]._socket);
                    }
                });
            }

        }


        // 弹VIP升级奖励
        this.popUpgradeGiveGlod = function (userId, housecard, vipLevel) {
            CacheUtil.getVipConfig().then(config =>{
                const upgradeGiveGlod = config.find(it => it.level === vipLevel).upgradeGiveGlod;
                const data = {
                    goodsType: TypeEnum.GoodsType.gold,
                    val: upgradeGiveGlod,
                    currvipLevel: vipLevel,
                    oldVipLevel: housecard
                }
                if(this.userList[userId]){
                    this.userList[userId]._socket.emit('vipUpgrade', {code : 1, data: data});
                }
            })
        }

        // 推广活动-下级成员充值
        this.juniorRecharge = function (userId, currencyType, currencyVal, score_amount_ratio) {
            // 查询上级代理
            ymDao.searchInviteUser(userId, row =>{
                if(row){
                    // 存在上级代理
                    const inviteUid = row.invite_uid;
                    CacheUtil.getDownloadExtConfig().then(downloadExtConfig =>{
                        // 金币增加比例
                        const addRatio = downloadExtConfig.reward_agent / 100;
                        const rebateGlod = parseInt(score_amount_ratio * currencyVal * addRatio);
                        // 返点记录（待领取）
                        log.info(userId + '充值类型'+ currencyType + '货币数量' + currencyVal +'代理人'+ inviteUid +'获得奖励'+ rebateGlod);
                        ymDao.agentRebateRecord(inviteUid, userId, currencyType, currencyVal, rebateGlod, TypeEnum.AgentRebateType.recharge, TypeEnum.AgentRebateStatus.unissued, r =>{})
                    });
                }
            })
        }

        // 更新VIP等级
        this.updateVipLevel = function (userId, vipLevel, callback) {
            dao.updateVipLevel(userId, vipLevel, callback);
        }

        // 通过VIP积分获取VIP等级
        this.getVipLevelByScore = function (vScore, callback) {
            try{
                CacheUtil.getVipConfig().then(vipConfig =>{
                    let l = 0;
                    for(let i = 0; i < vipConfig.length; i++){
                        const config = vipConfig[i];
                        const currVipScore = config.vipScore;
                        if(vScore >= currVipScore){
                            l = config.level;
                        }
                    }
                    console.log('VIP等级' + l);
                    callback(l)
                });
            }catch (e){
                log.err(e)
                callback(0)
            }
        }


        // 获取银行积分 用户金币
        this.getBankScore = function (socket) {
            const result = {
                bankScore: this.userList[socket.userId].bankScore,
                gold: this.userList[socket.userId]._score
            }
            socket.emit('getBankScoreResult', {code:0, data: result });
        }

        // 银行取出金币到大厅
        this.bankIntoHallGold = function (socket, gold, callback) {

            const bankScore = gold;
            if(!bankScore || isNaN(bankScore) || bankScore < 0){
                callback(0, "输入有误")
                return;
            }
            // 账户余额不足
            const currBankScore = this.userList[socket.userId].bankScore;
            if(currBankScore < bankScore){
                callback(0, "账户余额不足")
                return;
            }

            this.userList[socket.userId].bankScore = this.userList[socket.userId].bankScore - bankScore;
            this.userList[socket.userId]._score =  this.userList[socket.userId]._score + parseInt(gold);

            // 记录入库
            const result = {
                bankScore: this.userList[socket.userId].bankScore,
                gold: this.userList[socket.userId]._score
            }
            callback(1, ErrorCode.SUCCESS.msg ,result)
        }

        // 银行转入金币
        this.hallGoldIntoBank = function (socket, gold, callback) {
            if(!gold || isNaN(gold) || gold < 0){
                callback(0, '输入有误')
                return;
            }
            // 账户余额不足
            const currGold = this.userList[socket.userId]._score;
            if(currGold < gold){
                callback(0, '账户余额不足')
                return;
            }

            const addBankScore = Number(gold);
            this.userList[socket.userId]._score =  this.userList[socket.userId]._score - Number(gold);
            this.userList[socket.userId].bankScore =  this.userList[socket.userId].bankScore + addBankScore;

            const result = {
                bankScore: this.userList[socket.userId].bankScore,
                gold: this.userList[socket.userId]._score
            }
            callback(1, ErrorCode.SUCCESS.msg, result)
        }

        // 转账
        this.bankTransferOtherBank = function (socket, giveUserId ,bankScore, callback) {

            CacheUtil.getBankTransferConfig().then(bankTransferConfig =>{
                // 最低取出
                const gold_transfer_min = bankTransferConfig.gold_transfer_min;
                // 转账等级
                const transfer_vipLv = bankTransferConfig.transfer_vipLv;
                if(!gold_transfer_min || !transfer_vipLv){
                    return;
                }
                // 金币最低转账
                if(bankScore < gold_transfer_min){
                    callback(0, "失败!最低存入数量" + gold_transfer_min);
                    return;
                }
                const vipLevel = this.userList[socket.userId].vip_level;
                // 判断VIP是否达到转账要求
                if(vipLevel < transfer_vipLv){
                    callback(0, "VIP等级不足!最低等级" + transfer_vipLv );
                    return;
                }
                // 账户余额不足
                const currBankScore = this.userList[socket.userId].bankScore;
                if(currBankScore < bankScore){
                    callback(0, "账户余额不足");
                    return;
                }

                dao.BankTransfer(socket.userId, giveUserId, bankScore, 3, row =>{
                    if(row && row.rcode > 0){
                        // 赠送账户减少银行积分
                        this.userList[socket.userId].bankScore -= bankScore;
                        // 如果被赠送用户在线
                        if(this.userList[giveUserId]){
                            this.userList[giveUserId].bankScore += bankScore;
                        }
                        // 消息通知
                        this.transferMsgNotify(giveUserId, socket.userId, row.logTransferId);

                        const result = {
                            bankScore: this.userList[socket.userId].bankScore,
                            gold: this.userList[socket.userId]._score
                        }
                        callback(1, ErrorCode.SUCCESS.msg, result);
                    }else{
                        callback(0, "转账失败");
                    }
                });
            });
        }

        // 转账消息通知
        this.transferMsgNotify = function (giveUserId, userId, logTransferId) {
            const noticeMsg = [{
                type: TypeEnum.notifyType.bankTransfer,
                content_id: "c2002",
                extend:{
                    formUserId: userId,
                    toUserId: giveUserId,
                    formUserNickName: this.userList[userId]._nickname
                }
            }]
            // 跑马灯通知
            this.sendNotifyMsg(userId, noticeMsg);
            // 邮件通知 logTransferId(转账记录ID)
            this.saveEmail(LanguageItem.bank_transfer_title, TypeEnum.EmailType.transfer_inform, giveUserId, userId, LanguageItem.bank_transfer_content, logTransferId, TypeEnum.GoodsType.gold)
        }


        // 邮件通知
        this.saveEmail = function (title, type, to_userid, from_userid, content_id, otherId, goods_type) {
            dao.saveEmail(title, type, to_userid, from_userid, content_id, otherId, goods_type);
        }

        // 通过VIP等级获取VIP配置表
        this.getVipConfigByLevel = function (vipConfig , level) {
            try{
                let c;
                for(let i = 0; i < vipConfig.length; i++){
                    const config = vipConfig[i];
                    const l = config.level;
                    if(level >= l){
                        c = config;
                    }
                }
                console.log('VIP配置表'+ c);
                return c;
            }catch (e){
                log.err(e)
                return null
            }
        }

        // 查询银行转入记录
        this.searchBankTransferIntoRecord = function (socket) {
            dao.searchBankTransferIntoRecord(socket.userId, (res, rows) => {
                let data = []
                if(res){
                    rows.forEach(item =>{
                        const row = {
                            id: item.id,
                            nickname: item.nickname,
                            headimgurl: item.headimgurl,
                            userId: item.from_userid,
                            bankScore: item.transfer_bank_score,
                            transferTime: item.transfer_time
                        }
                        data.push(row);
                    })
                }
                socket.emit('bankTransferIntoRecordResult', {code:1,data: data});
            });
        }

        // 查询银行转出记录
        this.searchBankTransferOutRecord = function (socket) {
            dao.searchBankTransferOutRecord(socket.userId, (res, rows) => {
                let data = []
                if(res){
                    rows.forEach(item =>{
                        const row = {
                            id: item.id,
                            nickname: item.nickname,
                            userId: item.to_userid,
                            headimgurl: item.headimgurl,
                            bankScore: item.transfer_bank_score,
                            transferTime: item.transfer_time
                        }
                        data.push(row);
                    })
                }
                socket.emit('bankTransferOutRecordResult', {code:1,data: data});
            });
        }

        // 获取提现页信息
        this.getWithdrawPage = function (userId, callback) {
            try {
                dao.searchWithdrawLimit(userId, (code, row) => {
                    if(!code){
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                        return;
                    }
                    dao.getBank(userId, (code, rows) =>{
                        if(!code){
                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            return;
                        }
                        let cards = []
                        if(rows.length > 0){
                            cards = rows.map(it => {
                                return {
                                    withdrawChannel: it.bankType,
                                    num: it.account
                                }
                            })
                        }
                        const withdrawLimit = row.withdrawLimit ? row.withdrawLimit : 0;
                        CacheUtil.getBankTransferConfig().then(config => {
                            const withdrawWard = config.withdrawWard;
                            const withdrawChannel = config.withdrawChannel;
                            const data ={
                                withdrawLimit: withdrawLimit,
                                currencyType: "BRL",
                                withdrawWard: withdrawWard,
                                withdrawChannel: withdrawChannel,
                                cards: cards
                            }
                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                        })
                    })
                })
            }catch (e){
                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
            }
        }
        
        // 提现申请
        this.withdrawApply = function (userId, pwd, amount, account, currencyType,  callback) {
            CacheUtil.getServerUrlConfig().then(config => {
                try{
                    const hallUrl = config.hallUrl ? config.hallUrl : '';
                    dao.getBank(userId, (code, cards) =>{
                        if(!code || cards.length === 0){
                            callback(ErrorCode.FAILED.code, '卡号信息错误')
                            return;
                        }
                        const card = cards[0];
                        const bankType =  card.bankType;
                        const name =  card.name;
                        const cpf =  card.cpf;

                        CacheUtil.getBankTransferConfig().then(config =>{
                            const withdrawVipLevel = config.withdraw_vipLv;
                            const withdrawProportion = config.withdraw_proportion;
                            // 判断是否有提现权限
                            if(this.userList[userId].vip_level < withdrawVipLevel){
                                callback(ErrorCode.FAILED.code, 'VIP等级不够')
                                return;
                            }
                            // 判断金额是否正确
                            dao.searchUserMoney(userId, (row) =>{
                                if(row){
                                    const bankScore = row.bankScore;
                                    const withdrawLimit = row.withdrawLimit;

                                    const currAmount= Number(bankScore / withdrawProportion);
                                    if(currAmount < amount){
                                        callback(ErrorCode.FAILED.code, '金额不足')
                                        return;
                                    }
                                    if(amount > withdrawLimit){
                                        callback(ErrorCode.FAILED.code, '超出提现额度')
                                        return;
                                    }

                                    // 校验银行密码
                                    dao.getBankPwdById(userId, (code, bankPwd) =>{
                                        if(code && bankPwd && Number(bankPwd) === Number(pwd)){
                                            // 锁定银行积分
                                            const lockBankScore = amount * withdrawProportion;
                                            dao.lockBankScore(userId, lockBankScore, ret =>{
                                                this.userList[userId].bankScore -= lockBankScore;
                                                if(ret){
                                                    const orderId = StringUtil.generateOrderId();
                                                    const callbackUrl = hallUrl + '/withdrawCallBack?userId=' + userId+'&orderId=' + orderId;
                                                    // 生成提现订单
                                                    dao.withdrawApplyRecord(userId, amount, account, bankType, name,cpf,  callbackUrl, orderId, lockBankScore, currencyType, ret =>{
                                                        if(ret){
                                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                                                        }else{
                                                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                        }
                                                    })
                                                }else{
                                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                }
                                            });

                                        }else{
                                            callback(ErrorCode.FAILED.code, '密码错误')
                                        }
                                    })
                                }
                            });
                        })
                    })
                }catch (e){
                    log.err(e)
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        // 查询提现记录
        this.withdrawRecord = function (userId, callback) {
            dao.searchWithdrawApplyRecord(userId, (code, rows) =>{
                if(code){
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, rows)
                }else {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        // 更新VIP积分
        this.updateVipScore = function (userId, vipScore) {
            dao.updateVipScore(userId, vipScore, (res) => {
                if(!res){
                    log.warn('dao.updateVipScore' + res);
                }else{
                    log.info('更新VIP积分:' + vipScore);
                }
            });
        }

        // 更新提现额度
        this.updateWithdrawLimit = function (userId, amount, vipLevel, type, callback) {
            CacheUtil.getVipConfig().then(config =>{
                try{
                    const withdrawRatio =  config.find(it => it.level === vipLevel).withdraw_ratio;
                    const withdrawLimit = Math.floor(StringUtil.rideNumbers(amount , withdrawRatio / 100));
                    log.info(userId + '充值:'+ amount + '增加提现额度' + withdrawLimit + 'vipLevel:' + vipLevel + 'withdrawRatio:' + withdrawRatio)
                    if(type === "add"){
                        dao.addWithdrawLimit(userId, withdrawLimit, callback);
                    }else if(type === "reduce"){
                        dao.reduceWithdrawLimit(userId, withdrawLimit, callback);
                    }
                }catch (e){
                    log.err('更新提现额度' + e)
                }
            })
        }

        // 修改累计充值
        this.addTotalCharge = function (userId, amount, vipLevel) {
            this.updateWithdrawLimit(userId, amount, vipLevel,"add", ret =>{
                dao.updateTotalCharge(userId, amount, (res) => {
                    if(!res){
                        log.err(userId + '修改累计充值:' + amount + 'res:' + res);
                    }
                });
            })
        }

        this.GameBalanceSub = function (_info, callback) {
            //被赠送id
            var userInfo = {
                userid: _info.sendUserId,
                addgold: _info.sendCoin,
                change_type: _info.change_type,
                diamond: _info.diamond
            };
            if (!_info.sendUserId || _info.sendUserId <= 0) {
                log.err(_info.sendUserId + "结算ID不能等于NULL或小于0");
                //console.log("结算ID不能等于NULL或小于0");
                callback('{"status":1,"msg":"结算ID不能等于NULL或小于0"}');
                return;
            }

            log.info("用户" + _info.sendUserId + "结算");

            var userItem = this.getUser(_info.sendUserId);
            if (userItem && userItem.getGameId()) {
                //存到表,下次添加
                log.info("玩家在游戏中,扣分失败");
                // log.info(_info);
                var youScore = userItem.getScore();
                var youDiamond = userItem.getDiamond();
                if (_info.sendCoin) {
                    dao.tempAddScore(_info.sendUserId, _info.sendCoin, _info.change_type);
                }
                if (_info.diamond) {
                    // log.info("===============================================扣钻石",_info);
                    dao.tempAddDiamond(_info.sendUserId, _info.diamond, _info.change_type);
                }

                callback('{"status":2,"msg":"玩家在游戏中,扣分失败"}');
                return;
            }

            if (userItem) {
                //用户在登录服务器
                log.info("结算,用户在登录服务器");
                var youScore = userItem.getScore();
                var youDiamond = userItem.getDiamond();

                var choice_type = 0
                if (_info.sendCoin) {
                    choice_type = 1
                } else if (_info.diamond) {
                    choice_type = 2
                }

                if (youScore >= Math.abs(_info.sendCoin) && _info.sendCoin && choice_type == 1) {
                    userItem.addgold(_info.sendCoin);
                    var youNowScore = userItem.getScore();

                    userItem._socket.emit('sendCoinResult', {Result: 1, score: _info.sendCoin, msg: "扣分成功"});
                    //给别人做争的记录
                    var userInfolog = {
                        userid: _info.sendUserId,
                        score_before: youScore,
                        score_change: _info.sendCoin,
                        score_current: youNowScore,
                        change_type: _info.change_type,
                        isOnline: true
                    };
                    this.score_changeLogList.push(userInfolog);

                    callback('{"status":0,"msg":"扣分成功"}');
                    return;
                } else if (choice_type == 1) {
                    callback('{"status":3,"msg":"分数不足,扣分失败"}');
                    return;
                }
                if (youDiamond >= Math.abs(_info.diamond) && _info.diamond && choice_type == 2) {
                    userItem.adddiamond(_info.diamond);
                    var youNowScore = userItem.getScore();
                    var youNowDiamond = userItem.getDiamond();
                    console.log(_info.sendUserId)
                    console.log(youNowDiamond)
                    console.log(_info.diamond)
                    // userItem.adddiamond(_info.diamond)

                    userItem._socket.emit('sendDiamondResult', {Result: 1, score: _info.diamond, msg: "扣分成功"});
                    // //给别人做争的记录
                    // var userInfolog = {
                    //     userid: _info.sendUserId,
                    //     score_before: youScore,
                    //     score_change: _info.sendCoin,
                    //     score_current: youNowScore,
                    //     change_type: _info.change_type,
                    //     isOnline: true
                    // };
                    // this.score_changeLogList.push(userInfolog);

                    callback('{"status":0,"msg":"扣分成功"}');
                    return;
                } else {
                    callback('{"status":3,"msg":"分数不足,扣分失败"}');
                    return;
                }

            } else {
                log.info("用户完全不在线修扣分!");
                if (_info.sendCoin) {
                    dao.AddGoldSub(userInfo, function (result_u) {
                        if (result_u) {
                            log.info("扣分成功");
                            callback('{"status":0,"msg":"扣分成功"}');
                            return;
                        } else {
                            //self.userList[_socket.userId].addgold(_info.sendCoin);
                            log.err("扣分失败!");
                            callback('{"status":3,"msg":"分数不足,扣分失败"}');
                            return;
                        }
                    });
                }
                if (_info.diamond) {
                    dao.AddDiamondSub(userInfo, function (result_u) {
                        if (result_u) {
                            log.info("扣分成功");
                            callback('{"status":0,"msg":"扣分成功"}');
                            return;
                        } else {
                            //self.userList[_socket.userId].addgold(_info.sendCoin);
                            log.err("扣分失败!");
                            callback('{"status":3,"msg":"分数不足,扣分失败"}');
                            return;
                        }
                    });
                }

            }
        };

        //查询金币记录2
        this.getCoinLog = function (_socket, _info) {
            dao.selectcoinlog(_info.userid, (code, res) => {
                if (code) {
                    _socket.emit('getCoinLogResult', {Result: 1, data: res});
                } else {
                    console.log("selectCoinLog失败");
                    _socket.emit('getCoinLogResult', {Result: 0, msg: "未查到该用户相关记录"});
                }
            });
        };

        //断线通知
        this.lineOutSet = function (_info) {
            // 登录游戏成功  移除大厅内用户
            if(_info.userId){
                log.info('登录游戏'+ _info.gameId +' 成功 移除大厅内用户' + _info.userId)
                delete this.userList[_info.userId];
            }
            if (_info.state === 1) {
                this.lineOutList[_info.userId] = {
                    gameId: _info.gameId,
                    serverId: _info.serverId,
                    tableId: _info.tableId,
                    seatId: _info.seatId,
                    tableKey: _info.tableKey
                }
                // dao.saveLineOut(_info.userId)
                console.log(this.lineOutList[_info.userId]);
            } else {
                delete this.lineOutList[_info.userId];
            }
        };

        this.getLineOutMsg = function (_userId) {
            if (this.lineOutList[_userId]) {
                this.lineOutList[_userId].Result = 1;
                return this.lineOutList[_userId];
            } else {
                return {Result: 0};
            }
        };


        this.checkData = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.info("用户不在线,无法操作");
                _socket.emit('changeOfficialResult', {ResultCode: 1, msg: "用户不在线,无法操作"});
                return false;
            }

            if (!_info.newAccount || _info.newAccount.length < 4 || _info.newAccount.length > 30) {
                log.info("用户名不能小于4位并不能大于30位");
                _socket.emit('changeOfficialResult', {ResultCode: 2, msg: "用户名不能小于4位并不能大于30位"});
                return false;
            }

            var pattern = new RegExp("^[A-Za-z0-9]+$");
            if (!pattern.test(_info.newAccount)) {
                log.info("账号不能有特殊符号");
                _socket.emit('changeOfficialResult', {ResultCode: 5, msg: "账号不能有特殊符号"});
                //sendStr = '{"status":8,"msg":"账号不能有特殊符号!"}'
                return false;
            }

            if (!_info.password || _info.password.length < 6 || _info.password.length > 30) {
                log.info("密码不能小于6位并不能大于30位");
                _socket.emit('changeOfficialResult', {ResultCode: 3, msg: "密码不能小于6位并不能大于30位"});
                return false;
            }

            if (this.userList[_socket.userId]._official) {
                log.info("用户已经转正,无法再次转正");
                _socket.emit('changeOfficialResult', {ResultCode: 4, msg: "用户已经转正,无法再次转正"});
                return false;
            }

            return true;
        };



        this.checkDataPassword = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.info("用户不在线,无法操作");
                _socket.emit('updatePasswordResult', {ResultCode: 1, msg: "用户不在线,无法操作"});
                return false;
            }

            if (!_info.password || _info.password.length < 6 || _info.password.length > 30) {
                log.info("密码不能小于6位并不能大于30位");
                _socket.emit('updatePasswordResult', {ResultCode: 2, msg: "密码不能小于6位并不能大于30位"});
                return false;
            }

            if (!_info.oldPassword || _info.oldPassword.length < 6 || _info.oldPassword.length > 30) {
                log.info("旧密码不能小于6位并不能大于30位");
                _socket.emit('updatePasswordResult', {ResultCode: 3, msg: "旧密码不能小于6位并不能大于30位"});
                return false;
            }

            if (_info.password == _info.oldPassword) {
                log.info("新密码不能与旧密码一致");
                _socket.emit('updatePasswordResult', {ResultCode: 4, msg: "新密码不能与旧密码一致"});
                return false;
            }

            //是否已经转正
            if (!this.userList[_socket.userId]._official) {
                log.info("先转正后,再改密码");
                _socket.emit('updatePasswordResult', {ResultCode: 5, msg: "先转正后,再改密码"});
                return false;
            }

            if (_info.oldPassword != this.userList[_socket.userId]._p) {
                console.log(this.userList[_socket.userId]._p);
                log.info("旧密码不正确");
                _socket.emit('updatePasswordResult', {ResultCode: 6, msg: "旧密码不正确"});
                return false;
            }

            return true;
        };

        this.updatePassword = function (_socket, _info) {
            var key = "89b5b987124d2ec3";
            var content = this.userList[_socket.userId]._account + _info.password + key;
            var md5 = crypto.createHash('md5');
            md5.update(content);

            var info = {accountname: this.userList[_socket.userId]._account, pwd: md5.digest('hex'), p: _info.password}
            var self = this;

            dao.SetPassword(info, function (result) {
                if (result) {
                    if (self.userList[_socket.userId]) {
                        self.userList[_socket.userId]._p = _info.password;
                        //self.userList[_socket.userId]._password = info.pwd;
                    }
                    _socket.emit('updatePasswordResult', {ResultCode: 0, msg: "密码修改成功", data: {ps: _info.password}});
                    //_socket.emit('updatePasswordResult',{ResultCode:0,msg:"密码修改成功",data:{ps:_info.password}});
                } else {
                    _socket.emit('updatePasswordResult', {ResultCode: 5, msg: "数据库操作失败"});
                }
            })
        };




        this.updateScoreOut = function (out_trade_no, flag, remark, callback) {
            var self = this;
            dao.updateScoreOut(out_trade_no, flag, remark, function (result, row) {
                if (!result && flag == 1) {
                    console.log(row)
                    var info = {userId: row.userId, msg: '你的兑换已经处理完毕,请查看银行卡或支付宝账单,处理时间(' + makeDate(row.outDate) + ')'}
                    self.sendMsgToUserBySystem(info);
                }
                callback(result);
            })

            //你的兑换已经处理完毕,请查看支付宝账单,处理时间(2017-06-22 13:43)

        };

        this.updateCharLog = function (_socket, idList, callback) {
            if (!this.userList[_socket.userId]) {
                log.info("用户不在线,无法操作");
                _socket.emit('updateCharLogResult', {ResultCode: 1, msg: "用户不在线,无法操作"});
                return false;
            }
            log.info(idList);
            if (!idList || idList.length <= 0) {
                _socket.emit('updateCharLogResult', {ResultCode: 2, msg: "更新ID为空"});
                return;
            }
            dao.updateCharLog(_socket.userId, idList, function (result, row) {
                if (result) {
                    _socket.emit('updateCharLogResult', {ResultCode: 0, msg: "更新成功"});
                } else {
                    _socket.emit('updateCharLogResult', {ResultCode: 3, msg: "更新失败"});
                }
            })
        };


        //proTypeId,addProCount,userId,roomid,typeid
        this.pro_change = function (_info) {
            console.log(_info)
            if (!this.userList[_info.userId]) {
                log.err("用户不存在,无法操作");
                return;
            }

            //需要判断道具是否存在;
            if (!this.userList[_info.userId]._proList[_info.proTypeId]) {
                this.userList[_info.userId]._proList[_info.proTypeId] = 0;
            }

            if (this.userList[_info.userId]._proList[_info.proTypeId] + _info.addProCount < 0) {
                log.err("道具不足,无法操作");
                return;
            }


            this.userList[_info.userId]._proList[_info.proTypeId] += _info.addProCount;
            var info = {
                userId: _info.userId,
                propId: _info.proTypeId,
                propCount: _info.addProCount,
                roomid: _info.roomid,
                typeid: _info.typeid
            }
            dao.updateProp(info, function (result) {
            });
        }

        //发送信息给GM
        this.sendMsgToGM = function (_socket, _info) {
            redis_send_and_listen.send_msg("sendMsgToGM", {
                user_id: _socket.userId,
                user_name: this.userList[_socket.userId]._nickname,
                msg: _info.msg,
                gm_id: _info.gm_id,
            });
            var gm_socket = this.gm_socket[_info.gm_id];
            if (gm_socket) {
                gm_socket.emit('sendMsgToGM', {
                    user_id: _socket.userId,
                    user_name: this.userList[_socket.userId]._nickname,
                    msg: _info.msg,
                    gm_id: _info.gm_id,
                });
            }
            _socket.emit('sendMsgToGMResult');
        };

        //运行初始化
        this.init();
    };


    if (_gameinfo) {
        return {getInstand: _gameinfo}
    } else {
        console.log("####create game!####");
        _gameinfo = new Game();
        return {getInstand: _gameinfo}
    }

}();
function makeDate(date) {

    try {

        var newDate = new Date(date);
        //在小于10的月份前补0
        var month = eval(newDate.getMonth() + 1) < 10 ? '0' + eval(newDate.getMonth() + 1) : eval(newDate.getMonth() + 1);
        //在小于10的日期前补0
        var day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
        //在小于10的小时前补0
        var hours = newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
        //在小于10的分钟前补0
        var minutes = newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes();
        //在小于10的秒数前补0
        var seconds = newDate.getSeconds() < 10 ? '0' + newDate.getSeconds() : newDate.getSeconds();
        //拼接时间
        var stringDate = newDate.getFullYear() + '-' + month + '-' + day + " " + hours + ":" + minutes + ":" + seconds;
    } catch (e) {
        var stringDate = "0000-00-00 00:00:00";
    } finally {
        return stringDate;
    }

}
const emailValidator = (email) => {
    // 正则表达式用于验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // 使用正则表达式测试邮箱格式
    return emailRegex.test(email);
};

module.exports = GameInfo;


//监听gm发送来的消息
redis_send_and_listen.redis_client.on("message", function (channel, msg) {
    console.log("------------------------------server接收到信息了");
    console.log("channel" + channel);
    console.log("message" + msg);
    const message = JSON.parse(msg);
    if (channel == "GMsendMsgToUser") {
        var _userList = GameInfo.getInstand.userList;
        if (_userList[message.user_id]) {
            var send_socket = _userList[message.user_id]._socket;
            send_socket.emit("GMsendMsg", {gm_id: message.gm_id, msg: message.msg})
        }
    }
});
