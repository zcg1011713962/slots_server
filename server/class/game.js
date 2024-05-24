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
const LABA = require("../../util/laba");
const CacheUtil = require("../../util/cache_util");
const LanguageItem = require("../../util/enum/language");
const TypeEnum = require("../../util/enum/type");
const HashCodeUtil = require("../../util/hashcode_util");
const PayAPI = require('../class/pay_api');
const CommonEvent = require('../../util/event_util');
const EnumType = require("../../util/enum/type");
const dot = require("../../util/dot");
const http_bc = require("../../util/http_broadcast");

var GameInfo = function () {
    var _gameinfo = "";
    const Game = function () {
        //初始化游戏
        this.init = function () {
            //初始化用户列表
            this.userList = {};
            //统计
            this.winTotal = 0;
            //维护模式
            this.maintain = false;

            this.gameRank = {};
            // 离线的用户
            this.tempuserList = {};

            this.score_changeLogList = [];

            this.diamond_changeLogList = [];

            this.lineOutList = {};
            var self = this;
            dao.selectServerLog(function (Result, rows) {
                if (Result) {
                    self.server_log_list = rows
                }
            });

            this._io = {};

            this.gm_socket = {};   //gm登录socket

            this.test = false;

            log.info('初始化用户库存 系统库存 奖池')
            redis_laba_win_pool.redis_win_pool_init();
            CacheUtil.initSysBalanceGold();
            CacheUtil.initGamblingBalanceGold();

            const rule = new schedule.RecurrenceRule();
            const times = [];
            for (var i = 0; i < 60; i++) {
                times.push(i);
            }
            rule.second = times;
            var self = this;
            self.initCommonCache();
            schedule.scheduleJob(rule, function () {
                if (self.maintain) {
                    self.disconnectAllUser();
                }
                const nowDate = new Date();
                const second = nowDate.getSeconds();
                self.game_second = second;
                if (second === 2) {
                    // 奖池推送
                    CacheUtil.pushGameJackpot(self.userList);
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

        // 添加用户
        this.addUser = function (userInfo, socket, callback_a) {
            const newDate = new Date();
            const key = "slezz;e3";
            const md5 = crypto.createHash('md5');
            const content = userInfo.Id + userInfo.score + newDate + key;
            userInfo.sign = md5.digest('hex');

            //在没有添加用户之前找到道具列表
            userInfo.propList = {};

            const self = this;
            async.waterfall([
                function (callback) {
                    const userId = userInfo.Id;
                    // 把重连的socket打印日志
                    if (self.userList[userId]) {
                        if (self.userList[userId]._socket) {
                            log.info(userId + '用户已存在:旧socket' + self.userList[userId]._socket.id + '新socket:' + socket.id)
                        } else {
                            log.info(userId + '用户已存在:旧socket为空' + '新socket:' + socket.id)
                        }
                    }

                    log.info("添加用户:" + userId);
                    // 用户信息
                    CacheUtil.setUserInfo(userId, userInfo)
                    self.userList[userId] = new User(userInfo, socket);
                    // 获取用户幸运币配置
                    CacheUtil.getActivityLuckyDetailByUserId(socket.userId, luckyDetail => {
                        let luckObject = {
                            luckyCoin: 0,
                            luckyRushStartTime: 0,
                            luckyRushEndTime: 0,
                            luckyCoinGetStatus: 0,
                            luckyCoinTaskGetStatus: 0,
                            currCoinCount: 0
                        }
                        if (luckyDetail) {
                            log.info(userId + '获取用户幸运币配置' + JSON.stringify(luckyDetail))
                            luckObject.luckyCoin = luckyDetail.luckyCoin;
                            luckObject.luckyRushStartTime = luckyDetail.luckyRushStartTime;
                            luckObject.luckyRushEndTime = luckyDetail.luckyRushEndTime;
                            luckObject.luckyCoinGetStatus = luckyDetail.luckyCoinGetStatus;
                            luckObject.currCoinCount = luckyDetail.currCoinCount;
                            luckObject.luckyCoinTaskGetStatus = luckyDetail.luckyCoinTaskGetStatus;
                        }
                        // 获取新手弹窗
                        CacheUtil.getNewHandGuideFlowKey(userId, self.userList[userId].firstRecharge, (newHandGuideFlowItem) => {
                            log.info(userId + '获取新手指引弹窗顺序:' + JSON.stringify(newHandGuideFlowItem))
                            self.loginUserInfo(userId, luckObject, loginUser => {
                                loginUser.newHandGuideFlowItem = newHandGuideFlowItem; // 新手弹窗流程
                                callback(null, {
                                    code: ErrorCode.LOGIN_SUCCESS.code,
                                    msg: ErrorCode.LOGIN_SUCCESS.msg,
                                    Obj: loginUser
                                });
                            });
                        });
                    });
                },
                function (result, callback) {
                    dao.getScore(userInfo.Id, function (Result, rows) {
                        if (Result) {
                            result.Obj.score = StringUtil.toFixed(rows.score, 2);
                            result.Obj.diamond = parseInt(rows.diamond);
                            log.info(userInfo.Id + "登录获取金币:" + rows.score + '获取钻石:' + rows.diamond);
                            callback(null, result);
                        }
                    })
                },
                function (result, callback) {
                    // 登录成功返回结果
                    const login_token_key = 'login_token_key:';
                    CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) => {
                        // 生成新token返回
                        StringUtil.generateUniqueToken().then(token => {
                            RedisUtil.set(login_token_key + token, userInfo.Id).then(ret1 => {
                                const expire = 7 * 24 * 60 * 60;
                                RedisUtil.expire(login_token_key + token, expire).then(ret2 => {
                                    if (ret1 && ret2) {
                                        result.Obj.token = token;
                                        result.win_pool = gameJackpot;
                                        self.dot(userInfo.Id, null, null, null, null, null , TypeEnum.DotNameEnum.total_login_success, ret =>{
                                            if(ret){
                                                log.info(userInfo.Id + '登录大厅成功，打点成功')
                                            }else{
                                                log.info(userInfo.Id + '登录大厅成功，打点失败')
                                            }
                                        })
                                        log.info(userInfo.Id + '登录大厅结果' + JSON.stringify(result));
                                        socket.emit('loginResult', result);
                                        callback(null, result);
                                    }
                                });
                            });
                        })
                    })
                }
            ], function (err, result) {
                const userId = userInfo.Id;
                try {
                    if (self.userList[userId]) {
                        self.userList[userId].loginEnd = true;
                    }
                    if (err) {
                        log.err(userId + '登录出错err:' + err + 'result:' + result)
                        callback_a(0);
                    } else {
                        socket.emit('ServerListResult', {GameInfo: ServerInfo.getServerAll()});
                        const linemsg = self.getLineOutMsg(userId);

                        if (linemsg.Result && linemsg.tableId !== -1 && linemsg.seatId !== -1) {
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
                                log.info(userId + 'VIP等级:' + userInfo.housecard + '进入大厅')
                                self.vipEnterHall(userInfo);
                            }
                            log.info("大厅在线人数:" + self.getOnlinePlayerCount());
                            callback_a(1);
                        });
                    }
                } catch (e) {
                    log.err(userId + '登录错误' + e)
                    callback_a(0);
                }
            });
        };

        this.vipEnterHall = function (userInfo) {
            const noticeMsg = [{
                type: TypeEnum.notifyType.vipEnterHall,
                content_id: ErrorCode.VIP_ENTER_HALL_NOTIFY.code,
                extend: {
                    vipLevel: userInfo.housecard,
                    nickName: userInfo.nickname,
                    userId: userInfo.Id
                }
            }]
            http_bc.sendNoticeMsg(noticeMsg)
        }

        //获得在线人数
        this.getOnlinePlayerCount = function () {
            return Object.keys(this.userList).length;
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
        }

        //删除用户
        this.deleteUser = function (_userinfo) {
            if (_userinfo.userId) {
                log.info(_userinfo.userId + "用户删除! 大厅在线人数:" + this.getOnlinePlayerCount());
                // 用户在大厅，非机器人
                if (this.userList[_userinfo.userId] && !this.userList[_userinfo.userId].getGameId() && !this.userList[_userinfo.userId].deleteFlag && !this.userList[_userinfo.userId]._Robot) {
                    log.info(_userinfo.userId + "用户只在大厅，没在游戏内");
                    // 用户置为离线
                    this.userList[_userinfo.userId].deleteFlag = true;
                    // 放到离线用户集合
                    this.tempuserList[_userinfo.userId] = this.userList[_userinfo.userId];
                    // 移除用户
                    delete this.userList[_userinfo.userId];
                }
            }
        };

        this.deleteUserNoLoginGame = function (userid, flag) {
            if (this.userList[userid]) {
                if (!this.userList[userid].getGameId() && !this.userList[userid]._ageinLogin) {
                    delete this.userList[userid];
                }
                if (flag) {
                    delete this.userList[userid];
                }
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
                if (!user) {
                    return null;
                }
                this.getWithdrawLimtByVipWithdrawRatio(userId, (withdrawLimit) =>{
                    ymDao.searchCurrDateInvite(userId, (currDateInvite) =>{
                        dao.searchUnReadEmail(userId, unReadEmailCode => {
                            // 查询当前用户签到第几天了
                            dao.searchUserSignIn(userId, (rows) => {
                                let currSignInFlag = 0;
                                if (rows && rows.length > 0) {
                                    // 获取当前日期时间戳
                                    const lastSignInDate = rows[0].last_sign_in_date;
                                    if (StringUtil.currDateTime() === lastSignInDate) {
                                        // 当日已签到
                                        currSignInFlag = 1;
                                    }
                                }

                                CacheUtil.getCommonCache().then(commonCache =>{
                                    CacheUtil.getDownloadExtConfig().then(downloadExtConfig => {
                                        CacheUtil.isVIPDailyGet(userId, dailyGet => {
                                            CacheUtil.isVIPMonthlyGet(userId, monthlyGet => {
                                                CacheUtil.getBankTransferConfig().then(tConfig => {
                                                    const goldTransferMin = tConfig.gold_transfer_min;
                                                    CacheUtil.getUserInfo(userId, (code, u) => {
                                                        const ret = {
                                                            account: u.account,  // 用户名
                                                            id: userId,       // 用户ID
                                                            nickname: u.nickname, // 昵称
                                                            score: StringUtil.toFixed(u.score, 2),  // 用户金币数量
                                                            diamond: parseInt(u.diamond), // 钻石数量
                                                            sign: user._sign,
                                                            proplist: user._proList,
                                                            headimgurl: user._headimgurl, // 头像ID
                                                            phoneNo: user._phoneNo, // 手机号
                                                            official: user._official,
                                                            isVip: user.is_vip,  // 是否VIP
                                                            totalRecharge: user.totalRecharge, // 总充值
                                                            vip_level: user.vip_level, // VIP等级
                                                            vip_score: user.vip_score, // VIP点数
                                                            firstRecharge: user.firstRecharge, // 是否购买首充礼包
                                                            currencyType: commonCache.currencyType,
                                                            bankScore: StringUtil.toFixed(user.bankScore, 2), // 银行积分，也就是银行里的金币
                                                            bankLock: user.bankLock,  // 银行是否被锁定
                                                            addDate: user.addDate, // 注册时间
                                                            existBankPwd: user.bankPwd ? 1 : 0, // 是否设置了银行密码
                                                            email: user._email ? user._email : '', // 邮箱
                                                            firstLogin: user.LoginCount > 1 ? 0 : 1, // 是否首次登录
                                                            inviteCode: user.inviteCode ? user.inviteCode : '', // 邀请码
                                                            ptLink: downloadExtConfig.download_url ? downloadExtConfig.download_url : '', // 推广链接
                                                            currTime: new Date().getTime(), // 当前时间戳
                                                            luckyRushStartTime: luckObject.luckyRushStartTime, // 幸运金币刷新开始时间
                                                            luckyRushEndTime: luckObject.luckyRushEndTime, // 幸运金币刷新结束时间
                                                            luckyCoin: luckObject.luckyCoin,// 幸运金币数量
                                                            luckyCoinGetStatus: luckObject.luckyCoinGetStatus, // 幸运金币可领取状态
                                                            luckyCoinTaskGetStatus: luckObject.luckyCoinTaskGetStatus, // 幸运任务可领取状态
                                                            p: user._p, // king
                                                            step: user.step, // 新手指引步数
                                                            bankGuideStep: user.bankGuideStep, // 银行指引步数
                                                            goldTransferMin: goldTransferMin, // 最小转账
                                                            dailyGet: dailyGet,   // 是否领取了每日金币
                                                            monthlyGet: monthlyGet, // 是否领取了每月金币
                                                            currSignInFlag: currSignInFlag, // 当日是否签到
                                                            unReadEmail: unReadEmailCode, // 是否有未读取邮件
                                                            currDateInvite: currDateInvite, // 当日是否邀请
                                                            withdrawLimit: withdrawLimit, // 提现额度
                                                            silverCoin: user.silverCoin // 银币
                                                        }
                                                        callback(ret);
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            } catch (e) {
                log.err(e)
                callback(null)
            }
        }

        this.initCommonCache = function (){
            // 获取国家配置
            dao.searchCountryConf(async row => {
                if (row) {
                    const val = {
                        country: row.country,
                        currencyType: Number(row.currencyType),
                        payUrls: row.payUrls,
                        dotUrls: row.dotUrls
                    }
                    await CacheUtil.initCommonCache(val);
                } else {
                    throw new Error('初始化缓存失败');
                }
            })
        }


        this.pushUndoEven = function (userId, type) {
            // 用户在线推送待执行事件（红点提示）
            if (this.userList[userId]) {
                log.info(userId + '推送红点事件类型' + type)
                this.userList[userId]._socket.emit('undoEven', {code: 1, data: {type: type}})
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

        this.sendHallShopCallBack = function (userId, shopType, serverId, code, msg, data) {
            try{
                log.info('商城购买回调，通知大厅 userId:' + userId + 'serverId:' + serverId + 'shopType:' + shopType + 'data:' + JSON.stringify(data))
            }catch (e){
                log.err(e)
            }
            if (this.userList[userId]) {
                this.userList[userId]._socket.emit('ShoppingResult', {code: code, data: data});
            }
        }

        this.sendGameShopCallBack = function (userId, shopType, serverId, code, msg, data) {
            try {
                const gameScoket = ServerInfo.getScoket(serverId);
                log.info('商城购买回调，通知游戏内 userId:' + userId + 'serverId:' + serverId + 'shopType:' + shopType + 'gameScoket' + gameScoket)
                if (gameScoket) {
                    // 游戏内推
                    const gameScoket = ServerInfo.getScoket(serverId);
                    if (gameScoket) {
                        gameScoket.emit('gameForward', {
                            userId: userId,
                            protocol: 'ShoppingResult',
                            data: {code: code, data: data}
                        })
                    }
                }
            } catch (e) {
                log.err('sendGameShopCallBack' + e);
            }
        }

        //商城购买
        this.Shopping = function (userId, productId, count, service, shopType, serverId, goods, callback) {
            CacheUtil.buyCallBackSwitch().then(nSwitch =>{
                CacheUtil.paySwitch().then(paySwitch =>{
                    CacheUtil.getServerUrlConfig().then(config => {
                        try {
                            const hallUrl = config.hallUrl ? config.hallUrl : '';
                            // 生成订单ID
                            const orderId = StringUtil.generateOrderId();

                            if (TypeEnum.ShopType.store === shopType) {
                                this.storeBuy(orderId, userId, productId, count, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback)
                            } else if (TypeEnum.ShopType.free_turntable === shopType) {
                                this.turntableBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback);
                            } else if (TypeEnum.ShopType.discount_Limited === shopType) {
                                this.discountLimitedBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback);
                            } else if (TypeEnum.ShopType.firstRecharge === shopType) {
                                this.firstRechargeBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods,  callback);
                            }else if (TypeEnum.ShopType.withdraw_goods === shopType) {
                                this.withdrawGoodsBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback);
                            }else if (TypeEnum.ShopType.month_card_goods === shopType) {
                                this.monthCardGoodsBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback);
                            }else {
                                log.info(userId + '下单失败,购买商品类型不存在' + shopType)
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            }
                        } catch (e) {
                            log.err('ShoppingResult' + e);
                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                        }
                    })

                })
            })
        };
        this.withdrawGoodsBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback){
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getBankTransferConfig().then(bankConfig => {
                const withdrawGoods = bankConfig.withdrawGoods;
                const shopItem = withdrawGoods.find(item => item.id === productId);
                if (!shopItem) {
                    log.err(userId + '提现解锁商品不存在' + productId)
                    callback(0, "提现解锁商品不存在")
                    return;
                }
                // 原价
                const price = parseFloat(shopItem['source_price']);
                // 折扣价
                const amount = parseFloat(shopItem['target_price']);
                // 类型
                const goodsType = parseFloat(shopItem['type']);
                // 数量
                const goodsVal = parseFloat(shopItem['val']);
                // 货币类型
                const currencyTypeIndex = parseFloat(shopItem['currency_type']);
                const currencyType =  self.getCurrencyTypeByIndex(currencyTypeIndex);
                // 银币
                const silverCoin = parseFloat(shopItem['silver_coin']);
                log.info(userId + '购买提现解锁商品原价:' + price + '折扣价:' + amount + '货币类型:' + currencyType + '购买会赠送银币:' + silverCoin + '支付开关:' + paySwitch)

                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId,goodsType, TypeEnum.ShopType.withdraw_goods, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.withdraw_goods, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }
            })

        }

        /*this.firstRechargeBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getShopConfig().then(shopConfig => {
                const shopItem = shopConfig.find(item => item.id === productId);
                if (!shopItem) {
                    log.err(userId + '首充商品不存在' + productId)
                    callback(0, "首充商品不存在")
                    return;
                }

                let firstRecharge = 1; // 默认购买过首充礼包
                self.buyFirstRecharge(userId, d => {
                    firstRecharge = d;
                    // 已经首充不用
                    if (firstRecharge === 1 && shopItem.group === TypeEnum.ShopGroupType.rechargeGift) {
                        log.err(userId + '已经购买过首充礼包')
                        callback(0, "已经购买过首充礼包")
                        return;
                    }
                    // 原价
                    const price = parseFloat(shopItem['source_price']);
                    // 折扣价
                    const amount = parseFloat(shopItem['target_price']);
                    // 类型
                    const goodsType = parseFloat(shopItem['type']);
                    // 数量
                    const goodsVal = parseFloat(shopItem['val']);
                    // 巴西币
                    const currencyType = TypeEnum.CurrencyType.Brazil_BRL;
                    const buyContinueRewardGold = parseFloat(shopItem['buy_continue_reward_gold']);
                    const buyContinueRewardDiamond = parseFloat(shopItem['buy_continue_reward_diamond']);
                    const buyContinueDays = parseFloat(shopItem['buy_continue_days']);
                    log.info(userId + '购买首充商品原价:' + price + '折扣价:' + amount + '持续奖励金币:' + buyContinueRewardGold + '持续奖励钻石:' + buyContinueRewardDiamond + '持续天数:' + buyContinueDays)

                    if(paySwitch){
                        self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, 0)
                    }else{
                        self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays)
                    }
                });
            })
        }*/

        this.getCurrencyTypeByIndex = function (index){
            if(index === TypeEnum.CurrencyTypeIndex.Brazil_BRL){
                return TypeEnum.CurrencyType.Brazil_BRL;
            }else if(index === TypeEnum.CurrencyTypeIndex.Indian_Rupee){
                return TypeEnum.CurrencyType.Indian_Rupee;
            }
            return TypeEnum.CurrencyType.Default;
        }


        this.monthCardGoodsBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getMonthCardConfig().then(config => {
                const monthCardGoods = config.monthCardGoods;
                const shopItem = monthCardGoods.find(item => item.id === productId);
                if (!shopItem) {
                    log.err(userId + '月卡商品不存在' + productId)
                    callback(0, "月卡商品不存在")
                    return;
                }
                // 原价
                const price = parseFloat(shopItem['source_price']);
                // 折扣价
                const amount = parseFloat(shopItem['target_price']);
                // 类型
                const goodsType = parseFloat(shopItem['type']);
                // 数量
                const goodsVal = parseFloat(shopItem['val']);
                // 银币
                const silverCoin = parseFloat(shopItem['silver_coin']);
                // 货币类型
                const currencyTypeIndex = parseFloat(shopItem['currency_type']);
                const currencyType =  self.getCurrencyTypeByIndex(currencyTypeIndex);
                // 月卡持续奖励
                const buyContinueRewardGold = parseFloat(shopItem['buy_continue_reward_gold']);
                const buyContinueRewardDiamond = parseFloat(shopItem['buy_continue_reward_diamond']);
                const buyContinueDays = parseFloat(shopItem['buy_continue_days']);
                log.info(userId + '购买月卡商品原价:' + price + '折扣价:' + amount + '货币类型:' + currencyType + '购买会赠送银币:' + silverCoin + '持续奖励金币:' + buyContinueRewardGold + '持续奖励银币:' + buyContinueRewardDiamond + '持续天数:' + buyContinueDays + '支付开关:' + paySwitch)
                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId,goodsType, TypeEnum.ShopType.month_card_goods, TypeEnum.ShopGroupType.normal, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, 0, silverCoin)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.month_card_goods, TypeEnum.ShopGroupType.normal, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, 0, silverCoin)
                }
            })
        }


        this.firstRechargeBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getFirstRechargeConfig().then(cf => {
                const firstRechargeGoods = cf.firstRechargeGoods;
                const shopItem = firstRechargeGoods.find(item => item.id === productId);
                if (!shopItem) {
                    log.err(userId + '首充商品不存在' + productId)
                    callback(0, "首充商品不存在")
                    return;
                }
                let firstRecharge = 1; // 默认购买过首充礼包
                self.buyFirstRecharge(userId, d => {
                    firstRecharge = d;
                    // 已经首充不用
                    if (firstRecharge === 1 && shopItem.group === TypeEnum.ShopGroupType.rechargeGift) {
                        log.err(userId + '已经购买过首充礼包')
                        callback(0, "已经购买过首充礼包")
                        return;
                    }
                    // 原价
                    const price = parseFloat(shopItem['source_price']);
                    // 折扣价
                    const amount = parseFloat(shopItem['target_price']);
                    // 类型
                    const goodsType = parseFloat(shopItem['type']);
                    // 数量
                    const goodsVal = parseFloat(shopItem['val']);
                    // 银币
                    const silverCoin = parseFloat(shopItem['silver_coin']);
                    // 货币类型
                    const currencyTypeIndex = parseFloat(shopItem['currency_type']);
                    const currencyType =  self.getCurrencyTypeByIndex(currencyTypeIndex);
                    log.info(userId + '购买首充商品原价:' + price + '折扣价:' + amount + '货币类型:' + currencyType + '购买会赠送银币:' + silverCoin + '支付开关:' + paySwitch)

                    if(paySwitch){
                        self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, 0, 0, 0, 0, silverCoin)
                    }else{
                        self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, 0, 0, 0, 0, silverCoin)
                    }
                });
            })
        }



        this.discountLimitedBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods,  callback) {
            const self = this;

            CacheUtil.getUserDiscountLimited(userId).then(ok => {
                if (!ok) {
                    callback(0, "限时折扣时间已过")
                    return;
                }
                CacheUtil.delUserDiscountLimited(userId).then(r =>{});
                // 查询购买的金币道具的数量和价值
                CacheUtil.getDiscountLimitedConfig().then(config => {
                    const shopItem = config.find(item => item.id === productId);
                    if (!shopItem) {
                        callback(0, "商品不存在")
                        return;
                    }
                    // 原价
                    const price = parseFloat(shopItem['source_price']);
                    // 折扣价
                    const amount = parseFloat(shopItem['target_price']);
                    // 货币类型
                    const currencyTypeIndex = parseFloat(shopItem['currency_type']);
                    const currencyType =  self.getCurrencyTypeByIndex(currencyTypeIndex);
                    // 金币数量
                    const goodsVal = parseFloat(shopItem['Discount_BONUS']);
                    // 银币
                    const silverCoin = parseFloat(shopItem['silver_coin']);
                    log.info(userId + '购买限时折扣商品原价:' + price + '折扣价:' + amount + '货币类型:' + currencyType + '购买会赠送银币:' + silverCoin + '支付开关:' + paySwitch)

                    if(paySwitch){
                        self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId, shopItem.type, TypeEnum.ShopType.discount_Limited, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                    }else{
                        self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,shopItem.type, TypeEnum.ShopType.discount_Limited, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                    }
                })
            })

        }

        this.turntableBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;
            // 获取幸运币配置
            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                const buyMulPriceItem = luckyCoinConfig.turntableBuyMulPrice.find(item => item.id === productId);
                if (!buyMulPriceItem) {
                    log.err(userId + '没有该商品' + productId)
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg);
                    return;
                }
                // 价格
                const amount = buyMulPriceItem.price;
                // 货币类型
                const currencyTypeIndex = buyMulPriceItem.currencyType;
                const currencyType = self.getCurrencyTypeByIndex(currencyTypeIndex);
                // 购买倍数
                const mul = buyMulPriceItem.mul;
                // 银币
                const silverCoin = buyMulPriceItem.silver_coin;
                log.info(userId + '购买免费转盘门票' + 'amount:' + amount + 'currencyType:' + currencyType + 'mul:' + mul + '购买赠送银币:' + silverCoin + '支付开关:' + paySwitch)

                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, 1, amount, currencyType, nSwitch, callback, service, mul, serverId, TypeEnum.GoodsType.turntableTicket, TypeEnum.ShopType.free_turntable, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, 1, amount, currencyType, nSwitch, callback, service, mul, serverId ,TypeEnum.GoodsType.turntableTicket, TypeEnum.ShopType.free_turntable, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }
            });
        }

        this.placeOrder = function (hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, mul, serverId, goodsType, shopType, group, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, goods, silverCoin) {
            const self = this;
            CacheUtil.getCommonCache().then(commonCache =>{
                const callbackUrl = hallUrl + '/shoppingCallBack?userId=' + userId + '&orderId=' + orderId;
                let payType = -1;
                let payChannelType = '';
                if(commonCache.country === TypeEnum.CountryType.yd){
                    log.info('--------使用印度支付---------')
                    // 支付类型
                    payType = TypeEnum.PayType.apnaPay;
                    payChannelType = TypeEnum.PayChannelType.apnapay;
                }else if(commonCache.country === TypeEnum.CountryType.bx) {
                    log.info('--------使用巴西支付---------')
                    payType = goods ? TypeEnum.PayType.fatpag : TypeEnum.PayType.betcatpay;
                    payChannelType = TypeEnum.PayChannelType.pix;
                }
                if(payType === -1){
                    throw new Error('支付类型无法确定，出错了')
                }
                CacheUtil.searchOrderCache(userId, productId, amount, payType).then(orderInfo => {
                    if (orderInfo) {
                        log.info(userId + '已经存在的订单,使用存在的订单:' + JSON.stringify(orderInfo))
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderInfo)
                    } else {
                        if(payType === TypeEnum.PayType.fatpag){ // 巴西fastPay
                            // 下购买订单
                            PayAPI.fastBuyOrder(userId, productId, orderId, amount, currencyType, goods, callbackUrl).then(res => {
                                try {
                                    log.info(userId + '下购买订单' + res)
                                    const orderResult = JSON.parse(res);
                                    if (orderResult && orderResult.code === 200) {
                                        // 订单缓存
                                        CacheUtil.orderCache(userId, productId, amount, payType, orderResult.data)
                                        self.getVipLevel(userId, vipLevel => {
                                            CacheUtil.getVConfig().then(config =>{
                                                // 单笔充值额度提升=充值金额*recharge_vip_socre_percentage百分比。
                                                const promoteWithdrawLimit = StringUtil.rideNumbers(amount, parseInt(config.recharge_vip_socre_percentage) / 100, 2);
                                                // 记录订单详情
                                                dao.orderRecord(parseInt(userId), orderId, productId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payChannelType, payType, promoteWithdrawLimit, silverCoin,ret => {
                                                    if (ret) {
                                                        self.intervalSearchOrder(userId, orderId, TypeEnum.PayType.fatpag);
                                                        orderResult.data.switch = nSwitch;
                                                        orderResult.data.currencyType = TypeEnum.CurrencyTypeIndex.Brazil_BRL;
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                                    } else {
                                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                                    }
                                                })
                                            })
                                        })
                                    } else {
                                        log.err(userId + '购买商品下购买订单失败' + res)
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                } catch (e) {
                                    log.err(userId + '购买商品下购买订单异常' + e)
                                    callback(ErrorCode.FAILED.code, '购买商品下购买订单调用接口返回数据异常')
                                }
                            })
                        }else if(payType === TypeEnum.PayType.betcatpay){ // 巴西
                            // 下购买订单
                            PayAPI.buyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res => {
                                try {
                                    log.info(userId + '下购买订单' + res)
                                    const orderResult = JSON.parse(res);
                                    if (orderResult && orderResult.code === 200) {
                                        // 订单缓存
                                        CacheUtil.orderCache(userId, productId, amount, payType, orderResult.data)
                                        self.getVipLevel(userId, vipLevel => {
                                            CacheUtil.getVConfig().then(config => {
                                                // 单笔充值额度提升=充值金额*recharge_vip_socre_percentage百分比。
                                                const promoteWithdrawLimit = StringUtil.rideNumbers(amount, parseInt(config.recharge_vip_socre_percentage) / 100 , 2);
                                                // 记录订单详情
                                                dao.orderRecord(parseInt(userId), orderId, productId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays,  TypeEnum.PayChannelType.pix, payType, promoteWithdrawLimit, silverCoin,ret => {
                                                    if (ret) {
                                                        self.intervalSearchOrder(userId, orderId, payType);
                                                        orderResult.data.switch = nSwitch;
                                                        orderResult.data.currencyType = TypeEnum.CurrencyTypeIndex.Brazil_BRL;
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data);
                                                    } else {
                                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                                    }
                                                })
                                            })
                                        })
                                    } else {
                                        log.err(userId + '购买商品下购买订单失败' + res)
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                } catch (e) {
                                    log.err(userId + '购买商品下购买订单异常' + e)
                                    callback(ErrorCode.FAILED.code, '购买商品下购买订单调用接口返回数据异常')
                                }
                            })
                        }else if(payType === TypeEnum.PayType.apnaPay){ // 印度支付
                            // 下购买订单
                            PayAPI.ydBuyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res => {
                                try {
                                    log.info(userId + '下购买订单' + res)
                                    const orderResult = JSON.parse(res);
                                    if (orderResult && orderResult.code === 0) {
                                        self.getVipLevel(userId, vipLevel => {
                                            CacheUtil.getVConfig().then(config => {
                                                // 单笔充值额度提升=充值金额*recharge_vip_socre_percentage百分比。
                                                const promoteWithdrawLimit = StringUtil.rideNumbers(amount, parseInt(config.recharge_vip_socre_percentage) / 100 , 2);
                                                // 记录订单详情
                                                dao.orderRecord(parseInt(userId), orderId, productId , amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payChannelType , payType, promoteWithdrawLimit, silverCoin, ret => {
                                                    if (ret) {
                                                        self.intervalSearchOrder(userId, orderId,  payType);
                                                        const data = {
                                                            "orderStatus": 1,
                                                            "orderNo": orderId,
                                                            "merOrderNo": orderId,
                                                            "amount": amount,
                                                            "currency": TypeEnum.CurrencyType.Indian_Rupee,
                                                            "currencyType": TypeEnum.CurrencyTypeIndex.Indian_Rupee,
                                                            "switch": nSwitch,
                                                            "createTime": orderResult.data.create_time,
                                                            "updateTime": orderResult.data.create_time,
                                                            "sign": "",
                                                            "params": {
                                                                "qrcode": orderResult.data.url,
                                                                "url": orderResult.data.url
                                                            }
                                                        }
                                                        // 订单缓存
                                                        CacheUtil.orderCache(userId, productId, amount, payType, data)
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                    } else {
                                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                                    }
                                                })
                                            })
                                        })
                                    } else {
                                        log.err(userId + '购买商品下购买订单失败' + res)
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                } catch (e) {
                                    log.err(userId + '购买商品下购买订单异常' + e)
                                    callback(ErrorCode.FAILED.code, '购买商品下购买订单调用接口返回数据异常')
                                }
                            })
                        }
                    }
                })
            })

        }

        /**
         * 测试只支持 betcatpay支付
         * @constructor
         */
        this.TestPlaceOrder = function (hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, mul, serverId, goodsType, shopType, group, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, goods, silverCoin) {
            const self = this;
            CacheUtil.getCommonCache().then(commonCache =>{
                let payType = -1;
                let payChannelType = '';
                if(commonCache.country === TypeEnum.CountryType.yd){
                    log.info('--------使用印度支付---------')
                    // 支付类型
                    payType = TypeEnum.PayType.apnaPay;
                    payChannelType = TypeEnum.PayChannelType.apnapay;
                }else if(commonCache.country === TypeEnum.CountryType.bx) {
                    log.info('--------使用巴西支付---------')
                    payType = goods ? TypeEnum.PayType.fatpag : TypeEnum.PayType.betcatpay;
                    payChannelType = TypeEnum.PayChannelType.pix;
                }
                if(payType === -1){
                    throw new Error('支付类型无法确定，出错了')
                }

                CacheUtil.searchOrderCache(userId, productId, amount, payType).then(orderInfo => {
                    if (orderInfo) {
                        log.info(userId + '已经存在的订单,使用存在的订单:' + orderInfo)
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderInfo)
                    } else {
                        // 下购买订单
                        self.getVipLevel(userId, vipLevel => {
                            CacheUtil.getVConfig().then(config => {
                                // 单笔充值额度提升=充值金额*recharge_vip_socre_percentage百分比。
                                const promoteWithdrawLimit = StringUtil.rideNumbers(amount, parseInt(config.recharge_vip_socre_percentage) / 100, 2);
                                // 记录订单详情
                                dao.orderRecord(parseInt(userId), orderId, productId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays,  payChannelType, payType, promoteWithdrawLimit, silverCoin,ret => {
                                    if (ret) {
                                        log.info(userId + '测试购买下订单成功' + orderId)
                                        const orderResult = {
                                            "code": 1,
                                            "data": {
                                                "orderStatus": 1,
                                                "orderNo": "77158f8f87b444b2ac7ec5b3db9baecc",
                                                "merOrderNo": orderId,
                                                "amount": 0,
                                                "currency": "BRL",
                                                "createTime": 0,
                                                "updateTime": 0,
                                                "sign": "",
                                                "params": {
                                                    "qrcode": "",
                                                    "url": ""
                                                },
                                                "switch": nSwitch ? 1 : 0
                                            }
                                        }
                                        // 订单缓存
                                        CacheUtil.orderCache(userId, productId, amount, payType, orderResult.data)
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                    } else {
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                })
                            })
                        })
                    }
                })
            });
        }


        // 定时查询订单
        this.intervalSearchOrder = function (userId, orderId, payType){
            const self = this;
            let elapsedTime = 0; // 记录经过的时间（秒）
            // 先查询一次订单
            self.searchOrderUpdate(userId, orderId, payType,(ret) =>{
                dao.searchOrder(userId, orderId, row =>{
                    const amount = row.amount;
                    const orderType = row.payType;
                    const productId = row.productId;
                    if(!ret){
                        // 查询一次失败后， 定时10秒再查
                        const interval = setInterval(() => {
                            self.searchOrderUpdate(userId, orderId, payType, (code) =>{
                                const timeOut = elapsedTime >= 60 * 60;
                                if (code || timeOut) {
                                    // 条件满足时清除定时器
                                    clearInterval(interval);
                                    if(timeOut){
                                        dao.updateOrder(userId, orderId, TypeEnum.OrderStatus.payTimeOut, ret =>{
                                            log.info(userId + '订单超时结束，移除缓存订单orderId:' + orderId);
                                            CacheUtil.delOrderCache(userId, productId, amount, orderType).then(r =>{})
                                        });
                                    }else{
                                        log.info(userId + '订单完成,移除缓存订单orderId:' + orderId);
                                        CacheUtil.delOrderCache(userId, productId, amount, orderType).then(r =>{})
                                    }
                                }
                            })
                            elapsedTime += 10; // 每次操作后增加10秒
                        }, 10000); // 间隔10秒执行一次
                    }else{
                        CacheUtil.delOrderCache(userId, productId, amount, orderType).then(r =>{})
                        log.info(userId + '订单完成orderId:' + orderId);
                    }
                })
            })
        }

        this.searchOrderUpdate = function (userId, orderId, payType, callback){
            const self = this;

            if(payType === TypeEnum.PayType.fatpag || payType === TypeEnum.PayType.betcatpay){  // 巴西支付订单查询
                PayAPI.searchBXOrder(orderId, payType).then(result =>{
                    if(StringUtil.isJson(result)){
                        const res = JSON.parse(result);
                        // log.info(userId + '查询订单结果:' +  res);
                        try{
                            if(res && res.code === 200 && res.data){
                                const orderStatus = res.data.orderStatus;
                                const amount = res.data.amount;
                                // 支付未通知 支付已通知  交易失败 交易过期 交易退还 交易异常 交易结束
                                if(orderStatus === TypeEnum.OrderStatus.payedNotify || orderStatus === TypeEnum.OrderStatus.payedUnNotify
                                    || orderStatus === TypeEnum.OrderStatus.payFailed || orderStatus === TypeEnum.OrderStatus.payExpired
                                    || orderStatus === TypeEnum.OrderStatus.payReturn || orderStatus === TypeEnum.OrderStatus.payExcept){

                                    if(orderStatus === TypeEnum.OrderStatus.payedNotify || orderStatus === TypeEnum.OrderStatus.payedUnNotify){
                                        log.info(userId + '订单支付成功:' +  res);
                                        self.shoppingCallBack(userId, orderId, orderStatus, (code, msg, data, shopType, service, serverId) => {
                                            // 回调socket
                                            if (serverId === 0) { // 大厅
                                                self.sendHallShopCallBack(userId, shopType, serverId, msg, data)
                                            } else if (serverId !== 0) { // 游戏内
                                                self.sendGameShopCallBack(userId, shopType, serverId, msg, data)
                                            }
                                            if(Number(shopType) === TypeEnum.ShopType.firstRecharge){
                                                // 充值成功打点
                                                self.dot(userId, TypeEnum.dotEnum.recharge_arrive,  null, null, null, amount , TypeEnum.DotNameEnum.first_recharge_arrive,code =>{
                                                    if(code){
                                                        log.info(userId + '首充打点成功,充值金额:' + amount)
                                                    }else{
                                                        log.info(userId + '首充打点失败,充值金额:' + amount)
                                                    }
                                                })
                                            }else{
                                                // 充值成功打点
                                                self.dot(userId, TypeEnum.dotEnum.recharge_arrive,  null, null, null, amount , TypeEnum.DotNameEnum.recharge_arrive,code =>{
                                                    if(code){
                                                        log.info(userId + '复充打点成功,充值金额:' + amount)
                                                    }else{
                                                        log.info(userId + '复充打点失败,充值金额:' + amount)
                                                    }
                                                })
                                            }
                                            callback(1)
                                        });
                                    }else{
                                        dao.updateOrder(userId, orderId, orderStatus, ret=>{
                                            log.info(userId + '订单' + orderId + '订单状态:' + orderStatus)
                                            callback(1)
                                        })
                                    }
                                }else{
                                    callback(0)
                                }
                            }else{
                                log.info(userId + '查询巴西订单'+ orderId + '结果:' +  JSON.stringify(res));
                                if(res.code === 400){
                                    dao.updateOrder(userId, orderId, TypeEnum.OrderStatus.orderNotExist, ret=>{
                                        log.info(userId + '订单' + orderId + '订单状态:' + TypeEnum.OrderStatus.orderNotExist)
                                        callback(1)
                                    })
                                }else{
                                    callback(0)
                                }
                            }
                        }catch (e){
                            log.err(userId + '查询巴西订单异常' + e)
                        }
                    }else{
                        log.err(userId + '查询巴西订单格式异常,查询订单结果:' + result)
                    }
                });
            }else if(payType === TypeEnum.PayType.apnaPay){  // 印度支付订单查询
                PayAPI.searchYDOrder(orderId, payType).then(result =>{
                    if(StringUtil.isJson(result)) {
                        try {
                            const res = JSON.parse(result);
                            // log.info(userId + '查询订单结果:' +  res);
                            if(res && res.code === 0 && res.data){
                                let orderStatus = res.data.status;
                                const amount = StringUtil.toFixed(res.data.amount, 2);
                                if(orderStatus === TypeEnum.OrderStatus.payedNotify){
                                    log.info(userId + '订单支付成功:' +  res);
                                    self.shoppingCallBack(userId, orderId, orderStatus, (code, msg, data, shopType, service, serverId) => {
                                        // 回调socket
                                        if (serverId === 0) { // 大厅
                                            self.sendHallShopCallBack(userId, shopType, serverId, msg, data)
                                        } else if (serverId !== 0) { // 游戏内
                                            self.sendGameShopCallBack(userId, shopType, serverId, msg, data)
                                        }
                                        // 充值成功打点
                                        self.dot(userId, TypeEnum.dotEnum.recharge_arrive,  null, null, null, amount ,TypeEnum.DotNameEnum.recharge_arrive, code =>{
                                            if(code){
                                                log.info(userId + '充值成功打点成功,充值金额:' + amount)
                                            }else{
                                                log.info(userId + '充值成功打点失败,充值金额:' + amount)
                                            }
                                        })
                                        callback(1)
                                    })
                                }else if(orderStatus === TypeEnum.OrderStatus.payFailed){
                                    dao.updateOrder(userId, orderId, -1, ret=>{
                                        log.info(userId + '订单' + orderId + '订单状态:' + orderStatus)
                                        callback(1)
                                    })
                                }else {
                                    callback(0);
                                }
                            }else{
                                callback(0)
                            }
                        } catch (e) {
                            log.err(userId + '查询印度订单异常' + e)
                        }
                    }else{
                        log.err(userId + '查询印度订单格式异常,查询订单结果:' + result)
                    }
                })
            }
        }



        this.storeBuy = function (orderId, userId, productId, count, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;
            // 查询购买的金币道具的数量和价值
            CacheUtil.getShopConfig().then(shopConfig => {
                const shopItem = shopConfig.find(item => item.id === productId);
                if (!shopItem) {
                    callback(0, "商品不存在")
                    log.err(userId + '购买商品不存在')
                    return;
                }
                // 原价
                const price = parseFloat(shopItem['source_price']) * count;
                // 折扣价
                const amount = parseFloat(shopItem['target_price']) * count;
                // 类型
                const goodsType = parseFloat(shopItem['type']);
                // 数量
                const goodsVal = parseFloat(shopItem['val']) * count;
                // 货币类型
                const currencyTypeIndex = parseFloat(shopItem['currency_type']);
                const currencyType =  self.getCurrencyTypeByIndex(currencyTypeIndex);
                // 银币
                const silverCoin = parseFloat(shopItem['silver_coin']);
                log.info(userId + '购买普通商品原价:' + price + '折扣价:' + amount + '货币类型:' + currencyType + '购买会赠送银币:' + silverCoin)

                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId, goodsType, TypeEnum.ShopType.store, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.store, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods, silverCoin)
                }
            })
        }


        // 充值统计
        this.rechargeCount = function (userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, callback) {
            const self = this;
            dao.checkTotalCharge(parseInt(userId), (res, data) => {
                if (!res) {
                    callback(0)
                    return;
                }
                try {
                    data.totalRecharge = StringUtil.addNumbers(data.totalRecharge, StringUtil.toFixed(amount, 2));
                    const oldVipLevel = data.housecard;
                    // 计算充值获得VIP积分
                    const vipScore = StringUtil.rideNumbers(data.totalRecharge, (recharge_vip_socre_percentage / 100), 2);
                    log.info(userId + '总充值:' + data.totalRecharge + '总VIP点数:' + vipScore)
                    // 计算VIP等级
                    this.getVipLevelByScore(vipScore, vipLevel => {
                        // 更新VIP积分
                        dao.updateVipScore(userId, vipScore, (res) => {
                            if (self.userList[userId]) {
                                self.userList[userId].vip_score = vipScore;
                            }
                            // VIP升级
                            self.vipUpgrade(userId, vipLevel, oldVipLevel, serverId);
                            // 更新下级充值返点
                            self.juniorRecharge(userId, currencyType, amount, score_amount_ratio);
                            // 修改累计充值
                            self.addTotalCharge(userId, amount, vipLevel);
                        });
                        callback(vipLevel)
                    })
                } catch (e) {
                    log.err(e)
                }
            });
        }


        // 购买订单回调
        this.shoppingCallBack = function (userId, orderId, payStatus, callback) {
            try {
                log.info('购买商品支付成功' + userId + '订单' + orderId)
                // 查询订单
                dao.searchOrder(userId, orderId, row => {
                    if (!row) {
                        log.err(userId + '无此订单' + orderId)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        return;
                    }

                    const goodsType = row.goodsType;
                    const price = row.price;
                    const amount = row.amount;
                    const currencyType = row.currencyType;
                    const group = row.group;
                    const shopType = row.shopType; // 购买类型
                    const mul = row.mul;
                    const service = row.service;
                    const val = row.val;
                    const serverId = row.serverId;
                    const buyContinueRewardGold = row.buyContinueRewardGold;
                    const buyContinueRewardDiamond = row.buyContinueRewardDiamond;
                    const buyContinueDays = row.buyContinueDays;
                    const silverCoin = Number(row.silverCoin); // 获得银币

                    dao.getScore(userId, (code, row) => {
                        if (!code) {
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                            return;
                        }
                        const currScore = row.score;
                        if (TypeEnum.ShopType.store === shopType) {
                            this.storeBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, silverCoin, callback)
                        } else if (TypeEnum.ShopType.free_turntable === shopType) {
                            this.freeTurntableBuyCallback(userId, orderId, mul, amount, currencyType, shopType, service, serverId, payStatus, silverCoin, callback)
                        } else if (TypeEnum.ShopType.discount_Limited === shopType) {
                            this.discountLimitedBuyCallback(userId, orderId, amount, currencyType, service, serverId, goodsType, val, currScore, payStatus, silverCoin, callback)
                        } else if (TypeEnum.ShopType.firstRecharge === shopType) {
                            this.firstRechargeBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, silverCoin, callback)
                        } else if (TypeEnum.ShopType.withdraw_goods === shopType) {
                            this.withdrawGoodsBuyCallback(userId, orderId, amount, currencyType, service, serverId, goodsType, val, currScore, payStatus, silverCoin, callback)
                        } else if (TypeEnum.ShopType.month_card_goods === shopType) {
                            this.monthCardGoodsBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payStatus, silverCoin, callback)
                        } else {
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    })
                })
            } catch (e) {
                log.err('购买订单回调' + e)
                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
            }
        }


        // 提现结果回调
        this.withdrawCallBack = function (userId, orderId, callback) {
            try {
                const self = this;
                dao.searchWithdrawRecordByOrdeId(userId, orderId, (code, row) => {
                    if (!code) {
                        log.err(userId + '无此提现记录' + orderId)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        return;
                    }
                    const payStatus = Number(row.payStatus); // 支付状态
                    const status = Number(row.status); // 审核状态
                    const withdrawAmount = StringUtil.toFixed(row.amount, 2); // 提现金额
                    log.info(userId + '提现审核订单:' + orderId + '支付状态:' + payStatus + '审核状态:' + status + '提现金额:' + withdrawAmount)
                    if(payStatus === 2 && status === 1){ // 提现成功
                        dao.searchUserById(userId, row =>{
                            // 发送提现跑马灯
                            const noticeMsg = [{
                                type: TypeEnum.notifyType.withdraw, // 6
                                content_id: ErrorCode.WITHDRAW_NOTIFY.code, // p0006
                                extend: {
                                    nickName: row.nickname ? row.nickname : '', // 昵称
                                    withdrawAmount: withdrawAmount, // 提现金额
                                    userId: userId
                                }
                            }]
                            http_bc.sendNoticeMsg(noticeMsg);
                            self.saveEmail(LanguageItem.withdraw_apply_title, TypeEnum.EmailType.withdraw, userId, 0, LanguageItem.withdraw_apply_content, -1, -1)
                            log.info(userId + '提现成功，跑马灯通知')
                        })
                        self.dot(userId, null,  null, null, null, withdrawAmount , TypeEnum.DotNameEnum.withdraw_arrive,code =>{
                            if(code){
                                log.info(userId + '提现成功打点成功')
                            }else{
                                log.info(userId + '提现成功打点失败')
                            }
                        })
                    }else{ // 支付失败 或者审核不通过
                        // 获取提现配置
                        CacheUtil.getBankTransferConfig().then(config => {
                            const withdrawProportion = config.withdraw_proportion; // 提现金币比例
                            const glodCoin = StringUtil.rideNumbers(withdrawProportion, withdrawAmount, 2);
                            // 插入提现失败表
                            dao.withdrawFailedRecord(userId, glodCoin, newUserId =>{
                                if(newUserId){
                                    // 发邮件提醒
                                    this.saveEmail(LanguageItem.withdraw_failed_title, TypeEnum.EmailType.withdrawFailed, userId, 0, LanguageItem.withdraw_apply_content, newUserId, TypeEnum.GoodsType.gold)
                                }
                            });
                            dao.ReduceUsedWithdrawLimit(userId, withdrawAmount, ret =>{
                                log.info(userId + '订单:' + orderId + '已返还提现额度：' + withdrawAmount)
                            })
                        })
                    }
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                })
            } catch (e) {
                log.err(userId + '订单:' + orderId + '提现结果回调' + e)
                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
            }
        }


        this.bankruptGrant = function (userId, serverId, callback) {
            dao.searchUserById(userId, (code, row) => {
                if (!code) {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    return;
                }
                const currScore = row.score;
                const currBankScore = row.bankScore;
                // 已经领取的补助金次数
                const getBustTimes = row.bustTimes;

                CacheUtil.isBankrupt(currScore, currBankScore, (bankrupt, bustBonus, bustTimes) => {
                    const remainTimes = StringUtil.reduceNumbers(bustTimes, getBustTimes);

                    if (bankrupt && StringUtil.compareNumbers(getBustTimes, bustTimes)) {   // 破产且还有补助金领取次数
                        // 发放补助金
                        CacheUtil.addGoldCoin(userId, parseInt(bustBonus), TypeEnum.ScoreChangeType.bustBonus, (ret, currGoldCoin) => {
                            if (!ret) {
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                return;
                            }
                            log.info(userId + '领取破产补助:' + bustBonus + '已领取次数:' + getBustTimes)
                            // 减少领取次数
                            dao.addGetBustTimes(userId, ret => {
                                if (!ret) {
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                    return;
                                }
                                log.info(userId + '破产补助金发放' + bustBonus + '剩余领取次数' + remainTimes + '当前金币:' + StringUtil.addNumbers(currScore, bustBonus))
                                const data = {
                                    bankrupt: true,
                                    bustBonus: bustBonus,
                                    bustTimes: remainTimes,
                                    score: StringUtil.toFixed(currGoldCoin, 2)
                                }
                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                            })
                        })
                    } else {
                        log.info(userId + '破产:' + bankrupt + '已领取次数:' + getBustTimes + '配置补助次数:' + bustTimes)
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
        this.storeBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, silverCoin, callback) {
            let sourceVal = 0; // 原价金币数量
            let addVal = 0; // 增加金币数量
            let totalVal = 0; // 总金币数量
            const self = this;
            try {
                CacheUtil.getVConfig().then(vConfig => {
                    // 充值获得VIP积分百分比
                    const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                    // 游戏有效投注获得VIP积分百分比
                    const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                    // 增加VIP积分(VIP点数)
                    let addVipPoint = StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);

                    CacheUtil.getScoreConfig().then(scoreConfig => {
                        const score_amount_ratio = scoreConfig.score_amount_ratio
                        // 充值统计VIP升级
                        self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                            const config = self.getVipConfigByLevel(vConfig.levelConfig, currVipLevel)
                            // 购买金币
                            if (TypeEnum.GoodsType.gold === goodsType) {
                                // 充值得到的金币
                                let sourceScore = val;
                                // 获取VIP等级额外加金币
                                const shopScoreAddRate = config.shopScoreAddRate ? config.shopScoreAddRate : 0;
                                const addScore = StringUtil.toFixed(sourceScore * ((shopScoreAddRate - 100) / 100), 2);
                                const score = sourceScore + addScore;
                                sourceVal = sourceScore;
                                addVal = addScore;
                                totalVal = score;
                            } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                sourceVal = val;
                                addVal = 0;
                                totalVal = sourceVal;
                            }
                            // 发银币
                            self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.storeBuy, ret=>{
                                log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);
                            })
                            // 更新订单状态
                            dao.updateOrder(userId, orderId, payStatus, ret => {
                                // 发金币或钻石
                                if (TypeEnum.GoodsType.gold === goodsType) {
                                    CacheUtil.addGoldCoin(userId, Number(totalVal), TypeEnum.ScoreChangeType.storeBuy, (ret, currGoldCoin) => {
                                        log.info(userId + '当前VIP等级:' + currVipLevel + '金币加成率:' + config.shopScoreAddRate + '订单金额' + amount + '货币类型' + currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                    });
                                } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                    CacheUtil.addDiamond(userId, Number(totalVal), TypeEnum.DiamondChangeType.storeBuy, (code, currDiamond) => {
                                        log.info(userId + '购买成功，增加'+ totalVal +'钻石,当前钻石:' + currDiamond)
                                    })
                                }
                                // 查询是否购买首充礼包
                                dao.searchFirstRecharge(userId, row => {
                                    // 查询当前金
                                    const result = {
                                        vipLevel: currVipLevel,
                                        addVipPoint: addVipPoint,
                                        firstRecharge: row.firstRecharge ? row.firstRecharge : 0,
                                        goodsType: goodsType,
                                        sourceVal: sourceVal,
                                        addVal: addVal,
                                        totalVal: totalVal,
                                        shopScoreAddRate: config.shopScoreAddRate,
                                        shopType: TypeEnum.ShopType.store,
                                        silverCoin: silverCoin
                                    }
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                })
                            })
                        });
                    })
                })
            } catch (e) {
                log.err(e)
                callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
            }
        }

        // 增加银币-通过活动奖池发奖励
        this.addSilverCoinFromJackpot = function (userId, silverCoin, type, callback){
            log.info(userId + '增加银币-通过活动奖池发奖励,发放类型:' + type + '数量:' + silverCoin)
            CacheUtil.addSilverCoin(userId, silverCoin, type, (code, currSilverCoin)=>{
                if(this.userList[userId]){
                    this.userList[userId].silverCoin = StringUtil.addNumbers(this.userList[userId].silverCoin, silverCoin)
                }
                callback(code, currSilverCoin)
            })
        }

        // 增加银币
        this.addSilverCoin = function (userId, silverCoin, type){
            CacheUtil.addSilverCoin(userId, silverCoin, type, ret=>{
                if(this.userList[userId]){
                    this.userList[userId].silverCoin = StringUtil.addNumbers(this.userList[userId].silverCoin, silverCoin)
                }
            })
        }


        // 减少银币
        this.reduceSilverCoin = function (userId, silverCoin, type, callback){
            CacheUtil.reduceSilverCoin(userId, silverCoin, type, (code,beforeSilverCoin, currSilverCoin)=>{
                if(code){
                    if(this.userList[userId]){
                        this.userList[userId].silverCoin = StringUtil.reduceNumbers(this.userList[userId].silverCoin, silverCoin)
                    }
                }
                callback(code,beforeSilverCoin, currSilverCoin)
            })
        }

        this.addVipScore = function (userId, amount, callback){
            CacheUtil.getVConfig().then(vConfig => {
                // 充值获得VIP积分百分比
                const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                // 增加VIP积分(VIP点数)
                let addVipPoint = Number(amount * recharge_vip_socre_percentage / 100);
                dao.addVipScore(userId, addVipPoint, ret =>{
                    log.info(userId + '增加VIP点数' + addVipPoint);
                })
            })
        }

        // 免费转盘购买回调
        this.freeTurntableBuyCallback = function (userId, orderId, mul, amount, currencyType, shopType, service, serverId, payStatus, silverCoin, callback) {
            const self = this;
            let addVipPoint = 0;
            self.turntableCharge(userId, mul, (code, msg, data) => {
                if (code) {
                    // 更新订单状态
                    dao.updateOrder(userId, orderId, payStatus,ret => {
                        CacheUtil.getVConfig().then(vConfig => {
                            // 充值获得VIP积分百分比
                            const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                            // 游戏有效投注获得VIP积分百分比
                            const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                            // 增加VIP积分(VIP点数)
                            addVipPoint = StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);
                            // 发银币
                            self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.turntableBuy, ret =>{
                                log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);
                            })
                            CacheUtil.getScoreConfig().then(scoreConfig => {
                                const score_amount_ratio = scoreConfig.score_amount_ratio
                                // 充值统计VIP升级
                                self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                                })
                            })
                        })
                    })
                }
                data.silverCoin = undefined;
                data.silverCoin = silverCoin;
                data.addVipPoint = undefined;
                data.addVipPoint = addVipPoint;
                callback(code, msg, data, shopType, service, serverId)
            });
        }

        this.firstRechargeBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, silverCoin, callback) {
            let sourceVal = 0; // 原价金币数量
            let addVal = 0; // 增加金币数量
            let totalVal = 0; // 总金币数量
            const self = this;
            self.getVipLevel(userId, vipLevel => {
                try {
                    CacheUtil.getVConfig().then(vConfig => {
                        // 充值获得VIP积分百分比
                        const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                        // 游戏有效投注获得VIP积分百分比
                        const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                        // 增加VIP积分(VIP点数)
                        let addVipPoint =  StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);
                        CacheUtil.getScoreConfig().then(scoreConfig => {
                            const score_amount_ratio = scoreConfig.score_amount_ratio
                            // 充值统计VIP升级
                            self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                                const config = self.getVipConfigByLevel(vConfig.levelConfig, currVipLevel)
                                // 购买金币
                                if (TypeEnum.GoodsType.gold === goodsType) {
                                    // 充值得到的金币
                                    sourceVal = val;
                                    totalVal = val;
                                } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                    sourceVal = val;
                                    totalVal = sourceVal;
                                }

                                dao.updateFirstRecharge(userId, ret => {
                                    if (ret) {
                                        if (self.userList[userId] && group === TypeEnum.ShopGroupType.rechargeGift && !self.userList[userId].firstRecharge) {
                                            // 更新为已购买首充礼包
                                            self.userList[userId].firstRecharge = 1;
                                        }
                                        // 更新订单状态
                                        dao.updateOrder(userId, orderId, payStatus, ret => {
                                            if (TypeEnum.GoodsType.gold === goodsType) {
                                                CacheUtil.addGoldCoin(userId, Number(totalVal), TypeEnum.ScoreChangeType.firstRechargeBuy, (ret, currGoldCoin) => {
                                                    log.info(userId + '当前VIP等级:' + currVipLevel + '金币加成率:' + config.shopScoreAddRate + '订单金额' + amount + '货币类型' + currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                                });
                                            } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                                CacheUtil.addDiamond(userId, Number(totalVal), TypeEnum.DiamondChangeType.firstRechargeBuy, (code, currDiamond) => {
                                                    log.info(userId + '购买成功，增加'+ totalVal +'钻石,当前钻石:' + currDiamond)
                                                })
                                            }
                                            // 发银币
                                            self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.firstRechargeBuy)
                                            log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);
                                            // 查询是否购买首充礼包
                                            dao.searchFirstRecharge(userId, row => {
                                                // 查询当前金
                                                const result = {
                                                    vipLevel: currVipLevel,
                                                    addVipPoint: addVipPoint,
                                                    firstRecharge: row.firstRecharge ? row.firstRecharge : 0,
                                                    goodsType: goodsType,
                                                    sourceVal: sourceVal,
                                                    addVal: addVal,
                                                    totalVal: totalVal,
                                                    shopScoreAddRate: config.shopScoreAddRate,
                                                    shopType: TypeEnum.ShopType.firstRecharge,
                                                    silverCoin: silverCoin
                                                }
                                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                            })
                                        })
                                    } else {
                                        callback(0, '购买首充失败')
                                    }
                                })
                            });
                        })
                    })
                } catch (e) {
                    log.err(e)
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }


        this.monthCardGoodsBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payStatus, silverCoin, callback){
            let sourceVal = 0; // 原价金币数量
            let addVal = 0; // 增加金币数量
            let totalVal = 0; // 总金币数量
            const self = this;
            self.getVipLevel(userId, vipLevel => {
                try {
                    CacheUtil.getVConfig().then(vConfig => {
                        // 充值获得VIP积分百分比
                        const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                        // 游戏有效投注获得VIP积分百分比
                        const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                        // 增加VIP积分(VIP点数)
                        let addVipPoint =  StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);
                        CacheUtil.getScoreConfig().then(scoreConfig => {
                            const score_amount_ratio = scoreConfig.score_amount_ratio
                            // 充值统计VIP升级
                            self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                                const config = self.getVipConfigByLevel(vConfig.levelConfig, currVipLevel)
                                // 购买金币
                                if (TypeEnum.GoodsType.gold === goodsType) {
                                    // 充值得到的金币
                                    sourceVal = val;
                                    totalVal = val;
                                } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                    sourceVal = val;
                                    totalVal = sourceVal;
                                }
                                // 发银币
                                self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.monthCardBuy)
                                log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);

                                if (TypeEnum.GoodsType.gold === goodsType) {
                                    CacheUtil.addGoldCoin(userId, Number(totalVal), TypeEnum.ScoreChangeType.monthCardBuy, (ret, currGoldCoin) => {
                                        log.info(userId + '当前VIP等级:' + currVipLevel + '金币加成率:' + config.shopScoreAddRate + '订单金额' + amount + '货币类型' + currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                    });
                                } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                    CacheUtil.addDiamond(userId, Number(totalVal), TypeEnum.DiamondChangeType.firstRechargeBuy, (code, currDiamond) => {
                                        log.info(userId + '购买成功，增加'+ totalVal +'钻石,当前钻石:' + currDiamond)
                                    })
                                }
                                // 更新订单状态
                                dao.updateOrder(userId, orderId, payStatus, ret => {
                                    // 设置月卡持续奖励
                                    self.setFirstRechargeContinueReward(userId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays)
                                    const data = {goodsType: goodsType, val: val, shopType: TypeEnum.ShopType.month_card_goods, silverCoin: silverCoin, addVipPoint: addVipPoint}
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data, TypeEnum.ShopType.month_card_goods, service, serverId)
                                })
                            })
                        })
                    })
                } catch (e) {
                    log.err(e)
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }


        // 设置月卡持续奖励
        this.setFirstRechargeContinueReward = function (userId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays){
            const currentDate = new Date();
            const currentDateTimestamp = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
            for(let i = 1; i <= buyContinueDays; i ++){
                const rewardDateTimestamp = currentDateTimestamp + i * 24 * 60 * 60 * 1000;
                log.info(userId + '购买月卡礼包,持续奖励日:' + new Date(rewardDateTimestamp))
                dao.firstRechargeAwardRecord(userId, buyContinueRewardGold, buyContinueRewardDiamond, rewardDateTimestamp, ret =>{})
            }
        }


        this.discountLimitedBuyCallback = function (userId, orderId, amount, currencyType, service, serverId, goodsType, val, currScore, payStatus, silverCoin, callback) {
            const self = this;
            CacheUtil.addGoldCoin(userId, Number(val), TypeEnum.ScoreChangeType.discountLimitedBuy, (ret, currGoldCoin) => {
                // 更新订单状态
                dao.updateOrder(userId, orderId, payStatus,ret => {
                    CacheUtil.getVConfig().then(vConfig => {
                        // 充值获得VIP积分百分比
                        const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                        // 游戏有效投注获得VIP积分百分比
                        const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                        // 增加VIP积分(VIP点数)
                        let addVipPoint = StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);
                        // 发银币
                        self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.discountLimitedBuy)
                        log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);

                        CacheUtil.getScoreConfig().then(scoreConfig => {
                            const score_amount_ratio = scoreConfig.score_amount_ratio
                            // 充值统计VIP升级
                            self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                            })
                        })
                    })
                    const data = {goodsType: goodsType, val: val, shopType: TypeEnum.ShopType.discount_Limited, silverCoin: silverCoin}
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data, TypeEnum.ShopType.discount_Limited, service, serverId)
                })
            });
        }

        this.withdrawGoodsBuyCallback = function (userId, orderId,  amount, currencyType, service, serverId, goodsType, val, currScore, payStatus, silverCoin, callback) {
            const self = this;
            CacheUtil.addGoldCoin(userId, Number(val), TypeEnum.ScoreChangeType.withdrawGoodsBuy, (ret, currGoldCoin) => {
                let addVipPoint = 0;
                // 更新订单状态
                dao.updateOrder(userId, orderId, payStatus,ret => {
                    CacheUtil.getVConfig().then(vConfig => {
                        // 充值获得VIP积分百分比
                        const recharge_vip_socre_percentage = vConfig.recharge_vip_socre_percentage;
                        // 游戏有效投注获得VIP积分百分比
                        const flow_vip_socre_percentage = vConfig.flow_vip_socre_percentage;
                        // 增加VIP积分(VIP点数)
                        addVipPoint = StringUtil.rideNumbers(amount, recharge_vip_socre_percentage / 100, 2);
                        // 发银币
                        self.addSilverCoin(userId, silverCoin, TypeEnum.SilverCoinChangeType.withdrawGoodsBuy)
                        log.info(userId + '充值成功' + amount + '金额,获得VIP点数:' + addVipPoint + '发银币:' + silverCoin);
                        CacheUtil.getScoreConfig().then(scoreConfig => {
                            const score_amount_ratio = scoreConfig.score_amount_ratio
                            // 充值统计VIP升级
                            self.rechargeCount(userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, currVipLevel => {
                                dao.unLockWithdrawPage(userId, code =>{
                                    if(code){
                                        log.info('解锁提现页成功')
                                    }
                                })
                            })
                        })
                    })
                    const data = {goodsType: goodsType, val: val, shopType: TypeEnum.ShopType.withdraw_goods, silverCoin: silverCoin, addVipPoint: addVipPoint}
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data, TypeEnum.ShopType.withdraw_goods, service, serverId)
                })
            });
        }


        // 获取VIP等级
        this.getVipLevel = function (userId, callback) {
            dao.getVipLevel(userId, (row, vipLevel) => {
                callback(vipLevel)
            })
        }

        // 获取是否购买过首充商品
        this.buyFirstRecharge = function (userId, callback) {
            try {
                if (this.IsPlayerOnline(userId)) {
                    const firstRecharge = this.userList[userId].firstRecharge;
                    callback(firstRecharge)
                } else {
                    dao.searchFirstRecharge(userId, row => {
                        const firstRecharge = row.firstRecharge;
                        callback(firstRecharge)
                    })
                }
            } catch (e) {
                callback(1)
            }
        }

        // 兑换礼物
        this.exchangeGift = function (socket, cdkey, callback) {
            const userId = socket.userId;
            // 是否存在
            ymDao.cdKeySearch(cdkey, row => {
                if (row) {
                    if (row.status === 1) {
                        callback(ErrorCode.CDK_USERED_ERROR.code, ErrorCode.CDK_USERED_ERROR.msg)
                        return;
                    }
                    // 更新兑换卷状态=已使用
                    ymDao.cdKeyGet(userId, cdkey, r => {
                        if (r) {
                            const result = {
                                vipLevel: this.userList[userId].vip_level,
                                goodsType: [TypeEnum.GoodsType.gold, TypeEnum.GoodsType.diamond],
                                sourceVal: [10000, 10]
                            }
                            callback(1, ErrorCode.SUCCESS.msg, result)
                        } else {
                            callback(0, ErrorCode.ERROR.msg)
                        }
                    });
                } else {
                    callback(ErrorCode.CDK_EXPIRE.code, ErrorCode.CDK_EXPIRE.msg)
                }
            })
        }

        // VIP领取金币
        this.vipGetGold = function (userId, type, callback) {
            const self = this;
            const vipLevel = this.userList[userId].vip_level;
            CacheUtil.getVipConfig().then(config => {
                const currConfig = config.find(item => item.level === vipLevel);
                if (!this.userList[userId].is_vip) {
                    callback(0, "非VIP不能领取")
                    return;
                }

                if (type === TypeEnum.VipGetGoldType.dailyGet) { //  每日领取
                    CacheUtil.isVIPDailyGet(userId, dailyGet => {
                        if (dailyGet) {
                            callback(0, "不要重复领取")
                            return
                        }
                        CacheUtil.VIPDailyGet(userId, ret => {
                            if (ret) {
                                self.addSilverCoinFromJackpot(userId, Number(currConfig.dailyGetGold), TypeEnum.SilverCoinChangeType.vipDaylyGet, (ret, currSilverCoin) => {
                                    log.info(userId + 'VIP每日领取银币:' + currConfig.dailyGetGold + 'VIP等级' + vipLevel + '领取后银币:' + currSilverCoin)
                                });
                                callback(1, ErrorCode.SUCCESS.msg, {type: TypeEnum.GoodsType.silverCoin})
                            } else {
                                callback(0, ErrorCode.ERROR.msg)
                            }
                        })
                    })
                } else if (type === TypeEnum.VipGetGoldType.monthlyGet) {  // 每月领取
                    CacheUtil.isVIPMonthlyGet(userId, monthlyGet => {
                        if (monthlyGet) {
                            callback(0, "不要重复领取")
                            return
                        }
                        CacheUtil.VIPMonthlyGet(userId, ret => {
                            if (ret) {
                                self.addSilverCoinFromJackpot(userId, Number(currConfig.monthlyGetGold), TypeEnum.SilverCoinChangeType.vipMonthlyGet, (ret, currSilverCoin) => {
                                    log.info(userId + '每月领取银币:' + currConfig.monthlyGetGold + 'VIP等级' + vipLevel + '领取后银币:' + currSilverCoin)
                                });
                                callback(1, ErrorCode.SUCCESS.msg, {type: TypeEnum.GoodsType.silverCoin})
                            } else {
                                callback(0, ErrorCode.ERROR.msg)
                            }
                        })
                    })
                } else {
                    callback(0, ErrorCode.ERROR.msg)
                }
            })
        };


        // 查询能领取多少金币
        this.vipGetGoldDetail = function (socket) {
            const vipLevel = this.userList[socket.userId].vip_level;

            CacheUtil.getVipConfig().then(config => {
                const currConfig = config.find(item => item.level === vipLevel);
                CacheUtil.isVIPDailyGet(socket.userId, dailyGet => {
                    CacheUtil.isVIPMonthlyGet(socket.userId, monthlyGet => {
                        const result = {
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


        this.loginSwitch = function (user, socket, callback) {
            const self = this;
            if(user.token) {
                log.info("通过缓存的token登录" + user.uid);
                const login_token_key  = 'login_token_key:';
                RedisUtil.get(login_token_key + user.token).then(userId =>{
                    if(userId){
                        user.id = userId;
                        dao.tokenLogin(user, socket, callback);
                    }else {
                        callback(ErrorCode.LOGIN_TOKEN_NOT_FOUND.code, ErrorCode.LOGIN_TOKEN_NOT_FOUND.msg);
                    }
                });
            }else if(user.userName && user.sign) {
                log.info("游客账户密码登录:" + user.userName);
                dao.pwdLogin(user, socket, callback);
            }else if(user.uid){
                // google登录
                log.info("google登录" + user.uid);
                dao.googleLogin(user, socket, (code, msg, data) => {
                    if(code === ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code){
                        // 生成账户密码
                        const time = StringUtil.generateTime();
                        const account = StringUtil.generateAccount('ABC', time);
                        const king = StringUtil.generateKing();
                        const nickname = StringUtil.generateNickName(time);
                        const pwd = StringUtil.pwdEncrypt(account, king);
                        // 账户不存在 进行注册
                        dao.registerByGoogle(user, account, pwd, nickname, king, (rows) =>{
                            if (rows) {
                                log.info('google注册成功' + user.uid);
                                // 设置邀请码
                                self.setInviteCode(rows.Id);
                                rows.register = 1; // 注册标识
                                callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows);
                            }else{
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg);
                            }
                        });
                    }else{
                        callback(code, msg, data);
                    }
                });
            }else if(user.email && user.code) {
                log.info("邮箱登录" + user.email + '验证码:' + user.code);
                self.verifyEmailCode(user.email, user.code, (code, msg) => {
                    if(code === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                        // 邮箱登录
                        dao.emailLogin(user, socket, (code, msg, data) =>{
                            if(code === ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code){
                                // 生成账户密码
                                const time = StringUtil.generateTime();
                                const account = StringUtil.generateAccount('ABC', time);
                                const king = StringUtil.generateKing();
                                const nickname = StringUtil.generateNickName(time);
                                const pwd = StringUtil.pwdEncrypt(account, king);
                                // 通过邮箱注册
                                dao.registerByEmail(socket, user.email, account, pwd, nickname, king, (rows) => {
                                    if (rows) {
                                        log.info('邮箱注册成功' + user.email);
                                        // 设置邀请码
                                        self.setInviteCode(rows.Id);
                                        rows.register = 1; // 注册标识
                                        callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows);
                                    }else{
                                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg);
                                    }
                                });
                            }else{
                                callback(code, msg, data);
                            }
                        })
                    }
                })
            }
        }



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
            CacheUtil.getSignInConfig().then(config => {

                // 查询当前用户签到第几天了
                dao.searchUserSignIn(socket.userId, (rows) => {
                    if (!rows || rows.length === 0) { // 报错或者从未签到过
                        let currSignInFlag = 0;
                        // 当日未签到
                        const signInConfig = config.map(item => {
                            let signInFlag = 0;
                            return {
                                id: item.id,
                                award: item.award,
                                valRatio: item.valRatio,
                                signInFlag: signInFlag
                            }
                        });
                        // 没签到过
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, {
                            currSignInFlag: currSignInFlag,
                            signInConfig
                        })
                        return;
                    }
                    // 获取当前日期时间戳
                    const lastSignInDate = rows[0].last_sign_in_date;
                    const consecutiveDays = rows[0].consecutive_days;
                    let currSignInFlag = 0;
                    if (StringUtil.currDateTime() === lastSignInDate) {
                        // 当日已签到
                        currSignInFlag = 1;
                    }
                    // 当日已签到
                    const signInConfig = config.map(item => {
                        let signInFlag = 0;
                        if (consecutiveDays === 7 && StringUtil.currDateTime() > lastSignInDate) {
                            signInFlag = 0;
                        }else if(consecutiveDays === 7 && StringUtil.currDateTime() === lastSignInDate){
                            signInFlag = 1;
                        } else {
                            if (consecutiveDays >= item.id) {
                                signInFlag = 1;
                            }
                        }
                        return {
                            id: item.id,
                            award: item.award,
                            valRatio: item.valRatio,
                            signInFlag: signInFlag,
                        }
                    });
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, {
                        currSignInFlag: currSignInFlag,
                        signInConfig
                    })
                });
            });
        }

        // 用户签到
        this.signIn = function (socket, callback) {
            const userId = socket.userId;
            const currDate = StringUtil.currDateTime();
            dao.searchUserSignIn(userId, (rows) => {
                if (!rows) {
                    callback(0, '数据库操作异常')
                    return;
                }
                if (rows.length === 0) {
                    // 首次签到
                    dao.userFirstSignIn(userId, currDate, (code) => {
                        if (code) {
                            this.signReward(userId, 1)
                            callback(1, '签到成功')
                        } else {
                            callback(0, '数据库操作异常')
                        }
                    })
                    return;
                }
                const lastSignInDate = rows[0].last_sign_in_date;
                if (lastSignInDate === currDate) {
                    callback(0, '重复签到')
                    return;
                }
                const consecutiveDays = rows[0].consecutive_days;
                if (consecutiveDays < 7) { // 没签满七天
                    dao.userKeepSignIn(userId, currDate, consecutiveDays, (code) => {
                        if (code) {
                            this.signReward(userId, parseInt(StringUtil.addNumbers(consecutiveDays, 1)))
                            callback(1, '签到成功')
                        } else {
                            callback(0, '数据库操作异常')
                        }
                    })
                } else { // 签到满7天,再进行下一轮签到
                    dao.userResetSignIn(userId, currDate, (code) => {
                        if (code) {
                            this.signReward(userId, 7)
                            callback(1, '签到成功')
                        } else {
                            callback(0, '数据库操作异常')
                        }
                    })
                }
            })
        }

        // 签到奖励
        this.signReward = function (userId, consecutiveDays) {
            const self = this;
            CacheUtil.getSignInConfig().then(config => {
                const signInConfig = config.find(item => item.id === consecutiveDays);
                const level = this.userList[userId].vip_level;
                CacheUtil.getVipConfig().then(vipConfig => {
                    const currVipConfig = vipConfig.find(item => item.level === level);
                    for (let i = 0; i < signInConfig.award.length; i++) {
                        if (signInConfig.award[i].type === TypeEnum.GoodsType.silverCoin) {
                            const addScore = StringUtil.rideNumbers(signInConfig.award[i].val, currVipConfig.dailySignScoreAddRate / 100, 2);
                            // 发放银币
                            self.addSilverCoinFromJackpot(userId, addScore, TypeEnum.SilverCoinChangeType.daySign, (ret, currSilverCoin) => {
                                log.info(userId + '签到第' + consecutiveDays + '天,未加成前领取银币' + signInConfig.award[i].val + '加成百分比' + currVipConfig.dailySignScoreAddRate)
                            });
                        } else if (signInConfig.award[i].type === 1) {
                            // 发放钻石
                        }
                    }
                })
            })
        }

        // 获取大厅幸运币详情页
        this.getHallLuckyPageDetail = function (socket) {
            const self = this;
            CacheUtil.getSilverCoinJackpot(activityJackpot => {
                // 获取幸运币配置
                self.getTurntableJackpot(activityJackpot, turntableJackpot => {
                    self.getLuckGlodJackpot(activityJackpot, luckGlodJackpot => {
                        const now = new Date().getTime();
                        CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                            CacheUtil.getActivityLuckyDetailByUserId(socket.userId, ret => {
                                if (ret) {
                                    const luckyCoin = ret.luckyCoin;
                                    const luckyCoinGetStatus = ret.luckyCoinGetStatus;
                                    const doLuckyCoinTask = ret.doLuckyCoinTask;
                                    const luckyRushStartTime = ret.luckyRushStartTime;
                                    const luckyRushEndTime = ret.luckyRushEndTime;
                                    const luckyCoinTaskStatus = ret.luckyCoinTaskGetStatus;
                                    const currCoinCount = ret.currCoinCount;

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
                                        luckyCoin: luckyCoin, // 当前用户幸运币个数
                                        currCoinCount: currCoinCount, // 已经领取幸运币数量
                                        maxCoinCount: luckyCoinConfig.luckyCoinGetLimit // 最大领取幸运币数量
                                    }
                                    socket.emit('hallLuckyPageDetailResult', {code: 1, data: data});
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
            const self = this;

            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                CacheUtil.getActivityLuckyDetailByUserId(userId, ret => {
                    if (ret) {
                        const luckyCoin = ret.luckyCoin; // 当前拥有的幸运币
                        const currCoinCount = ret.currCoinCount; // 当日已领取幸运币
                        const luckyCoinGetStatus = ret.luckyCoinGetStatus;
                        const luckyCoinTaskGetStatus = ret.luckyCoinTaskGetStatus;
                        const luckyGoldGetTime = ret.luckyGoldGetTime;
                        const now = new Date().getTime();


                        CacheUtil.getSilverCoinJackpot(activityJackpot => {
                            self.getLuckGlodJackpot(activityJackpot, luckGlodJackpot => {
                                let getFlag = false;
                                const canGetluckyCoin = currCoinCount < luckyCoinConfig.luckyCoinGetLimit;
                                if (canGetluckyCoin) {
                                    // 更新状态
                                    if (type === 0 && luckyCoinGetStatus) {
                                        // 间隔时间领取幸运币
                                        ret.luckyCoinGetStatus = 0;
                                        // 更新领取时间
                                        ret.luckyRushStartTime = now;
                                        ret.luckyRushEndTime = now + luckyCoinConfig.luckyRushTime * 60 * 1000;
                                        // 领取币+1
                                        ret.luckyCoin += 1;
                                        ret.pushStatus = 1; // 可推送状态
                                        ret.currCoinCount += 1;
                                        // 领取幸运币
                                        log.info(userId + '间隔时间领取幸运币，累计领取:' + ret.luckyCoin + '领取上限数量:' + luckyCoinConfig.luckyCoinGetLimit);
                                        getFlag = true;
                                    } else if (type === 1 && luckyCoinTaskGetStatus) {
                                        // 做完任务领取幸运币
                                        ret.luckyCoinTaskGetStatus = 0;
                                        // 任务可以重做
                                        ret.doLuckyCoinTask = 0;
                                        // 领取币+1
                                        ret.luckyCoin += 1;
                                        ret.pushStatus = 1; // 可推送状态
                                        ret.currCoinCount += 1;
                                        // 领取幸运币
                                        log.info(userId + '做完任务领取幸运币，领取前数量:' + luckyCoin + '领取上限数量:' + luckyCoinConfig.luckyCoinGetLimit);
                                        getFlag = true;
                                    }
                                }
                                const luckGoldResult = {
                                    GoodsType: 0,
                                    val: 0
                                }
                                // 领取幸运金币
                                if (!luckyGoldGetTime || now > luckyGoldGetTime || canGetluckyCoin) {
                                    // 幸运金可领取时间
                                    ret.luckyGoldGetTime = now + luckyCoinConfig.luckyRushTime * 60 * 1000;
                                    const glod = StringUtil.rideNumbers(luckGlodJackpot, 0.5, 2);
                                    let num = StringUtil.rideNumbers(Math.random() , 0.1, 2);
                                    const luckyScore = StringUtil.rideNumbers(num === 0 ? 0.01 : num, glod, 2);
                                    // 幸运金奖池-发放幸运金
                                    self.addSilverCoinFromJackpot(userId, luckyScore, TypeEnum.SilverCoinChangeType.luckyCoinGive, (r, currSilverCoin) => {
                                        log.info(userId + '领取幸运银币:' + luckyScore + '当前已领幸运币:' + ret.luckyCoin);
                                    });
                                    luckGoldResult.val = luckyScore;
                                    getFlag = true;
                                }
                                if (!getFlag) {
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                    return;
                                }
                                // 更新用户状态
                                CacheUtil.updateActivityLuckyConfig(userId, ret).then(result => {
                                    if (result) {
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, luckGoldResult)
                                    } else {
                                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                    }
                                });
                            })
                        })
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
                CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                    CacheUtil.getSilverCoinJackpot(activityJackpot => {

                        self.getTurntableJackpot(activityJackpot, turntableJackpot => {
                            self.getBaseMul(userId, activityJackpot, null, baseMul => {

                                CacheUtil.getTurntableConfig().then(config => {
                                    const iconInfos = config.icon_mul;

                                    let ret = {};
                                    if (val) {
                                        // 付费转盘
                                        ret = {
                                            baseMul: baseMul,
                                            turntableJackpot: turntableJackpot,
                                            iconInfos: iconInfos,  // 获取转盘的格子
                                            turntableBuyMulPrice: luckyCoinConfig.turntableBuyMulPrice,
                                        }
                                    } else {
                                        // 免费转盘
                                        ret = {
                                            baseMul: baseMul,
                                            turntableJackpot: turntableJackpot,
                                            iconInfos: iconInfos
                                        }
                                    }
                                    socket.emit('luckyCoinDetailResult', {code: 1, data: ret});
                                })
                            });
                        })
                    })
                });
            } catch (e) {
                log.err('getLuckyCoinDetail' + e);
                socket.emit('luckyCoinDetailResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
            }
        }


        // 收费转盘
        this.turntableCharge = function (userId, mul, callback) {
            const self = this;
            redis_laba_win_pool.get_redis_win_pool().then(async function (jackpot) {
                // 活动奖池
                self.turntable(userId, mul, (code, msg, data) => {
                    callback(code, msg, data)
                });
            });
        }


        // 转动转盘
        this.turntable = function (userId, betMul, callback) {
            const self = this;

            CacheUtil.getTurntableConfig().then(config => {
                try {
                    if (!config) {
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
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

                    CacheUtil.getSilverCoinJackpot(activityJackpot => {
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
                                        nBetTime: Number(new Date()), // 下注时间
                                        shopType: EnumType.ShopType.free_turntable
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
                                    self.addSilverCoinFromJackpot(userId, win, TypeEnum.SilverCoinChangeType.turntable, (ret, currSilverCoin) => {
                                        log.info('大厅转盘活动' + userId + "赢" + win + "剩余奖池" + StringUtil.toFixed(turntableJackpot, 2) + '当前银币:' + currSilverCoin)
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                    });
                                } else {
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                }
                            })();
                        });
                    })
                } catch (e) {
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
                self.getBaseMul(userId, activityJackpot, dictAnalyseResult, baseMul => {

                    self.getTurntableGameAddRate(userId, turntableGameAddRate => {

                        CacheUtil.getTurntableConfig().then(config => {
                            const iconInfos = config.icon_mul;
                            try {
                                // 奖金币 = 基础倍数 * 中奖倍数 * VIP转盘加成 * 下注倍数
                                const win = StringUtil.toFixed(baseMul * iconInfos[winIndex] * turntableGameAddRate * betMul, 2);

                                dictAnalyseResult["baseMul"] = baseMul;
                                dictAnalyseResult["iconMul"] = iconInfos[winIndex];
                                dictAnalyseResult["turntableGameAddRate"] = turntableGameAddRate;
                                log.info('转盘获得金币:' + win + '免费转盘基础倍数:'+ baseMul + '赢倍数:'+ iconInfos[winIndex] + '转盘加成:'+ turntableGameAddRate + '下注倍数:'+ betMul)
                                resolve(win);
                            } catch (e) {
                                reject(e);
                            }
                        })

                    });
                });
            });
        }


        this.getBaseMul = function (userId, activityJackpot, dictAnalyseResult, callback) {
            try {
                const self = this;
                // 获取VIP最大加成
                self.getMaxTurntableGameAddRate(maxTurntableGameAddRate => {
                    self.getTurntableJackpot(activityJackpot, turntableJackpot => {
                        CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                            const maxItem = luckyCoinConfig.turntableBuyMulPrice.reduce((max, current) => (current.mul > max.mul ? current : max), luckyCoinConfig.turntableBuyMulPrice[0]);
                            const maxBuyMul = maxItem.mul;
                            CacheUtil.getTurntableConfig().then(config => {
                                const iconInfos = config.icon_mul;
                                const turntableMaxMul = Math.max(...iconInfos);

                                if (dictAnalyseResult) {
                                    dictAnalyseResult['activityJackpot'] = activityJackpot;
                                    dictAnalyseResult['turntableJackpot'] = turntableJackpot;
                                    dictAnalyseResult['turntableMaxMul'] = turntableMaxMul;
                                    dictAnalyseResult['maxTurntableGameAddRate'] = maxTurntableGameAddRate;
                                    dictAnalyseResult['maxBuyMul'] = maxBuyMul;
                                }
                                // 转盘奖池基础倍数(向下取整) = 转盘奖池/转盘最大倍数/最大购买倍数
                                const baseMul = StringUtil.divNumbers(StringUtil.divNumbers(turntableJackpot, turntableMaxMul, 2), maxBuyMul, 2)
                                log.info(userId + '计算转盘基础倍数 活动奖池:' + activityJackpot + '转盘奖池:' + turntableJackpot + '转盘最大倍数:'+ turntableMaxMul + '基础倍数:' + baseMul)
                                callback(baseMul);
                            })
                        });
                    });
                });
            } catch (e) {
                log.err(e)
                callback(0)
            }
        }

        this.getTurntableGameAddRate = function (userId, callback) {
            // 获取VIP转盘加成
            dao.getVipLevel(userId, (code, vipLevel) => {
                CacheUtil.getVipConfig().then(vipConfig => {
                    const c = vipConfig.find(item => item.level === vipLevel).turntableGameAddRate;
                    const turntableGameAddRate = c ? (c / 100) : 1;
                    callback(turntableGameAddRate);
                }).catch(e => {
                    log.err(e)
                    callback(1);
                })
            })
        }

        this.getMaxTurntableGameAddRate = function (callback) {
            try {
                CacheUtil.getVipConfig().then(config => {
                    // 获取VIP转盘最大加成
                    const maxItem = config.reduce((max, current) => (current.turntableGameAddRate > max.turntableGameAddRate ? current : max), config[0]);
                    const maxTurntableGameAddRate = maxItem.turntableGameAddRate;
                    const max = maxTurntableGameAddRate ? (maxTurntableGameAddRate / 100) : 1;
                    callback(max)
                })
            } catch (e) {
                log.err(e)
                callback(1)
            }
        }

        // 获取转盘奖池
        this.getTurntableJackpot = function (activityJackpot, callback) {
            // 获取活动奖励配置
            CacheUtil.getActivitySilverCoinConfig().then(config => {
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
            CacheUtil.getActivitySilverCoinConfig().then(config => {
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
        this.bindInviteCode = function (socket, inviteCode, callback) {
            const self = this;
            dao.existInviteCode(inviteCode, row => {
                const userId = socket.userId;
                if (!row) {
                    // 错误的邀请码
                    callback(ErrorCode.ERROR_INVITE_CODE.code, ErrorCode.ERROR_INVITE_CODE.msg)
                } else if (row.userId === userId) {
                    // 自己的邀请码
                    callback(ErrorCode.ERROR_INVITE_CODE.code, ErrorCode.ERROR_INVITE_CODE.msg)
                } else {
                    ymDao.searchInvite(userId, rw => {
                        if (rw && rw.invitee_uid === row.userId) {
                            // 邀请人的下级
                            callback(ErrorCode.SELF_INVITE_SELF.code, ErrorCode.SELF_INVITE_SELF.msg)
                        } else {
                            const agentUserId = row.userId;
                            // 绑定 事务connection
                            ymDao.bindIniteCode(agentUserId, userId, (row, connection) => {
                                if (row) {
                                    log.info('成功绑定邀请码,代理人:' + agentUserId + '用户:' + userId)
                                    CacheUtil.getDownloadExtConfig().then(downloadExtConfig => {
                                        // 送的数量
                                        const onceMaxAgentReward = downloadExtConfig.reward_agent_once.find(item => item.type === TypeEnum.GoodsType.gold).reward;
                                        const onceMaxInviteeReward = downloadExtConfig.reward_invitee_once.find(item => item.type === TypeEnum.GoodsType.gold).reward;
                                        const inviteeRewardGold = onceMaxInviteeReward ? parseInt(onceMaxInviteeReward) : 0;
                                        const agentRewardGold = onceMaxAgentReward ? parseInt(onceMaxAgentReward) : 0;

                                        // 给代理人增加人头数
                                        this.addInvitedNumber(agentUserId, agentRewardGold, connection, ret => {
                                            if (ret) {
                                                // 提交事务
                                                connection.commit(err => {
                                                    connection.release();
                                                    if (err) {
                                                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                    } else {
                                                        // 给绑定用户立即送银币
                                                        self.addSilverCoinFromJackpot(userId, inviteeRewardGold, TypeEnum.SilverCoinChangeType.inviteBindUser, (ret, currSilverCoin) => {
                                                            log.info('代理' + agentUserId + '邀请用户' + userId + '送给用户银币' + inviteeRewardGold)
                                                        });

                                                        CacheUtil.getCommonCache().then(commonCache =>{
                                                            // 返点记录（代理人金币未领取）
                                                            ymDao.agentRebateRecord(agentUserId, userId, commonCache.currencyType, 0, agentRewardGold, TypeEnum.AgentRebateType.bindInviteCode, TypeEnum.AgentRebateStatus.unissued, insertId => {
                                                                if (insertId) {
                                                                    // 发邮件通知代理人
                                                                    this.saveEmail(LanguageItem.new_hand_bind_title, TypeEnum.EmailType.agent_bind_inform, agentUserId, 0, LanguageItem.new_hand_bind_content, insertId, TypeEnum.GoodsType.silverCoin)
                                                                }
                                                            })
                                                        })
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                                                    }
                                                })
                                            } else {
                                                connection.release();
                                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                            }
                                        });
                                    });
                                } else {
                                    log.info('邀请码重复绑定' + userId + '邀请码:' + inviteCode)
                                    callback(0, '重复绑定')
                                }
                            });
                        }
                    })
                }
            });
        }

        // 增加绑定人头数
        this.addInvitedNumber = function (userId, gold, connection, callback) {
            ymDao.searchCurrDayInvite(userId, ret => {
                if (ret) {
                    // 推广奖励表 增加邀请人数 累计奖励
                    ymDao.addInviteSends(userId, gold, connection, r => {
                        if (r) {
                            callback(1)
                        } else {
                            callback(0)
                        }
                    })
                } else {
                    // 推广奖励表 新增奖励记录
                    ymDao.insertInviteSends(userId, gold, connection, r => {
                        if (r) {
                            callback(1)
                        } else {
                            callback(0)
                        }
                    });
                }
            })
        }


        // 查询绑定的邀请码
        this.searchInvitedCode = function (socket) {
            ymDao.searchInviteUser(socket.userId, row => {
                if (row) {
                    dao.searchInvitedCode(row.invite_uid, ret => {
                        if (ret) {
                            socket.emit('searchInvitedCodeResult', {code: 1, data: {inviteCode: ret.invite_code}});
                        } else {
                            socket.emit('searchInvitedCodeResult', {code: 1, data: {inviteCode: ''}});
                        }
                    })
                } else {
                    socket.emit('searchInvitedCodeResult', {code: 1, data: {inviteCode: ''}});
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
            ymDao.inviteDetail(userId, row => {
                if (row) {
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
            ymDao.searchAgentRebateRecord(socket.userId, row => {
                if (row) {
                    socket.emit('searchAgentRebateRecordResult', {code: 1, data: row});
                } else {
                    socket.emit('searchAgentRebateRecordResult', {code: 1, data: []});
                }
            })
        }

        // 领取返点
        this.getRebate = function (socket, callback) {
            const userId = socket.userId;
            const self = this;
            // 查询未领取的返点
            ymDao.searchInviteSend(userId, row => {
                if (row) {
                    const ids = row.map(item => item.id);
                    let goldSum = row.reduce((accumulator, item) => {
                        return accumulator + item.rebate_glod;
                    }, 0);
                    // 领取返点
                    ymDao.agentUpdateRebateById(ids, TypeEnum.AgentRebateStatus.success, r => {
                        if (r) {
                            // 增加金币 金币流水
                            row.forEach(item => {
                                const rebateGlodCoin = Number(item.rebate_glod);
                                if (item.type === TypeEnum.AgentRebateType.bindInviteCode) {
                                    self.addSilverCoinFromJackpot(userId, rebateGlodCoin, TypeEnum.SilverCoinChangeType.inviteBindAgent, (ret, currSilverCoin) => {
                                        log.info(userId + '领取绑定邀请码返点' + '银币数量:' + item.rebate_glod);
                                    });
                                } else if (item.type === TypeEnum.AgentRebateType.recharge) {
                                    self.addSilverCoinFromJackpot(userId, rebateGlodCoin, TypeEnum.SilverCoinChangeType.rebateShop, (ret, currSilverCoin) => {
                                        log.info(userId + '领取充值返点' + '银币数量:' + item.rebate_glod);
                                    });
                                }
                            })
                            // 记录领取返点记录
                            ymDao.agentGetRebateRecord(socket.userId, goldSum, ret => {
                                if (ret) {
                                    self.searchInvitedDetail(socket.userId, result => {
                                        log.info('领取返点' + userId + '金币总数:' + goldSum);
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result);
                                    });
                                }else{
                                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                }
                            })
                        } else {
                            log.info(userId + '更新代理返点记录状态失败')
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    });
                } else {
                    log.info(userId + '未查询到有待领取的返点')
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }

        // 查询代理人返点记录
        this.searchAgentGetRebateRecord = function (socket) {
            ymDao.searchAgentGetRebateRecord(socket.userId, row => {
                if (row) {
                    socket.emit('getRebateRecordResult', {code: 1, data: row});
                } else {
                    socket.emit('getRebateRecordResult', {code: 1, data: []});
                }
            })
        }


        // 注销账号
        this.logoutAccount = function (socket) {
            dao.logoutAccount(socket.userId, row => {
                if (row) {
                    socket.emit('logoutAccountResult', {code: 1, msg: "成功"});
                } else {
                    socket.emit('logoutAccountResult', {code: 0, msg: "失败"});
                }
            })
        }

        // 客服信息
        this.customerServiceInfo = function (socket) {
            ymDao.searchCustomerServiceInfo(socket.userId, row => {
                if (row) {
                    const ret = row.map(item => {
                        return {
                            id: item.id,
                            name: item.name,
                            email: item.email,
                            url: item.customer_url
                        }
                    });
                    socket.emit('customerServiceInfoResult', {code: 1, data: ret});
                } else {
                    socket.emit('customerServiceInfoResult', {code: 1, data: []});
                }
            })
        }

        //建议反馈
        this.feedback = function (socket, txt, callback) {
            ymDao.insertFeedback(socket.userId, txt, row => {
                if (row) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                } else {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        // 联系我们-问题答案
        this.contactUs = function (socket, callback) {
            ymDao.searchIssue(row => {
                if (row) {
                    callback(ErrorCode.SUCCESS.code, row)
                } else {
                    callback(ErrorCode.SUCCESS.code, [])
                }
            })
        }


        // 设置语言
        this.setLang = function (socket, language) {
            dao.updateLang(socket.userId, language, ret => {
                if (ret) {
                    this.userList[socket.userId].language = language;
                    socket.emit('langResult', {code: 1, msg: "成功"});
                } else {
                    socket.emit('langResult', {code: 0, msg: "失败"});
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
                if (gameScoket) {
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


        // 在大厅的用户，不应该在游戏内 断开游戏连接
        this.existGameDel = function (userId) {
            const gameId = this.userList[userId].getGameId();
            if (gameId) {
                // 在大厅的用户，不应该在游戏内 断开游戏连接
                const gameScoket = ServerInfo.getScoket(gameId);
                log.info('在大厅的用户，不应该在游戏内 断开游戏连接userId', +userId + 'gameId' + gameId);
                if (gameScoket) gameScoket.emit('disconnectUser', {userId: userId});
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
            this.searchEmail(_socket.userId, newList => {
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
            dao.selectEmailTypes(userId, (code, types) => {
                if (code) {
                    // 查询邮件
                    dao.selectEmail(types, userId, (code, res) => {
                        if (code) {
                            for (let i = 0; i < res.length; i++) {
                                emails.push(res[i]);
                            }
                        }
                        callback(emails);
                    });
                } else {
                    callback(emails);
                }
            });
        }
        // 设置邮件已读
        this.setEmailRead = function (_socket, _info) {
            dao.setEmailisRead(_info.id, (code) => {
                if (code) {
                    // 返回已读后邮件
                    this.searchEmail(_socket.userId, newList => {
                        if (newList.length > 0) {
                            _socket.emit('setEmailReadResult', {code: 1, data: newList});
                        } else {
                            _socket.emit('setEmailReadResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };

        // 全部已读
        this.setEmailAllRead = function (userId, callback) {
            dao.setEmailisAlllReadByUserId(userId, code => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(userId, newList => {
                        if (newList.length > 0) {
                            callback(newList);
                        } else {
                            callback([]);
                        }
                    });
                }
            });
        };

        // 全部领取
        this.setEmailAllGet = function (userId, callback) {
            const self = this;
            this.setEmailAllRead(userId, data =>{
                log.info(userId + '全部置为已读');
                // 查询排行榜奖励
                dao.selectEmailRankAwardByUser(userId, rows =>{
                    if(rows){
                        rows.forEach(row =>{
                            const goodsType =  Number(row.goods_type);
                            const val = Number(row.val);
                            const type =  Number(row.type);
                            if(goodsType === 0){
                                let changleType = 0;
                                if(type === TypeEnum.RankType.coin){
                                    changleType = TypeEnum.SilverCoinChangeType.coinRankAward
                                }else if(type === TypeEnum.RankType.bigwin){
                                    changleType = TypeEnum.SilverCoinChangeType.bigWinRankAward
                                }else if(type === TypeEnum.RankType.recharge){
                                    changleType = TypeEnum.SilverCoinChangeType.rechargeRankAward
                                }
                                self.addSilverCoin(userId, val, changleType, ret =>{
                                    log.info(userId + '领取排行榜银币奖励');
                                })
                            }
                        })
                        const ids = rows.map(it => it.id);
                        log.info(userId + '更新邮件排行榜状态ids:' + ids);
                        dao.updateEmailRankAwardStatus(ids, ret =>{})
                    }
                    // 查询月卡持续奖励
                    dao.searchfirstRechargeAwardRecordByUser(userId, rows =>{
                        if(rows){
                            rows.forEach(row =>{
                                const rewardGoldVal = Number(row.rewardGoldVal);
                                const rewardDiamondVal =  Number(row.rewardDiamondVal);
                                CacheUtil.addGoldCoin(userId, rewardGoldVal, TypeEnum.ScoreChangeType.firstRechargeContinueReward, ret =>{
                                    CacheUtil.addDiamond(userId, rewardDiamondVal, TypeEnum.ScoreChangeType.firstRechargeContinueReward, ret =>{
                                        log.info(userId + '领取首充持续奖励');
                                    })
                                })
                            })
                            const ids = rows.map(it => it.id);
                            log.info(userId + '更新邮件首充持续奖励状态ids:' + ids);
                            dao.updateFirstRechargeAwardStatus(ids, ret =>{
                                callback(1)
                            })
                        }else {
                            callback(1)
                        }
                    })
                });
            })
        }


        // 删除指定邮件
        this.delEmailById = function (_socket, id) {
            dao.delEmailById(id, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList => {
                        if (newList.length > 0) {
                            _socket.emit('delEmailByIdResult', {code: 1, data: newList});
                        } else {
                            _socket.emit('delEmailByIdResult', {code: 1, data: []});
                        }
                    });
                }
            });
        };


        // 获取邮件奖励
        this.getEmailAward = function (socket, data) {
            const userId = socket.userId;
            const self = this;

            let awards = []; // 领取的奖励明细
            let len = data.length; // 用户判断多个异步回调成功
            for(let i in data){
                const id = data[i].id; // 邮件ID
                const type = data[i].type; // 邮件类型
                dao.searchUserEmailById(id, userId, row =>{
                    const otherId = row.otherId;
                    switch (type){
                        case TypeEnum.EmailType.rank_award:
                            dao.searchEmailRankAward(otherId, rankRow =>{
                                const rewardGoldVal = rankRow.rewardGoldVal ? Number(rankRow.rewardGoldVal) : 0;
                                const rankType = rankRow.rankType;
                                const status = rankRow.status;
                                if(status === 0){ // 未领取
                                    let changeType;
                                    if(rankType === EnumType.RankType.coin){
                                        changeType = EnumType.SilverCoinChangeType.coinRankAward
                                    }else if(rankType === EnumType.RankType.recharge){
                                        changeType = EnumType.SilverCoinChangeType.rechargeRankAward
                                    }else if(rankType === EnumType.RankType.bigwin){
                                        changeType = EnumType.SilverCoinChangeType.bigWinRankAward
                                    }
                                    dao.updateEmailRankAwardStatus(otherId, ret =>{})
                                    self.addSilverCoin(userId, rewardGoldVal, changeType, ret =>{
                                        awards.push({id: id, type: type, rewardGoldVal: rewardGoldVal, rewardDiamondVal : 0})
                                        -- len;
                                        log.info(userId + '获取排行榜奖励邮件银币:' + rewardGoldVal)
                                        this.getEmailAwardCallBack(len, socket, awards);
                                    })
                                }else{
                                    awards.push({id: id, type: type, rewardGoldVal: 0, rewardDiamondVal : 0})
                                    -- len;
                                    this.getEmailAwardCallBack(len, socket, awards);
                                }
                            });
                            break;
                        case TypeEnum.EmailType.first_recharge_continue_award:
                            dao.searchEmailFirstRechargeAward(otherId, firstRechargeRow =>{
                                const rewardGoldVal = firstRechargeRow.rewardGoldVal;
                                const rewardDiamondVal = firstRechargeRow.rewardDiamondVal;
                                const status = firstRechargeRow.status;
                                if(status === 0){ // 未领取
                                    dao.updateFirstRechargeAwardStatus(otherId, ret =>{})
                                    CacheUtil.addGoldCoin(userId, rewardGoldVal, TypeEnum.ScoreChangeType.firstRechargeContinueReward, ret =>{
                                        log.info(userId + '获取月卡持续奖励邮件金币:' + rewardGoldVal)
                                        self.addSilverCoin(userId, rewardDiamondVal, TypeEnum.SilverCoinChangeType.firstRechargeContinueReward, ret =>{
                                            awards.push({id: id, type: type, rewardGoldVal: rewardGoldVal, rewardDiamondVal : rewardDiamondVal})
                                            --len;
                                            log.info(userId + '获取月卡持续奖励邮件银币:' + rewardDiamondVal)
                                            this.getEmailAwardCallBack(len, socket, awards);
                                        })
                                    })
                                }else{
                                    awards.push({id: id, type: type, rewardGoldVal: 0, rewardDiamondVal : 0})
                                    --len;
                                    this.getEmailAwardCallBack(len, socket, awards);
                                }
                            })
                            break;
                        default:
                            break;
                    }
                })
            }
        }

        this.getEmailAwardCallBack = function (len, socket, awards){
            if(len < 1){
                socket.emit('getEmailAwardResult', awards)
            }
        }

        // 邮件已读全部删除
        this.emailAllDel = function (_socket) {
            dao.delEmailisAlllReadByUserId(_socket.userId, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList => {
                        if (newList.length > 0) {
                            _socket.emit('emailAllDelResult', {code: 1, data: newList});
                        } else {
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


        // 存储打点数据
        this.saveDot = function (userId, adid, gps, apptoken, gameInfo, callback) {
            dao.saveDot(userId, adid, gps, apptoken, gameInfo, callback);
        }

        // 存储打点数据
        this.updateDot = function (userId, adid, gps, apptoken, callback) {
            dao.updateDot(userId, adid, gps, apptoken, callback);
        }


        // 客户端打点
        this.dot = function (userId, key, gps, adid, apptoken, money, dotName, callback) {
            CacheUtil.paySwitch().then(ok =>{
                if(ok){
                    dao.searchDotByUserId(userId, row =>{
                        if(row){
                            money=  !!money ? money : null;
                            gps =  !!gps ? gps : row.gps;
                            adid = !!adid  ? adid : row.adid;
                            apptoken = !!apptoken ? apptoken : row.apptoken;

                            CacheUtil.getCommonCache().then(commonCache =>{
                                if(commonCache.country === TypeEnum.CountryType.bx){
                                    if(key === null){
                                        return;
                                    }
                                    dot.bxDotRequest(gps, adid, apptoken, key, money).then(data =>{
                                        try{
                                            const d = JSON.parse(data);
                                            if(d.status === "OK"){
                                                log.info(userId + '打点成功dotName:' + dotName )
                                                callback(1)
                                            }else{
                                                log.info(userId + '打点失败:' + data)
                                                callback(0)
                                            }
                                        }catch (e){
                                            log.err(userId + '打点异常' + e)
                                            callback(0)
                                        }
                                    });
                                }else if(commonCache.country === TypeEnum.CountryType.yd){
                                    if(dotName === null){
                                        return;
                                    }
                                    dot.ydDotRequest(gps, adid, apptoken, dotName, money).then(data =>{
                                        try{
                                            const d = JSON.parse(data);
                                            if(d.code === 0){
                                                log.info(userId + '打点成功dotName:' + dotName )
                                                callback(1)
                                            }else{
                                                log.info(userId + '打点失败:' + data)
                                                callback(0)
                                            }
                                        }catch (e){
                                            log.err(userId + '打点异常' + e)
                                            callback(0)
                                        }
                                    })
                                }

                            })
                        }else{
                            callback(0)
                        }
                    })
                }else{
                    log.info(userId + '测试环境不支持打点 dotName:' + dotName + ' key:' + key)
                }
            })
        }

        this.searchNotifyMsg = function (){
            return CacheUtil.getNotifyMsg();
        }

        // 更新账户信息
        this.updateAccountByDeviceCode = function (deviceCode, account, callback) {
            dao.updateAccountByDeviceCode(deviceCode, account, callback);
        }

        // 线注对应jackpot
        this.betsJackpot = function (userId, gameId, callback) {
            const serverInfo = ServerInfo.getServerInfoById(gameId);
            if (serverInfo) {
                const gameName = serverInfo.GameName;
                CacheUtil.getGameConfig(gameName, gameId).then(gameConfig => {
                    try{
                        const betsJackpot = gameConfig.betsJackpot;
                        callback(betsJackpot);
                    }catch (e){
                        callback(0);
                    }
                })
            } else {
                callback(0);
            }

        }

        this.searchCoinRank = function (callback){
            dao.searchCoinRank(rows =>{
                if(rows){
                    callback(rows)
                }else{
                    callback([])
                }
            })
        }

        this.searchRechargeRank = function (callback){
            dao.searchRechargeRank(rows =>{
                if(rows){
                    callback(rows)
                }else{
                    callback([])
                }
            })
        }
        this.searchBigWinToday = function (callback){
            dao.searchBigWinToday(rows =>{
                if(rows){
                    callback(rows)
                }else{
                    callback([])
                }
            })
        }


        // 保存新手步数
        this.saveGuideStep = function (userId, step, callback) {
            dao.updateGuideStep(userId, step, row => {
                if (row) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                } else {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            });
        }


        this.saveBankGuideStep = function (userId, step, callback) {
            dao.saveBankGuideStep(userId, step, row => {
                if (row) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                } else {
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
            const userId = socket.userId;
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
        this.bindBankCard = function (userId, account, bankType, name, cpf, ifsc, bankName, callback) {
            dao.addBank(userId, account, name, cpf, bankType, ifsc , bankName, function (result, nickName) {
                if (result) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg);
                } else {
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg);
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

            SendEmail(toEmail, code => {
                if (code) {
                    const verificationCode = code;
                    // const verificationCode = 666666;
                    CacheUtil.cacheEmailExpireCode(verificationCode, toEmail, ret => {
                        if (ret) {
                            // 存储验证码
                            CacheUtil.cacheEmailCode(verificationCode, toEmail, flag => {
                                if (flag) {
                                    log.info('邮箱验证码发送成功' + toEmail + 'code:' + verificationCode);
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                                } else {
                                    log.err('邮箱验证码发送失败' + toEmail);
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                }
                            });
                        } else {
                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                        }
                    });
                }
            });
        };

        // 绑定邮箱验证码
        this.bindEmail = function (socket, email, code, callback) {
            const self = this;
            // 邮箱地址校验
            if (!emailValidator(email)) {
                callback(ErrorCode.EMAIL_INPUT_ERROR.code, ErrorCode.EMAIL_INPUT_ERROR.msg)
                return;
            }
            // 判断邮箱是否绑定
            dao.emailSearch(email, exits => {
                if (exits) {
                    console.log('邮箱已绑定', socket.userId, 'email:', email);
                    callback(ErrorCode.EMAIL_BINDED.code, ErrorCode.EMAIL_BINDED.msg)
                } else {
                    // 验证码校验
                    this.verifyEmailCode(email, code, (c, msg) => {
                        if (c === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code) {
                            // 绑定邮箱
                            dao.emailBind(socket.userId, email, ret => {
                                if (ret) {
                                    // 转正式账号
                                    this.changleOfficial(socket.userId);
                                    const result = {
                                        goodsType: [TypeEnum.GoodsType.silverCoin],
                                        sourceVal: [35]
                                    }
                                    self.addSilverCoinFromJackpot(socket.userId, 35, TypeEnum.SilverCoinChangeType.changleOfficial, ret =>{
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result)
                                    })
                                } else {
                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                }
                            });
                        } else {
                            callback(ErrorCode.EMAIL_CODE_FAILED.code, ErrorCode.EMAIL_CODE_FAILED.msg)
                        }
                    });
                }
            });
        }

        this.changleOfficial = function (userId) {
            // 绑定邮箱成功 转为正式账号
            this.userList[userId]._official = 1;
            dao.changleOfficial(userId, ret => {
                if (ret) {
                    console.log('转正成功', userId)
                }
            })
        }

        // 注册
        this.registerByEmail = function (_socket, email, code, callback) {
            if (isNaN(code)) {
                callback(ErrorCode.EMAIL_CODE_FAILED.code, ErrorCode.EMAIL_CODE_FAILED.msg)
                return;
            }
            this.verifyEmailCode(email, code, (code, msg) => {
                if (code === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code) {
                    //判断邮箱是否注册
                    dao.emailSearch(email, exits => {
                        if (exits) {
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
                        dao.registerByEmail(_socket, email, account, pwd, nickname, king, row => {
                            if (row) {
                                log.info('邮箱注册成功' + email);
                                callback(ErrorCode.REGISTER_SUCCESS.code, ErrorCode.REGISTER_SUCCESS.msg)
                                // 设置邀请码
                                this.setInviteCode(row.Id);
                            } else {
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            }
                        });
                    });
                } else {
                    callback(code, msg)
                }
            });
        }

        this.verifyEmailCode = function (email, code, callback) {
            CacheUtil.verifyEmailCode(code, email, callback);
        }

        // 设置邀请码
        this.setInviteCode = function (userId) {
            try {
                if (!userId) return;
                const inviteCode = HashCodeUtil.generateInviteCode(userId);
                dao.saveInviteCode(userId, inviteCode);
            } catch (e) {
                log.err(userId + '用户初始化邀请码错误' + e)
            }
        }

        this.getServerRank = function (_socket, _info) {
            _socket.emit('getServerRankResult', {Result: 1, msg: "", data: this.gameRank[_info.serverId]});
        };

        this.setServerRank = function (_info) {
            this.gameRank[_info.serverId] = _info;
        };


        this.refreshLuckCoinActivity = function () {
            CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig => {
                CacheUtil.getActivityLuckyDetail(ret => {
                    if (ret) {
                        try {
                            const now = new Date().getTime();
                            // 幸运币刷新时间(毫秒)
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
                                        log.info(userIdKey + '在线玩家推送幸运币可领取状态')
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
                        } catch (e) {
                            log.err(e)
                        }
                    }
                })
            });
        }


        // 离线订单恢复查询
        this.updateOffLineOrder = function () {
            const self = this;
            CacheUtil.paySwitch().then(ok =>{
                if(ok){
                    dao.searchAllOffLineOrder(rows =>{
                        for(const item in rows){
                            const userId = rows[item].userId;
                            const orderId = rows[item].orderId;
                            const payType = rows[item].payType;
                            log.info(userId + '离线订单恢复查询' + orderId)
                            self.intervalSearchOrder(userId, orderId, payType);
                        }
                    })
                }
            })
            // self.intervalSearchOrder(10051, "1713752627131557", 0);
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
                if (users) {
                    for (let i = 0; i < users.length; ++i) {
                        log.info("成功保存离线用户信息" + users[i].id + " bankScore:" + users[i].bankScore + " housecard:" + users[i].housecard + " is_vip:" + users[i].is_vip + " vip_score:" + users[i].vip_score + " firstRecharge:" + users[i].firstRecharge);
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
                /* const seconds = new Date().getSeconds();
                 if(users){
                     for (let i = 0; i < users.length; ++i) {
                         if(seconds % 50 === 0) log.info(users[i].id + "保存用户信息" + JSON.stringify(users[i]));
                     }
                 }
                 saveList = [];*/
            });
        }


        // 商城商品列表
        this.getShoppingGoods = function (userId, callback) {
            CacheUtil.getVConfig().then(config => {
                const ratio = config.recharge_vip_socre_percentage / 100;
                CacheUtil.getShopConfig().then(shopConfig => {
                    try {
                        let result = [];
                        for (let i = 0; i < shopConfig.length; i++) {
                            const item = shopConfig[i];
                            item.vip_score = undefined;
                            // 首充需要增加字段
                            if (item.group === 1) {
                                item.vip_score = StringUtil.rideNumbers(item.target_price, ratio, 2);
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
                            goods: result // 商品列表
                        }

                        if (this.IsPlayerOnline(userId)) {  // 用户在大厅
                            data.firstRecharge = this.userList[userId].firstRecharge;
                            callback(1, ErrorCode.SUCCESS.msg, data)
                        } else { // 用户不在大厅
                            // 查询是否购买过首充商品
                            dao.searchFirstRecharge(userId, rows => {
                                if (rows) {
                                    data.firstRecharge = rows.firstRecharge;
                                }
                                callback(1, ErrorCode.SUCCESS.msg, data)
                            })
                        }
                    } catch (e) {
                        log.err(e)
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    }
                });
            })
        };


        this.getExchangeGoods = function (userId, callback) {
            CacheUtil.getExchangeConfig().then(exchangeConfig => {
                const pairs = [];
                exchangeConfig.forEach(item =>{
                    const goodsId = item.id;
                    pairs.push({userId: userId, goodsId: goodsId})
                })
                dao.searchExchangeRecordCount(pairs).then(rows =>{
                    exchangeConfig = exchangeConfig.map(it => {
                        const row = rows.filter(r => r.goodsId === it.id);
                        const buyLimitTime = it.buy_times;
                        if(buyLimitTime && Number(buyLimitTime) > 0){
                            it.resBuyTime = buyLimitTime - row[0].count;
                            return it;
                        }
                        return it;
                    })
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, exchangeConfig)
                })
            })
        }

        this.shopExchangeGoods = function (productId, userId, callback) {
            CacheUtil.getExchangeConfig().then(config =>{
                const exchangeItems = config.filter(it => it.id === productId);
                if(exchangeItems.length < 1){
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    return;
                }
                const exchangeItem = exchangeItems[0];
                const goodsType = parseInt(exchangeItem.goodsType); // 物品类型
                const name = exchangeItem.name; // 物品名称
                const val = Number(exchangeItem.val) // 获得物品数量
                const silverCoin  = Number(exchangeItem.target_price) // 花费银币
                const buyTimes = Number(exchangeItem.buy_times) // 限购次数
                const goodsId = Number(exchangeItem.id) // 物品id

                // 查询兑换记录
                dao.searchExchangeRecord(userId, goodsId, rows =>{
                    let exchangleTime = 0;
                    if(!rows){
                        exchangleTime = 0;
                    }else{
                        exchangleTime = rows.length;
                    }
                    if(exchangleTime >= buyTimes){ //限购
                        log.info(userId + '兑换物品次数限制')
                        callback(ErrorCode.SILVERCOIN_EXCHANGLE_LIMIT.code, ErrorCode.SILVERCOIN_EXCHANGLE_LIMIT.msg)
                        return;
                    }
                    // 查询银币账户
                    dao.searchSilverCoin(userId,row =>{
                        if(row){
                            const currSilverCoin = Number(row.silverCoin)
                            if(silverCoin > -1 && currSilverCoin >= silverCoin){
                                // 扣银币
                                this.reduceSilverCoin(userId,silverCoin, TypeEnum.SilverCoinChangeType.exchange, (code,beforeSilverCoin, currSilverCoin)=>{
                                    log.info(userId + '兑换状态'+ code +'扣银币前:' + beforeSilverCoin + '扣银币后:' + currSilverCoin)
                                    if(code){
                                        // 兑换记录
                                        dao.exchangeRecord(userId, val, goodsId, goodsType, name, silverCoin, ret =>{
                                            this.getExchangeGoods(userId, (code, msg, data) =>{
                                                // 发货
                                                switch(goodsType){
                                                    case TypeEnum.GoodsType.gold: //金币
                                                        // 发金币
                                                        CacheUtil.addGoldCoin(userId, val, TypeEnum.ScoreChangeType.exchange, ret =>{
                                                            log.info(userId + '兑换金币数量:' + val)
                                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                        });
                                                        break;
                                                    case TypeEnum.GoodsType.withdrawLimit://提现额度
                                                        dao.addWithdrawLimit(userId, val, ret =>{
                                                            log.info(userId + '兑换提现额度数量:' + val)
                                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                        })
                                                        break;
                                                    case TypeEnum.GoodsType.withdrawTime://提现次数
                                                        log.info(userId + '兑换提现次数:' + val)
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                        break;
                                                    case TypeEnum.GoodsType.turntableTime://转盘次数
                                                        log.info(userId + '兑换转盘次数:' + val)
                                                        CacheUtil.addTurntableCoin(userId, 5)
                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                        break;
                                                    case TypeEnum.GoodsType.vipScore://VIP点数
                                                        dao.addVipScore(userId, val, ret =>{
                                                            if(this.userList[userId]){
                                                                this.userList[userId].vip_score = StringUtil.addNumbers(this.userList[userId].vip_score, val);
                                                            }
                                                            log.info(userId + '兑换VIP点数:' + val)
                                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                                        })
                                                        break;
                                                    default:
                                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg, data)
                                                        break;
                                                }
                                            });
                                        })
                                    }else{
                                        log.info(userId + '银币扣费失败')
                                        callback(ErrorCode.SILVERCOIN_NOT_ENOUGH.code, ErrorCode.SILVERCOIN_NOT_ENOUGH.msg)
                                    }
                                })
                            }else {
                                log.info(userId + '银币账户不足')
                                callback(ErrorCode.SILVERCOIN_NOT_ENOUGH.code, ErrorCode.SILVERCOIN_NOT_ENOUGH.msg)
                            }
                        }
                    })
                })
            })
        }

        // 限时折扣
        this.discountLimited = function (userId, callback) {
            CacheUtil.userDiscountLimited(userId, (ret, startTime, endTime) => {
                if (!ret) {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    return;
                }
                CacheUtil.getDiscountLimitedConfig().then(config => {
                    const ret = {
                        startTime: startTime,
                        endTime: endTime,
                        product: config,
                        currTime: new Date().getTime()
                    }
                    if (config) {
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, ret)
                    } else {
                        callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    }
                })
            })
        }

        this.searchWithdrawGoods = function (callback){
            CacheUtil.getBankTransferConfig().then(bankConfig => {
                const goods = bankConfig.withdrawGoods;
                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, goods)
            })
        }

        this.searchFirstRechargeGoods = function (userId, callback){
            CacheUtil.getFirstRechargeConfig().then(cf => {
                const firstRechargeGoods = cf.firstRechargeGoods[0];
                const day = firstRechargeGoods.Discount_time;
                dao.searchFirstRechargeGoodsEndTime(userId, day, firstRechargeGoodsEndTime =>{
                    let endTime = Number(firstRechargeGoodsEndTime);
                    if(new Date().getTime() > endTime){
                        endTime = 0;
                    }
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, [{
                        id: firstRechargeGoods.id,
                        type: firstRechargeGoods.type,
                        group: firstRechargeGoods.group,
                        name: firstRechargeGoods.name,
                        Discount_time: firstRechargeGoods.Discount_time,
                        val: firstRechargeGoods.val,
                        source_price: firstRechargeGoods.source_price,
                        target_price: firstRechargeGoods.target_price,
                        currency_type: firstRechargeGoods.currency_type,
                        buy_picture_type: firstRechargeGoods.buy_picture_type,
                        buy_discount_ratio: firstRechargeGoods.buy_discount_ratio,
                        buy_icon_type: firstRechargeGoods.buy_icon_type,
                        currTime: new Date().getTime(),
                        endTime: endTime
                    }])
                })
            })
        }

        this.searchMonthCardGoods = function (callback){
            CacheUtil.getVConfig().then(config => {
                const ratio = config.recharge_vip_socre_percentage / 100;
                let result = [];
                CacheUtil.getMonthCardConfig().then(cf => {
                    const monthCardGoods = cf.monthCardGoods;
                    for (let i = 0; i < monthCardGoods.length; i++) {
                        const item = monthCardGoods[i];
                        item.vip_score = undefined;
                        item.vip_score = StringUtil.rideNumbers(item.target_price, ratio, 2);
                        result.push(item);
                    }
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result)
                })
            })
        }

        this.searchWithdrawPageStatus = function (userId, callback){
            dao.searchWithdrawPageStatus(userId, (withdrawPageUnLock) =>{
                callback(withdrawPageUnLock)
            })
        }


        this.userDiscountLimitedResTime = function (userId, callback){
            CacheUtil.userDiscountLimitedResTime(userId, callback)
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
                if (result) {
                    this.userList[socket.userId].bankPwd = data.pwd1;
                    socket.emit('setBankPwdResult', {code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
                } else {
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
            ymDao.searchActivityConfigPage(rows => {
                if (rows) {
                    const d = {
                        currTime: new Date().getTime(),
                        rows
                    }
                    socket.emit('activityPageResult', {code: 1, data: d});
                } else {
                    socket.emit('activityPageResult', {code: 1, data: []});
                }
            })
        }

        // 查询订单记录
        this.orderRecord = function (userId, callback) {
            const self = this;
            // 支付成功的订单
            dao.searchAllOrder(userId, [TypeEnum.OrderStatus.payedNotify, TypeEnum.OrderStatus.payedUnNotify], (rows) =>{
                this.getWithdrawLimtByVipWithdrawRatio(userId, (withdrawLimit) =>{
                    if(rows){
                        let totalPromoteWithdrawLimit = 0;
                        let totalReCharge = 0;
                        let num = rows.length;
                        rows = rows.map(row =>{
                            const shopTypeLangCode = self.getShopTypeLangCode(row);
                            totalPromoteWithdrawLimit += Math.floor(row.promoteWithdrawLimit)
                            totalReCharge += Math.floor(row.amount)
                            return {
                                num:  num --, // 编号
                                userId: row.userId, // 用户ID
                                orderId: row.orderId, //订单ID
                                amount: row.amount, // 金额
                                currencyType: row.currencyType, // 货币类型
                                // goodsType: goodsTypeCode, // 物品类型多语言码
                                orderTime: row.createTime, // 订单时间
                                payType: row.payType, // 支付类型
                                payChannel: row.payChannel, // 支付渠道
                                promoteWithdrawLimit:  row.promoteWithdrawLimit, // 单笔提升提现额度
                                shopTypeLangCode: shopTypeLangCode // 购物类型多语言码
                            }
                        })
                        callback({totalReCharge: totalReCharge, totalPromoteWithdrawLimit: totalPromoteWithdrawLimit, withdrawLimit: withdrawLimit,  rows: rows})
                    }else{
                        callback({totalReCharge: 0, totalPromoteWithdrawLimit: 0, withdrawLimit: withdrawLimit,  rows: []})
                    }
                })
            })
        }

        this.getShopTypeLangCode = function (row){
            let goodsTypeCode = '';
            switch (row.shopType){
                case TypeEnum.ShopType.store:
                    goodsTypeCode = ErrorCode.SHOP_STORE.code;
                    break;
                case TypeEnum.ShopType.free_turntable:
                    goodsTypeCode = ErrorCode.SHOP_FREE_TURNTABLE_TICKET.code;
                    break;
                case TypeEnum.ShopType.discount_Limited:
                    goodsTypeCode = ErrorCode.SHOP_DISCOUNT_LIMITED.code;
                    break;
                case TypeEnum.ShopType.firstRecharge:
                    goodsTypeCode = ErrorCode.SHOP_FIRST_RECHARGE.code;
                    break;
                case TypeEnum.ShopType.withdraw_goods:
                    goodsTypeCode = ErrorCode.SHOP_WITHDRAW_GOODS.code;
                    break;
                case TypeEnum.ShopType.month_card_goods:
                    goodsTypeCode = ErrorCode.SHOP_MONTHCARD.code;
                    break;
                case TypeEnum.ShopType.exchangeGoods:
                    goodsTypeCode = ErrorCode.SHOP_EXCHANGEGOODS.code;
                    break;
                default:
                    break;
            }
            return goodsTypeCode;
        }

        // 查询下注记录
        this.serachBetRecord = function (userId, callback){
            this.getWithdrawLimtByVipWithdrawRatio(userId, (withdrawLimit) =>{
                dao.searchBetRecord(userId, rows => {
                    if(rows){
                        let totalBet = 0;
                        let totalPromoteWithdrawLimit = 0;
                        let num = rows.length;
                        rows = rows.map(row =>{
                            totalBet += Number(row.betSum)
                            totalPromoteWithdrawLimit += Number(row.promoteWithdrawLimit)
                            return {
                                num:  num --, // 编号
                                gameId: row.gameId, //游戏ID
                                gameName: row.gameName, // 游戏名称
                                betSum: row.betSum, // 下注
                                promoteWithdrawLimit: row.promoteWithdrawLimit, // 单笔提额
                                createTime: row.create_time, // 创建时间
                                updateTime: row.update_time // 更新时间
                            }
                        })
                        callback({totalBet: StringUtil.toFixed(totalBet, 2), totalPromoteWithdrawLimit:  StringUtil.toFixed(totalPromoteWithdrawLimit, 2), withdrawLimit: withdrawLimit,  rows: rows})
                    }else{
                        callback({totalBet: 0, totalPromoteWithdrawLimit: 0, withdrawLimit: withdrawLimit,  rows: []})
                    }
                })
            })
        }



        // 新用户获取金币
        this.getNewhandProtectGlod = function (userId, callback) {
            const self = this;
            CacheUtil.getNewhandProtectConfig().then(newHandConfig => {
                if (self.userList[userId].newHandGive === 0) {
                    try {
                        // 更新新手赠送为已领取
                        dao.setNewHandGive(userId, ret => {
                            if (ret) {
                                self.userList[userId].newHandGive = 1;
                                const giveGold = Number(newHandConfig.giveGold);
                                CacheUtil.addGoldCoin(userId, giveGold, TypeEnum.ScoreChangeType.newHandGive, (ret, currGoldCoin) => {
                                });
                                callback(giveGold);
                            } else {
                                callback(0);
                            }
                        })
                    }catch (e){
                        log.err('新手领取金币异常' + e)
                        callback(0);
                    }
                } else {
                    log.err('非新手,不可领金币:' + userId)
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

        // VIP升级
        this.vipUpgrade = function (userId, vipLevel, oldVipLevel, serverId) {
            // VIP升级
            if (vipLevel > oldVipLevel) {
                if (this.userList[userId]) this.userList[userId].vip_level = vipLevel;
                if (this.userList[userId]) this.userList[userId].is_vip = 1;
                // 更新VIP等级
                this.updateVipLevel(userId, vipLevel, callback => {
                    if (callback) {
                        const _nickname = this.userList[userId] ? this.userList[userId]._nickname : userId;
                        const noticeMsg = [{
                            type: TypeEnum.notifyType.vipUpgrade,
                            content_id: ErrorCode.VIP_UPGRADE_NOTIFY.code,
                            extend: {
                                currVipLevel: vipLevel,
                                oldVipLevel: oldVipLevel,
                                userId: userId,
                                nickName: _nickname
                            }
                        }]
                        http_bc.sendNoticeMsg(noticeMsg)
                        log.info(userId + 'VIP升级跑马灯通知')
                        // VIP升级奖励
                        this.popUpgradeGiveGlod(userId, oldVipLevel, vipLevel, serverId);
                        if (this.userList[userId]) {
                            dao.searchFirstRecharge(userId, row => {
                                if (row && row.firstRecharge === 0) {
                                    // 大厅推
                                    CommonEvent.pushFirstRecharge(this.userList[userId]._socket, TypeEnum.pushFirstRechargeType.vipUpgrade);
                                }
                            })
                        } else {
                            // 游戏内推
                            const gameScoket = ServerInfo.getScoket(serverId);
                            if (gameScoket) {
                                gameScoket.emit('gameForward', {
                                    userId: userId,
                                    protocol: 'showFirstRechargeShop',
                                    data: {code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg}
                                })
                            }
                        }
                    }
                });
            }

        }


        // 弹VIP升级奖励
        this.popUpgradeGiveGlod = function (userId, oldVipLevel, vipLevel, serverId) {
            const self = this;
            CacheUtil.getVipConfig().then(config => {
                const upgradeGiveGlod = config.find(it => it.level === vipLevel).upgradeGiveGlod;
                const data = {
                    goodsType: TypeEnum.GoodsType.gold,
                    val: upgradeGiveGlod,
                    currvipLevel: vipLevel,
                    oldVipLevel: oldVipLevel
                }
                self.addSilverCoinFromJackpot(userId, Number(upgradeGiveGlod), TypeEnum.SilverCoinChangeType.upgradeGiveGlod, (ret, currSilverCoin) => {
                    log.info(userId + 'VIP升级弹窗,升级前VIP等级:' + oldVipLevel + '当前VIP等级:' + vipLevel + '升级奖励银币:' + upgradeGiveGlod)
                    if (this.userList[userId]) {
                        this.userList[userId]._socket.emit('vipUpgrade', {code: 1, data: data});
                    } else {
                        // 游戏内推
                        const gameScoket = ServerInfo.getScoket(serverId);
                        if (gameScoket) {
                            gameScoket.emit('gameForward', {
                                userId: userId,
                                protocol: 'vipUpgrade',
                                data: {code: 1, data: data}
                            })
                        }
                    }
                });
            })
        }

        // 推广活动-下级成员充值
        this.juniorRecharge = function (userId, currencyType, currencyVal, score_amount_ratio) {
            // 查询上级代理
            ymDao.searchInviteUser(userId, row => {
                if (row) {
                    // 存在上级代理
                    const inviteUid = row.invite_uid;
                    CacheUtil.getDownloadExtConfig().then(downloadExtConfig => {
                        // 金币增加比例
                        const addRatio = downloadExtConfig.reward_agent / 100;
                        const rebateGlod = parseInt(score_amount_ratio * currencyVal * addRatio);
                        // 返点记录（待领取）
                        log.info(userId + '充值类型' + currencyType + '货币数量' + currencyVal + '代理人' + inviteUid + '获得奖励' + rebateGlod);
                        ymDao.agentRebateRecord(inviteUid, userId, currencyType, currencyVal, rebateGlod, TypeEnum.AgentRebateType.recharge, TypeEnum.AgentRebateStatus.unissued, r => {

                        })
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
            try {
                CacheUtil.getVipConfig().then(vipConfig => {
                    let l = 0;
                    for (let i = 0; i < vipConfig.length; i++) {
                        const config = vipConfig[i];
                        const currVipScore = config.vipScore;
                        if (vScore >= currVipScore) {
                            l = config.level;
                        }
                    }
                    console.log('VIP等级' + l);
                    callback(l)
                });
            } catch (e) {
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
            socket.emit('getBankScoreResult', {code: 0, data: result});
        }

        // 银行取出金币到大厅
        this.bankIntoHallGold = function (socket, gold, callback) {
            const userId = socket.userId;
            const bankScore = gold;
            if (!bankScore || isNaN(bankScore) || bankScore < 0) {
                callback(0, "输入有误")
                return;
            }
            // 账户余额不足
            const currBankScore = this.userList[socket.userId].bankScore;
            if (currBankScore < bankScore) {
                callback(0, "账户余额不足")
                return;
            }

            // 增加金币
            CacheUtil.addGoldCoin(userId, Number(gold), TypeEnum.ScoreChangeType.bankIntoHallGold, (code, currGoldCoin) => {
                if (!code) {
                    callback(0, "服务器异常")
                    return;
                }
                // 减少银行积分
                this.userList[userId].bankScore = StringUtil.reduceNumbers(this.userList[userId].bankScore, bankScore);
                // 记录入库
                const result = {
                    bankScore: this.userList[socket.userId].bankScore,
                    gold: currGoldCoin
                }
                callback(1, ErrorCode.SUCCESS.msg, result)
            })
        }

        // 银行转入金币
        this.hallGoldIntoBank = function (socket, gold, callback) {
            const userId = socket.userId;
            if (!gold || isNaN(gold) || gold < 0) {
                callback(0, '输入有误')
                return;
            }
            // 账户余额不足
            const currGold = this.userList[userId]._score;
            if (currGold < gold) {
                callback(0, '账户余额不足')
                return;
            }
            // 减少金币
            CacheUtil.reduceGoldCoin(userId, Number(gold), TypeEnum.ScoreChangeType.hallGoldIntoBank, (code, beforeGoldCoins, currGoldCoin) => {
                if (!code) {
                    callback(0, '账户余额不足')
                    return;
                }
                // 增加银行积分
                this.userList[socket.userId].bankScore = StringUtil.addNumbers(this.userList[socket.userId].bankScore, gold);
                const result = {
                    bankScore: this.userList[socket.userId].bankScore,
                    gold: currGoldCoin
                }
                callback(1, ErrorCode.SUCCESS.msg, result)
            })
        }

        // 转账
        this.bankTransferOtherBank = function (socket, giveUserId, bankScore, callback) {

            CacheUtil.getBankTransferConfig().then(bankTransferConfig => {
                // 账户余额不足
                const currBankScore = this.userList[socket.userId].bankScore;
                if (currBankScore < bankScore) {
                    log.info(socket.userId + "转账账户余额不足,当前账户：" + currBankScore + '需要转:' + bankScore)
                    callback(0, "转账账户余额不足");
                    return;
                }

                dao.BankTransfer(socket.userId, giveUserId, bankScore, 3, row => {
                    if (row && row.rcode > 0) {
                        // 赠送账户减少银行积分
                        this.userList[socket.userId].bankScore = StringUtil.reduceNumbers(this.userList[socket.userId].bankScore, bankScore);
                        // 如果被赠送用户在线
                        if (this.userList[giveUserId]) {
                            this.userList[giveUserId].bankScore = StringUtil.addNumbers(this.userList[giveUserId].bankScore, bankScore);
                        }
                        // 消息通知
                        this.transferMsgNotify(giveUserId, socket.userId, row.logTransferId);

                        CacheUtil.getGoldCoin(socket.userId).then(goldCoin => {
                            log.info(socket.userId + '转账给:' + giveUserId + '银行积分:' + bankScore + '当前金币:' + goldCoin)
                            const result = {
                                bankScore: this.userList[socket.userId].bankScore,
                                gold: goldCoin
                            }
                            callback(1, ErrorCode.SUCCESS.msg, result);
                        })

                    } else {
                        log.info(socket.userId + '转账给:' + giveUserId + '银行积分:' + bankScore)
                        callback(0, "转账失败");
                    }
                });
            });
        }

        // 转账消息通知
        this.transferMsgNotify = function (giveUserId, userId, logTransferId) {
            const noticeMsg = [{
                type: TypeEnum.notifyType.bankTransfer,
                content_id: ErrorCode.BANK_TRANSFER_NOTIFY.code,
                extend: {
                    formUserId: userId,
                    toUserId: giveUserId,
                    formUserNickName: this.userList[userId]._nickname
                }
            }]
           http_bc.sendNoticeMsg(noticeMsg)
            // 邮件通知 logTransferId(转账记录ID)
            this.saveEmail(LanguageItem.bank_transfer_title, TypeEnum.EmailType.transfer_inform, giveUserId, userId, LanguageItem.bank_transfer_content, logTransferId, TypeEnum.GoodsType.gold)
        }


        // 邮件通知
        this.saveEmail = function (title, type, to_userid, from_userid, content_id, otherId, goods_type) {
            const self = this;
            // 保存邮件
            dao.saveEmail(title, type, to_userid, from_userid, content_id, otherId, goods_type, ret =>{
                if(ret){
                    // 有未读邮件通知
                    self.pushUndoEven(to_userid, TypeEnum.UndoEvenType.email);
                }
            });
        }

        // 通过VIP等级获取VIP配置表
        this.getVipConfigByLevel = function (vipConfig, level) {
            try {
                let c;
                for (let i = 0; i < vipConfig.length; i++) {
                    const config = vipConfig[i];
                    const l = config.level;
                    if (level >= l) {
                        c = config;
                    }
                }
                return c;
            } catch (e) {
                log.err(e)
                return null
            }
        }

        // 查询银行转入记录
        this.searchBankTransferIntoRecord = function (socket) {
            dao.searchBankTransferIntoRecord(socket.userId, (res, rows) => {
                let data = []
                if (res) {
                    rows.forEach(item => {
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
                socket.emit('bankTransferIntoRecordResult', {code: 1, data: data});
            });
        }

        // 查询银行转出记录
        this.searchBankTransferOutRecord = function (socket) {
            dao.searchBankTransferOutRecord(socket.userId, (res, rows) => {
                let data = []
                if (res) {
                    rows.forEach(item => {
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
                socket.emit('bankTransferOutRecordResult', {code: 1, data: data});
            });
        }

        // 获取提现页信息
        this.getWithdrawPage = function (userId, callback) {
            const self = this;
            try {
                self.getWithdrawLimtByVipWithdrawRatio(userId, (withdrawLimit) =>{
                    // 获取银行卡
                    dao.getBank(userId, (code, rows) => {
                        if (!code) {
                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                            return;
                        }
                        // 获取玩家当前金币
                        CacheUtil.getGoldCoin(userId).then(goldCoin =>{
                            // 获取提现配置
                            CacheUtil.getBankTransferConfig().then(config => {
                                const withdrawProportion = config.withdraw_proportion; // 提现金币比例
                                const withdrawWard = config.withdrawWard; // 提现金额挡位
                                const withdrawChannel = config.withdrawChannel; // 提现渠道方式
                                const withdrawalCommission = config.withdrawal_commission; // 提现手续费
                                self.getCanWithdrawLimit(userId, goldCoin, withdrawProportion, withdrawLimit,  (canWithdrawLimit) =>{
                                    log.info(userId + '提现总额度:' + withdrawLimit + '可提现额度:' + canWithdrawLimit + '提现金币比例:' + withdrawProportion)
                                    const data = {
                                        withdrawLimit: withdrawLimit, // 总提现额度
                                        currencyType: "BRL", // 货币类型
                                        withdrawWard: withdrawWard, // 提现金额挡位
                                        withdrawChannel: withdrawChannel, // 提现渠道方式
                                        cards: getBankCardByRows(rows), //卡信息
                                        canWithdrawGoldCoin: canWithdrawLimit // 可提现额度
                                    }
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                                })
                            })
                        })
                    })
                })
            } catch (e) {
                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
            }
        }

        this.canOpenWithdrawPage = function (userId){
            TypeEnum.GoodsType.gold
            callback()
        }

        this.getCanWithdrawLimit = function (userId, goldCoin, withdrawProportion, withdrawLimit,  callback){
            this.getVipWithdrawRatio(userId, (vipWithdrawRatio)=>{
                const withdrawCoin = StringUtil.divNumbers(goldCoin, withdrawProportion,2 ); // 可提现金币= 玩家金币数量/金币比例
                vipWithdrawRatio = vipWithdrawRatio === 0 ? 1 : vipWithdrawRatio;
                let canWithdrawLimit = StringUtil.rideNumbers(withdrawCoin, vipWithdrawRatio, 2);  // 可提现金币=可提现金币*VIP提现率
                callback(canWithdrawLimit);
            })
        }

        this.getVipWithdrawRatio = function (userId, callback){
            const self = this;
            CacheUtil.getVipConfig().then(config => {
                try{
                    let ratio = config.find(it => it.level === self.userList[userId].vip_level).withdraw_ratio
                    const vipWithdrawRatio = StringUtil.divNumbers(ratio, 100, 2) // 当前用户VIP提现率
                    callback(vipWithdrawRatio)
                }catch (e){
                    callback(100)
                }
            })
        }


        // 获取提现额度 通过VIP提现率
        this.getWithdrawLimtByVipWithdrawRatio = function (userId, callback){
            this.getCurrVIPWithdrawRatio(userId, (withdrawRatio) => {
                dao.searchTotalWithdraw(userId, (totalWithdrawLimit) => {
                    dao.searchUsedWithdrawLimit(userId, (usedWithdrawLimit) => {
                        // 提现总额度=充值记录+游戏记录总共提升的额度-已提现额度
                        let withdrawLimit = totalWithdrawLimit - usedWithdrawLimit;
                        log.info(userId + '历史提现总额度:' + totalWithdrawLimit + '已使用提现额度:' + usedWithdrawLimit)
                        // 提现额度 = 提现总额度*VIP提现率
                        withdrawLimit = StringUtil.rideNumbers(withdrawLimit, withdrawRatio / 100, 2)
                        callback(withdrawLimit)
                    })
                })
            })

        }


        function getBankCardByRows(rows){
            let cards = []
            if (rows.length > 0) {
                cards = rows.map(row => {
                    return {
                        withdrawChannel: row.bankType,
                        account: row.account,
                        cpf: row.cpf,
                        name: row.name,
                        ifsc: row.ifsc,
                        bankName: row.bankName
                    }
                })
            }
            return cards;
        }

        // 提现申请
        this.withdrawApply = function (userId, pwd, withdrawAmount, account, currencyType, callback) {
            const self = this;
            CacheUtil.getServerUrlConfig().then(urlConfig => {
                try {
                    // 获取可提现额度
                    self.getWithdrawLimtByVipWithdrawRatio(userId, (withdrawLimit) =>{
                        // 获取银行卡
                        dao.getBank(userId, (code, cards) => {
                            if (!code || cards.length === 0) {
                                callback(ErrorCode.WITHDRAW_CARDS_ERROR.code, ErrorCode.WITHDRAW_CARDS_ERROR.msg)
                                return;
                            }
                            // 卡信息
                            const bankType = cards[0].bankType;
                            const name = cards[0].name;
                            const cpf = cards[0].cpf;
                            const ifsc = cards[0].ifsc;
                            const bankName = cards[0].bankName;

                            CacheUtil.getBankTransferConfig().then(transferConfig => {
                                const withdrawProportion = transferConfig.withdraw_proportion; // 提现金币比例
                                const withdrawalCommission = transferConfig.withdrawal_commission; // 提现手续费
                                // 当前VIP提现率
                                if (withdrawAmount > withdrawLimit) {
                                    log.info(userId + '提现:' + withdrawAmount + '大于提现额度' + withdrawLimit + '不允许提现');
                                    callback(ErrorCode.WITHDRAW_LIMIT.code, ErrorCode.WITHDRAW_LIMIT.msg)
                                    return;
                                }
                                dao.getBankPwdById(userId, (code, bankPwd) => {
                                    if (code && bankPwd && Number(bankPwd) === Number(pwd)) {  // 校验银行密码成功
                                        const orderId = StringUtil.generateOrderId();  // 生成提现订单
                                        const callbackUrl =  urlConfig.hallUrl + '/withdrawCallBack?userId=' + userId + '&orderId=' + orderId;
                                        dao.withdrawApplyRecord(userId, withdrawAmount, account, bankType, name, cpf, ifsc, bankName , callbackUrl, orderId, 0, currencyType, ret => {
                                            if (ret) {
                                                const withdrawGlodCoin = StringUtil.rideNumbers( withdrawAmount, withdrawProportion, 2);
                                                CacheUtil.reduceGoldCoin(userId, withdrawGlodCoin, TypeEnum.ScoreChangeType.withdrawApply,ret =>{
                                                    dao.AddUsedWithdrawLimit(userId, withdrawAmount, ret =>{
                                                        // 获取玩家当前金币
                                                        CacheUtil.getGoldCoin(userId).then(goldCoin =>{
                                                            self.getWithdrawLimtByVipWithdrawRatio(userId, (wLimit) =>{
                                                                self.getCanWithdrawLimit(userId, goldCoin, withdrawProportion, wLimit,  (canWithdrawLimit) =>{
                                                                    callback(ErrorCode.WITHDRAW_SUCCESS.code, ErrorCode.WITHDRAW_SUCCESS.msg, {canWithdrawGoldCoin: canWithdrawLimit, withdrawLimit: wLimit})
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            } else {
                                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                            }
                                        })
                                    } else {
                                        log.info(userId + '密码校验失败' + bankPwd + '|' +  pwd);
                                        callback(ErrorCode.BANK_PWD_INUPT_ERROR_MAX.code, ErrorCode.BANK_PWD_INUPT_ERROR_MAX.msg)
                                    }
                                })
                            })
                        })
                    })
                } catch (e) {
                    log.err(e)
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        this.getCurrVIPWithdrawRatio = function (userId, callback){
            const self = this;
            CacheUtil.getVipConfig().then(config => {
                try {
                    const withdrawRatio = config.find(it => it.level === self.userList[userId].vip_level).withdraw_ratio; // 当前用户VIP提现率
                    callback(withdrawRatio)
                }catch (e){
                    callback(100)
                }
            })
        }

        // 查询提现记录
        this.withdrawRecord = function (userId, callback) {
            dao.searchWithdrawApplyRecord(userId, (rows) => {
                if (rows && rows.length > 0) {
                    callback(rows)
                } else {
                    callback([])
                }
            })
        }

        // 更新提现额度
        this.updateWithdrawLimit = function (userId, amount, vipLevel, type, callback) {
            CacheUtil.getVipConfig().then(config => {
                try {
                    const withdrawRatio = config.find(it => it.level === vipLevel).withdraw_ratio;
                    const withdrawLimit = StringUtil.rideNumbers(amount, withdrawRatio / 100, 2);
                    log.info(userId + '充值:' + amount + '增加提现额度' + withdrawLimit + 'vipLevel:' + vipLevel + 'withdrawRatio:' + withdrawRatio)
                    if (type === "add") {
                        dao.addWithdrawLimit(userId, withdrawLimit, callback);
                    } else if (type === "reduce") {
                        dao.reduceWithdrawLimit(userId, withdrawLimit, callback);
                    }
                } catch (e) {
                    log.err('更新提现额度' + e)
                }
            })
        }

        // 修改累计充值
        this.addTotalCharge = function (userId, amount, vipLevel) {
            this.updateWithdrawLimit(userId, amount, vipLevel, "add", ret => {
                dao.updateTotalCharge(userId, amount, (res) => {
                    if (!res) {
                        log.err(userId + '修改累计充值:' + amount + 'res:' + res);
                    }
                });
            })
        }

        this.clearWeekRecharge = function (){
            log.info('清空周充值记录')
            dao.clearWeekRecharge(ret =>{})
        }

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
            if (_info.userId) {
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
                    _socket.emit('updatePasswordResult', {
                        ResultCode: 0,
                        msg: "密码修改成功",
                        data: {ps: _info.password}
                    });
                    //_socket.emit('updatePasswordResult',{ResultCode:0,msg:"密码修改成功",data:{ps:_info.password}});
                } else {
                    _socket.emit('updatePasswordResult', {ResultCode: 5, msg: "数据库操作失败"});
                }
            })
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
