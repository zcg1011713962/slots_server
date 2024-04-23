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
                            currCoinCount: 0
                        }
                        if (luckyDetail) {
                            log.info(userId + '获取用户幸运币配置' + JSON.stringify(luckyDetail))
                            luckObject.luckyCoin = luckyDetail.luckyCoin;
                            luckObject.luckyRushStartTime = luckyDetail.luckyRushStartTime;
                            luckObject.luckyRushEndTime = luckyDetail.luckyRushEndTime;
                            luckObject.luckyCoinGetStatus = luckyDetail.luckyCoinGetStatus;
                            luckObject.currCoinCount = luckyDetail.currCoinCount;
                        }
                        // 获取新手弹窗
                        CacheUtil.getNewHandGuideFlowKey(userId, self.userList[userId].firstRecharge, (newHandGuideFlowItem) => {
                            log.info(userId + '获取新手指引弹窗顺序:' + JSON.stringify(newHandGuideFlowItem))
                            self.loginUserInfo(userId, luckObject, loginUser => {
                                // 获取首充持续奖励
                                CacheUtil.getFirstRechargeContinueReward(userId).then(continueReward => {
                                    let buyContinueRewardGold = 0;
                                    let buyContinueRewardDiamond = 0;
                                    let buyContinueDays = 0;
                                    if (continueReward) {
                                        const data = JSON.parse(continueReward);
                                        log.info(userId + '获取首充持续奖励,持续天数:' + data.buyContinueDays + '上次弹首充持续奖励时间:' + data.lastGetTime)
                                        if (data.buyContinueDays > 0 && StringUtil.currDate() !== data.lastGetTime) {
                                            buyContinueRewardGold = data.buyContinueRewardGold;
                                            buyContinueRewardDiamond = data.buyContinueRewardDiamond;
                                            buyContinueDays = data.buyContinueDays;
                                            data.buyContinueDays -= 1
                                            data.lastGetTime = StringUtil.currDate();
                                            if (data.buyContinueDays === 0) {
                                                data.buyContinueRewardGold = 0;
                                                data.buyContinueRewardDiamond = 0;
                                            }
                                            log.info(userId + '给用户弹首充持续奖励,金币:' + data.buyContinueRewardGold + '钻石:' + data.buyContinueRewardDiamond)
                                            if (data.buyContinueRewardGold > 0) CacheUtil.addGoldCoin(userId, data.buyContinueRewardGold, TypeEnum.ScoreChangeType.firstRechargeContinueReward, ret => {
                                            })
                                            if (data.buyContinueRewardDiamond > 0) CacheUtil.addDiamond(userId, data.buyContinueRewardDiamond, TypeEnum.DiamondChangeType.firstRechargeContinueReward, ret => {
                                            })
                                            CacheUtil.setFirstRechargeContinueReward(userId, data.buyContinueRewardGold, data.buyContinueRewardDiamond, data.buyContinueDays, data.lastGetTime).then(r => {})
                                        }
                                    }
                                    loginUser.buyContinueRewardGold = buyContinueRewardGold; //首充持续奖励金币
                                    loginUser.buyContinueRewardDiamond = buyContinueRewardDiamond; //首充持续奖励钻石
                                    loginUser.buyContinueDays = buyContinueDays; //首充持续奖励天数
                                    loginUser.newHandGuideFlowItem = newHandGuideFlowItem; // 新手弹窗流程
                                    callback(null, {
                                        code: ErrorCode.LOGIN_SUCCESS.code,
                                        msg: ErrorCode.LOGIN_SUCCESS.msg,
                                        Obj: loginUser
                                    });
                                })
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
                    CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot) => {
                        // 生成新token返回
                        StringUtil.generateUniqueToken().then(token => {
                            RedisUtil.set(login_token_key + token, userInfo.Id).then(ret1 => {
                                const expire = 7 * 24 * 60 * 60;
                                RedisUtil.expire(login_token_key + token, expire).then(ret2 => {
                                    if (ret1 && ret2) {
                                        result.Obj.token = token;
                                        result.win_pool = gameJackpot;

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
            // 延时1秒发送跑马灯
            setTimeout(() => {
                const noticeMsg = [{
                    type: TypeEnum.notifyType.vipEnterHall,
                    content_id: ErrorCode.VIP_ENTER_HALL_NOTIFY.code,
                    extend: {
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
        };

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
                                                p: user._p, // king
                                                step: user.step, // 新手指引步数
                                                goldTransferMin: goldTransferMin, // 最小转账
                                                dailyGet: dailyGet,   // 是否领取了每日金币
                                                monthlyGet: monthlyGet, // 是否领取了每月金币
                                                currSignInFlag: currSignInFlag, // 当日是否签到
                                                unReadEmail: unReadEmailCode // 是否有未读取邮件
                                            }
                                            callback(ret);
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
            log.info('商城购买回调，通知大厅 userId:' + userId + 'serverId:' + serverId + 'shopType:' + shopType)
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
                                this.firstRechargeBuy(orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback);
                            } else {
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

        this.firstRechargeBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
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
                        self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, goods)
                    }else{
                        self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.firstRecharge, TypeEnum.ShopGroupType.rechargeGift, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays)
                    }
                });
            })
        }

        this.discountLimitedBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods, callback) {
            const self = this;

            CacheUtil.getUserDiscountLimited(userId).then(ok => {
                if (!ok) {
                    callback(0, "限时折扣时间已过")
                    return;
                }
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
                    // 巴西币
                    const currencyType = TypeEnum.CurrencyType.Brazil_BRL;
                    // 金币数量
                    const goodsVal = parseFloat(shopItem['Discount_BONUS']);

                    if(paySwitch){
                        self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId, shopItem.type, TypeEnum.ShopType.discount_Limited, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods)
                    }else{
                        self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,shopItem.type, TypeEnum.ShopType.discount_Limited, TypeEnum.ShopGroupType.normal, 0, 0, 0)
                    }
                })
            })

        }

        this.turntableBuy = function (orderId, userId, productId, service, hallUrl, serverId, nSwitch, paySwitch, goods,  callback) {
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
                const currencyType = buyMulPriceItem.currencyType;
                // 购买倍数
                const mul = buyMulPriceItem.mul;
                log.info(userId + '购买免费转盘门票' + 'amount:' + amount + 'currencyType:' + currencyType + 'mul:' + mul)

                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, 1, amount, currencyType, nSwitch, callback, service, mul, serverId, TypeEnum.GoodsType.turntableTicket, TypeEnum.ShopType.free_turntable, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, 1, amount, currencyType, nSwitch, callback, service, mul, serverId ,TypeEnum.GoodsType.turntableTicket, TypeEnum.ShopType.free_turntable, TypeEnum.ShopGroupType.normal, 0, 0, 0)
                }
            });
        }

        this.placeOrder = function (hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, mul, serverId, goodsType, shopType, group, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, goods) {
            const self = this;
            const callbackUrl = hallUrl + '/shoppingCallBack?userId=' + userId + '&orderId=' + orderId;
            if(goods){
                // 下购买订单
                PayAPI.fastBuyOrder(userId, productId, orderId, amount, currencyType, goods, callbackUrl).then(res => {
                    try {
                        log.info(userId + '下购买订单' + res)
                        const orderResult = JSON.parse(res);
                        if (orderResult && orderResult.code === 200) {
                            self.getVipLevel(userId, vipLevel => {
                                // 记录订单详情
                                dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, TypeEnum.OrderType.fatpag,ret => {
                                    if (ret) {
                                        this.intervalSearchOrder(userId, orderId, TypeEnum.OrderType.fatpag);
                                        orderResult.data.switch = nSwitch;
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                    } else {
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                })
                            })
                        } else {
                            log.err(userId + '购买商品下购买订单失败')
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    } catch (e) {
                        log.err(userId + '购买商品下购买订单异常' + e)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    }
                })
            }else{
                // 下购买订单
                PayAPI.buyOrder(userId, productId, orderId, amount, currencyType, callbackUrl).then(res => {
                    try {
                        log.info(userId + '下购买订单' + res)
                        const orderResult = JSON.parse(res);
                        if (orderResult && orderResult.code === 200) {
                            self.getVipLevel(userId, vipLevel => {
                                // 记录订单详情
                                dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, TypeEnum.OrderType.betcatpay, ret => {
                                    if (ret) {
                                        this.intervalSearchOrder(userId, orderId,  TypeEnum.OrderType.betcatpay);
                                        orderResult.data.switch = nSwitch;
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                                    } else {
                                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                                    }
                                })
                            })
                        } else {
                            log.err(userId + '购买商品下购买订单失败')
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    } catch (e) {
                        log.err(userId + '购买商品下购买订单异常' + e)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    }
                })
            }

        }


        this.TestPlaceOrder = function (hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, mul, serverId, goodsType, shopType, group, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays) {
            const callbackUrl = hallUrl + '/shoppingCallBack?userId=' + userId + '&orderId=' + orderId;
            const self = this;
            // 下购买订单
            self.getVipLevel(userId, vipLevel => {
                // 记录订单详情s
                dao.orderRecord(parseInt(userId), orderId, amount, currencyType, vipLevel, goodsType, amount, group, service, mul, shopType, goodsVal, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, TypeEnum.OrderType.betcatpay,ret => {
                    log.info(userId + '测试购买订单记录' + orderId)
                    if (ret) {
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
                                "switch": 1
                            }
                        }
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, orderResult.data)
                    } else {
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                    }
                })
            })
        }


        this.intervalSearchOrder = function (userId, orderId, payType){
            const self = this;
            let elapsedTime = 0; // 记录经过的时间（秒）
            // 定时查询某个接口
            self.searchOrderUpdate(userId, orderId, payType,(ret) =>{
                if(!ret){
                    // 定时5秒执行操作
                    const interval = setInterval(() => {
                      self.searchOrderUpdate(userId, orderId, payType, (code) =>{
                          const timeOut = elapsedTime >= 10 * 60;
                          if (code || timeOut) {
                              // 条件满足时清除定时器
                              clearInterval(interval);
                              if(timeOut){
                                  dao.updateOrder(userId, orderId, TypeEnum.OrderStatus.payTimeOut, ret =>{
                                      log.info(userId + '订单超时结束orderId:' + orderId);
                                  });
                              }else{
                                  log.info(userId + '订单完成orderId:' + orderId);
                              }
                          }
                      })
                        elapsedTime += 5; // 每次操作后增加5秒
                    }, 5000); // 间隔5秒执行一次
                }else{
                    log.info(userId + '订单完成orderId:' + orderId);
                }
            })
        }

        this.searchOrderUpdate = function (userId, orderId, payType, callback){
            const self = this;

            PayAPI.searchOrder(orderId, payType).then(res =>{
                //log.info(userId + '查询订单结果:' +  res);
               /* res = {
                    "code": 200,
                    "msg": "success",
                    "data": {
                        "orderStatus": 2,
                        "orderNo": "0d3dcc8ebc634aa6b5a50757011cc840",
                        "merOrderNo": "1713422734281400",
                        "amount": 4,
                        "currency": "BRL",
                        "cime": 1713422766423,
                        "updateTime": 1713422767506,
                        "sign": "fc7fed77bb92b1ad139f3f09991d37073ebbb8282edeafd0ec915d0342c95080"
                    }
                }*/
                if(res && res.code === 200 && res.data){
                    const orderStatus = res.data.orderStatus;
                    const amount = res.data.amount;
                    // 支付未通知 支付已通知  交易失败 交易过期 交易退还 交易异常 交易结束
                    if(orderStatus === TypeEnum.OrderStatus.payedNotify || orderStatus === TypeEnum.OrderStatus.payedUnNotify
                        || orderStatus === TypeEnum.OrderStatus.payFailed || orderStatus === TypeEnum.OrderStatus.payExpired
                        || orderStatus === TypeEnum.OrderStatus.payReturn || orderStatus === TypeEnum.OrderStatus.payExcept){

                        if(orderStatus === TypeEnum.OrderStatus.payedNotify || orderStatus === TypeEnum.OrderStatus.payedUnNotify){
                            log.info(userId + '订单支付成功,金额:' + amount + '响应:' +  res);
                            self.shoppingCallBack(userId, orderId, orderStatus, (code, msg, data, shopType, service, serverId) => {
                                self.dot(userId, TypeEnum.dotEnum.af_purchase, '', '', '', amount, ret =>{
                                    if(ret){
                                        log.info(userId + '订单支付成功，充值打点成功');
                                    }else{
                                        log.info(userId + '订单支付成功，充值打点失败');
                                    }
                                })
                                // 回调socket
                                if (serverId === 0) { // 大厅
                                    self.sendHallShopCallBack(userId, shopType, serverId, code, msg, data)
                                } else if (serverId !== 0) { // 游戏内
                                    self.sendGameShopCallBack(userId, shopType, serverId, code, msg, data)
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
                    if(res && res.code){
                        log.info(userId + '查询订单结果:' +  res);
                    }
                    callback(0)
                }
            });
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
                // 巴西币
                const currencyType = TypeEnum.CurrencyType.Brazil_BRL;

                if(paySwitch){
                    self.placeOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId, goodsType, TypeEnum.ShopType.store, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods)
                }else{
                    self.TestPlaceOrder(hallUrl, userId, orderId, productId, goodsVal, amount, currencyType, nSwitch, callback, service, 0, serverId ,goodsType, TypeEnum.ShopType.store, TypeEnum.ShopGroupType.normal, 0, 0, 0, goods)
                }
            })
        }


        // 充值统计
        this.rechargeCount = function (userId, amount, currencyType, score_amount_ratio, recharge_vip_socre_percentage, flow_vip_socre_percentage, serverId, callback) {
            const self = this;
            dao.checkTotalCharge(parseInt(userId), (res, data) => {
                if (!amount || amount < 0) {
                    callback(0)
                    return;
                }
                try {
                    if (res === 1) {
                        data.totalRecharge += Number(amount);
                        const housecard = data.housecard;
                        const scoreFlow = data.score_flow ? data.score_flow : 0;
                        // 计算充值获得VIP积分
                        const rechargeVipScore = data.totalRecharge * (recharge_vip_socre_percentage / 100);
                        const flowVipScore = (scoreFlow / score_amount_ratio) * (flow_vip_socre_percentage / 100);

                        // VIP积分=充值获得积分+消费流水获得积分
                        const vScore = StringUtil.addNumbers(rechargeVipScore, flowVipScore);
                        log.info('充值成功' + userId + '增加货币类型:' + currencyType + '数量:' + amount + '总充值获得VIP积分:' + rechargeVipScore + '流水获得VIP积分' + flowVipScore + '当前VIP积分' + vScore);

                        // 计算VIP等级
                        this.getVipLevelByScore(vScore, vipLevel => {
                            // 更新VIP积分
                            if (self.userList[userId]) {
                                self.userList[userId].vip_score = vScore;
                            }
                            self.updateVipScore(userId, vScore);
                            // VIP升级
                            self.vipUpgrade(userId, vipLevel, housecard, serverId);
                            // 更新下级充值返点
                            self.juniorRecharge(userId, currencyType, amount, score_amount_ratio);
                            // 修改累计充值
                            self.addTotalCharge(userId, amount, vipLevel);
                            callback(vipLevel)
                        });
                    } else {
                        callback(0)
                    }
                } catch (e) {
                    log.info(e)
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
                    const shopType = row.shopType;
                    const mul = row.mul;
                    const service = row.service;
                    const val = row.val;
                    const serverId = row.serverId;
                    const buyContinueRewardGold = row.buyContinueRewardGold;
                    const buyContinueRewardDiamond = row.buyContinueRewardDiamond;
                    const buyContinueDays = row.buyContinueDays;

                    dao.getScore(userId, (code, row) => {
                        if (!code) {
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                            return;
                        }
                        const currScore = row.score;
                        if (TypeEnum.ShopType.store === shopType) {
                            this.storeBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, callback)
                        } else if (TypeEnum.ShopType.free_turntable === shopType) {
                            this.freeTurntableBuyCallback(userId, orderId, mul, shopType, service, serverId, payStatus, callback)
                        } else if (TypeEnum.ShopType.discount_Limited === shopType) {
                            this.discountLimitedBuyCallback(userId, service, serverId, goodsType, val, currScore, payStatus, callback)
                        } else if (TypeEnum.ShopType.firstRecharge === shopType) {
                            this.firstRechargeBuyCallback(userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payStatus, callback)
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
                dao.searchWithdrawRecordByOrdeId(userId, orderId, (code, row) => {
                    if (!code) {
                        log.err(userId + '无此提现记录' + orderId)
                        callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        return;
                    }
                    const payStatus = row.payStatus;
                    const status = row.status;
                    // 银行积分
                    const lScore = row.lockBankScore;
                    // 额度
                    const withdrawLimit = row.amount;
                    // 支付失败 或者审核不通过
                    if ((payStatus === -1 || status === 2) && lScore) {
                        // 归还银行积分 归还额度
                        dao.unlockBankScore(userId, lScore, withdrawLimit, ret => {
                            if (ret) {
                                log.info('用户:' + userId + '订单:' + orderId + '归还银行积分:' + lScore)
                                dao.updateWithdrawPayStatus(userId, orderId, 4, ret => {
                                });
                            }
                        })
                    }
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg)
                })
            } catch (e) {
                log.err(e)
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
        this.storeBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, payStatus, callback) {

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
                        let addVipPoint = Number(amount * recharge_vip_socre_percentage / 100);

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

                                if (TypeEnum.GoodsType.gold === goodsType) {
                                    CacheUtil.addGoldCoin(userId, Number(totalVal), TypeEnum.ScoreChangeType.storeBuy, (ret, currGoldCoin) => {
                                        log.info('当前VIP等级:' + currVipLevel + '金币加成率:' + config.shopScoreAddRate + '订单金额' + amount + '货币类型' + currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                    });
                                } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                    CacheUtil.addDiamond(userId, Number(totalVal), TypeEnum.DiamondChangeType.storeBuy, (code, currDiamond) => {
                                    })
                                }
                                // 更新订单状态
                                dao.updateOrder(userId, orderId, payStatus, ret => {
                                })

                                // 查询当前金
                                const result = {
                                    vipLevel: currVipLevel,
                                    addVipPoint: addVipPoint,
                                    firstRecharge: 1,
                                    goodsType: goodsType,
                                    sourceVal: sourceVal,
                                    addVal: addVal,
                                    totalVal: totalVal,
                                    shopScoreAddRate: config.shopScoreAddRate,
                                    shopType: TypeEnum.ShopType.store
                                }
                                if (self.userList[userId]) {
                                    /* // 是否购买了首充礼包
                                     if (group === TypeEnum.ShopGroupType.rechargeGift && !self.userList[userId].firstRecharge) {
                                         // 更新为已购买首充礼包
                                         self.userList[userId].firstRecharge = 1;
                                     }*/
                                    result.firstRecharge = self.userList[userId].firstRecharge;
                                    result.vipLevel = self.userList[userId].vip_level;
                                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                } else {
                                    // 查询是否购买首充礼包
                                    dao.searchFirstRecharge(userId, row => {
                                        result.firstRecharge = row.firstRecharge;
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                    })
                                }
                            });
                        })
                    })
                } catch (e) {
                    log.err(e)
                    callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                }
            })
        }

        // 免费转盘购买回调
        this.freeTurntableBuyCallback = function (userId, orderId, mul, shopType, service, serverId, payStatus, callback) {
            this.turntableCharge(userId, mul, (code, msg, data) => {
                if (code) {
                    // 更新订单状态
                    dao.updateOrder(userId, orderId, payStatus,ret => {
                    })
                }
                callback(code, msg, data, shopType, service, serverId)
            });
        }

        this.firstRechargeBuyCallback = function (userId, orderId, goodsType, price, amount, currencyType, group, shopType, service, val, serverId, currScore, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payStatus, callback) {
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
                        let addVipPoint = Number(amount * recharge_vip_socre_percentage / 100);

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
                                        if (TypeEnum.GoodsType.gold === goodsType) {
                                            CacheUtil.addGoldCoin(userId, Number(totalVal), TypeEnum.ScoreChangeType.firstRechargeBuy, (ret, currGoldCoin) => {
                                                log.info('当前VIP等级:' + currVipLevel + '金币加成率:' + config.shopScoreAddRate + '订单金额' + amount + '货币类型' + currencyType + '额外加成金币' + addVal + '用户获得金币' + totalVal)
                                            });
                                        } else if (TypeEnum.GoodsType.diamond === goodsType) {
                                            CacheUtil.addDiamond(userId, Number(totalVal), TypeEnum.DiamondChangeType.firstRechargeBuy, (code, currDiamond) => {
                                            })
                                        }
                                        // 更新订单状态
                                        dao.updateOrder(userId, orderId, payStatus, ret => {
                                        })
                                        // 设置首充持续奖励
                                        CacheUtil.setFirstRechargeContinueReward(userId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, null).then(ret => {
                                        });
                                        // 查询当前金
                                        const result = {
                                            vipLevel: currVipLevel,
                                            addVipPoint: addVipPoint,
                                            firstRecharge: 1,
                                            goodsType: goodsType,
                                            sourceVal: sourceVal,
                                            addVal: 0,
                                            totalVal: totalVal,
                                            shopScoreAddRate: 0,
                                            shopType: TypeEnum.ShopType.firstRecharge
                                        }
                                        if (self.userList[userId]) {
                                            // 是否购买了首充礼包
                                            if (group === TypeEnum.ShopGroupType.rechargeGift && !self.userList[userId].firstRecharge) {
                                                // 更新为已购买首充礼包
                                                self.userList[userId].firstRecharge = 1;
                                            }
                                            result.firstRecharge = self.userList[userId].firstRecharge;
                                            result.vipLevel = self.userList[userId].vip_level;
                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                        } else {
                                            // 查询是否购买首充礼包
                                            dao.searchFirstRecharge(userId, row => {
                                                result.firstRecharge = row.firstRecharge;
                                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, result, shopType, service, serverId)
                                            })
                                        }
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

        this.discountLimitedBuyCallback = function (userId, service, serverId, goodsType, val, currScore, callback) {
            CacheUtil.addGoldCoin(userId, Number(val), TypeEnum.ScoreChangeType.discountLimitedBuy, (ret, currGoldCoin) => {
                const data = {goodsType: goodsType, val: val, shopType: TypeEnum.ShopType.discount_Limited}
                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data, TypeEnum.ShopType.discount_Limited, service, serverId)
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
                                CacheUtil.addGoldCoin(userId, Number(currConfig.dailyGetGold), TypeEnum.ScoreChangeType.vipDaylyGet, (ret, currGoldCoin) => {
                                    log.info(userId + '每日领取金币:' + currConfig.dailyGetGold + 'VIP等级' + vipLevel + '领取后金币:' + currGoldCoin)
                                });
                                callback(1, ErrorCode.SUCCESS.msg, {type: TypeEnum.GoodsType.gold})
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
                                CacheUtil.addGoldCoin(userId, Number(currConfig.monthlyGetGold), TypeEnum.ScoreChangeType.vipMonthlyGet, (ret, currGoldCoin) => {
                                    log.info(userId + '每月领取金币:' + currConfig.monthlyGetGold + 'VIP等级' + vipLevel + '领取后金币:' + currGoldCoin)
                                });
                                callback(1, ErrorCode.SUCCESS.msg, {type: TypeEnum.GoodsType.gold})
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
                        if (consecutiveDays === 7) {
                            signInFlag = 0;
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
            CacheUtil.getSignInConfig().then(config => {
                const signInConfig = config.find(item => item.id === consecutiveDays);
                const level = this.userList[userId].vip_level;
                CacheUtil.getVipConfig().then(vipConfig => {
                    const currVipConfig = vipConfig.find(item => item.level === level);
                    for (let i = 0; i < signInConfig.award.length; i++) {
                        if (signInConfig.award[i].type === TypeEnum.GoodsType.gold) {
                            const addScore = StringUtil.rideNumbers(signInConfig.award[i].val, currVipConfig.dailySignScoreAddRate / 100, 2);
                            // 发放金币
                            CacheUtil.addGoldCoin(userId, addScore, TypeEnum.ScoreChangeType.daySign, (ret, currGoldCoin) => {
                                log.info(userId + '签到第' + consecutiveDays + '天,未加成前领取金币' + signInConfig.award[i].val + '加成百分比' + currVipConfig.dailySignScoreAddRate)
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
            CacheUtil.getActivityJackpot(activityJackpot => {
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


                        CacheUtil.getActivityJackpot(activityJackpot => {
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
                                    const glod = luckGlodJackpot * 0.5;
                                    let num = Math.random()  * 0.01;
                                    const luckyScore = StringUtil.rideNumbers(num === 0 ? 0.0001 : num, glod, 2);
                                    // 扣奖池
                                    redis_laba_win_pool.redis_win_pool_decrby(luckyScore)
                                    // 幸运金奖池-发放幸运金
                                    CacheUtil.addGoldCoin(userId, luckyScore, TypeEnum.ScoreChangeType.luckyCoinGive, (ret, currGoldCoin) => {});
                                    luckGoldResult.val = luckyScore;
                                    log.info(userId + '领取幸运金币:' + luckyScore + '当前已领幸运币:' + ret.luckyCoin);
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
                    CacheUtil.getActivityJackpot(activityJackpot => {

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
                                    // 扣减总奖池
                                    CacheUtil.DecrJackpot(win).then(turntableJackpot => {
                                        CacheUtil.addGoldCoin(userId, win, TypeEnum.ScoreChangeType.turntable, (ret, currGoldCoin) => {
                                            log.info('大厅转盘活动' + userId + "赢" + win + "剩余奖池" + StringUtil.toFixed(turntableJackpot, 2) + '当前金币:' + currGoldCoin)
                                            callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, dictAnalyseResult)
                                        });
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
                                // 计算转盘奖池基础倍数(向下取整) = 当前奖池/转盘最大倍数/VIP加成/购买倍数最大值
                                const val = turntableJackpot / turntableMaxMul / maxTurntableGameAddRate / maxBuyMul;
                                // 基础倍数
                                const baseMul = StringUtil.toFixed(val, 2)
                                log.info('计算转盘基础倍数 活动奖池:' + activityJackpot + '转盘奖池:', turntableJackpot, '转盘最大倍数:', turntableMaxMul, 'VIP最大加成:', maxTurntableGameAddRate, '购买倍数最大值:', maxBuyMul, '未取向下取整前', val, '基础倍数', baseMul)
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
            CacheUtil.getActivityJackpotConfig().then(config => {
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
            CacheUtil.getActivityJackpotConfig().then(config => {
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
                                                        // 给绑定用户立即送金币
                                                        CacheUtil.addGoldCoin(userId, inviteeRewardGold, TypeEnum.ScoreChangeType.inviteBindUser, (ret, currGoldCoin) => {
                                                        });
                                                        log.info('代理' + agentUserId + '邀请用户' + userId + '送给用户金币' + inviteeRewardGold)
                                                        // 返点记录（代理人金币未领取）
                                                        ymDao.agentRebateRecord(agentUserId, userId, TypeEnum.CurrencyType.Brazil_BRL, 0, agentRewardGold, TypeEnum.AgentRebateType.bindInviteCode, TypeEnum.AgentRebateStatus.unissued, row => {
                                                            if (row) {
                                                                // 发邮件通知代理人
                                                                this.saveEmail(LanguageItem.new_hand_bind_title, TypeEnum.EmailType.agent_bind_inform, agentUserId, 0, LanguageItem.new_hand_bind_content, row.insertId, TypeEnum.GoodsType.gold)
                                                            }
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
                                log.info('领取返点' + userId + '类型:' + item.type + '金币数量:' + item.rebate_glod);
                                const rebateGlodCoin = Number(item.rebate_glod);
                                if (item.type === TypeEnum.AgentRebateType.bindInviteCode) {
                                    CacheUtil.addGoldCoin(userId, rebateGlodCoin, TypeEnum.ScoreChangeType.inviteBindAgent, (ret, currGoldCoin) => {
                                    });
                                } else if (item.type === TypeEnum.AgentRebateType.recharge) {
                                    CacheUtil.addGoldCoin(userId, rebateGlodCoin, TypeEnum.ScoreChangeType.rebateShop, (ret, currGoldCoin) => {
                                    });
                                }
                            })
                            log.info('领取返点' + userId + '金币总数:' + goldSum);
                            // 记录领取返点记录
                            ymDao.agentGetRebateRecord(socket.userId, goldSum, ret => {
                                if (ret) {
                                    this.searchInvitedDetail(socket.userId, result => {
                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg);
                                    });
                                }
                            })
                        } else {
                            callback(ErrorCode.FAILED.code, ErrorCode.FAILED.msg)
                        }
                    });
                } else {
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
        this.setEmailAllRead = function (_socket) {
            dao.setEmailisAlllReadByUserId(_socket.userId, (code) => {
                if (code) {
                    // 返回所有邮件
                    this.searchEmail(_socket.userId, newList => {
                        if (newList.length > 0) {
                            _socket.emit('setEmailAllReadResult', {code: 1, data: newList});
                        } else {
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
        this.saveDot = function (userId, adid, gps, apptoken, callback) {
            dao.saveDot(userId, adid, gps, apptoken, callback);
        }

        // 存储打点数据
        this.updateDot = function (userId, adid, gps, apptoken, callback) {
            dao.updateDot(userId, adid, gps, apptoken, callback);
        }


        // 客户端打点
        this.dot = function (userId, key, gps, adid, apptoken, money, callback) {
            dao.searchDotByUserId(userId, row =>{
                if(row){
                    money=  !!money ? money : null;
                    gps =  !!gps ? gps : row.gps;
                    adid = !!adid  ? adid : row.adid;
                    apptoken = !!apptoken ? apptoken : row.apptoken;
                    dot.dotRequest(gps, adid, apptoken, key, money).then(data =>{
                        const d = JSON.parse(data);
                        if(d.status === "OK"){
                            callback(1)
                        }else{
                            callback(0)
                        }
                    });
                }else{
                    callback(0)
                }
            })
        }

        // 更新账户信息
        this.updateAccountByDeviceCode = function (deviceCode, account, callback) {
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
                    } catch (e) {
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
            dao.updateGuideStep(userId, step, row => {
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
                                        goodsType: [TypeEnum.GoodsType.diamond],
                                        sourceVal: [35]
                                    }
                                    CacheUtil.addDiamond(socket.userId, 35, TypeEnum.DiamondChangeType.changleOfficial, ret =>{
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

        // 限时折扣
        this.discountLimited = function (userId, callback) {
            CacheUtil.userDiscountLimited(userId, (ret, currTime, endTime) => {
                if (!ret) {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                    return;
                }
                CacheUtil.getDiscountLimitedConfig().then(config => {
                    const ret = {
                        currTime: currTime,
                        endTime: endTime,
                        product: config
                    }
                    if (config) {
                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, ret)
                    } else {
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
        this.vipUpgrade = function (userId, vipLevel, housecard, serverId) {
            // VIP升级
            if (vipLevel > housecard) {
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
                                oldVipLevel: housecard,
                                userId: userId,
                                nickName: _nickname
                            }
                        }]
                        // 发送VIP升级通知
                        this.sendAllNotifyMsg(noticeMsg);
                        // VIP升级奖励
                        this.popUpgradeGiveGlod(userId, housecard, vipLevel, serverId);

                        if (this.userList[userId]) {
                            dao.searchFirstRecharge(userId, row => {
                                if (row && row.firstRecharge === 0) {
                                    // 大厅推
                                    CommonEvent.pushFirstRecharge(this.userList[userId]._socket);
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
        this.popUpgradeGiveGlod = function (userId, housecard, vipLevel, serverId) {
            CacheUtil.getVipConfig().then(config => {
                const upgradeGiveGlod = config.find(it => it.level === vipLevel).upgradeGiveGlod;
                const data = {
                    goodsType: TypeEnum.GoodsType.gold,
                    val: upgradeGiveGlod,
                    currvipLevel: vipLevel,
                    oldVipLevel: housecard
                }
                CacheUtil.addGoldCoin(userId, Number(upgradeGiveGlod), TypeEnum.ScoreChangeType.upgradeGiveGlod, (ret, currGoldCoin) => {
                });
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
                // 最低取出
                const gold_transfer_min = bankTransferConfig.gold_transfer_min;
                // 转账等级
                const transfer_vipLv = bankTransferConfig.transfer_vipLv;
                if (!gold_transfer_min || !transfer_vipLv) {
                    return;
                }
                // 金币最低转账
                if (bankScore < gold_transfer_min) {
                    log.info(socket.userId + '失败!最低存入数量' + gold_transfer_min)
                    callback(0, "失败!最低存入数量" + gold_transfer_min);
                    return;
                }
                const vipLevel = this.userList[socket.userId].vip_level;
                // 判断VIP是否达到转账要求
                if (vipLevel < transfer_vipLv) {
                    log.info(socket.userId + "VIP等级不足!最低等级" + transfer_vipLv)
                    callback(0, "VIP等级不足!最低等级" + transfer_vipLv);
                    return;
                }
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
            // 跑马灯通知
            this.sendNotifyMsg(userId, noticeMsg);
            // 邮件通知 logTransferId(转账记录ID)
            this.saveEmail(LanguageItem.bank_transfer_title, TypeEnum.EmailType.transfer_inform, giveUserId, userId, LanguageItem.bank_transfer_content, logTransferId, TypeEnum.GoodsType.gold)
        }


        // 邮件通知
        this.saveEmail = function (title, type, to_userid, from_userid, content_id, otherId, goods_type) {
            // 保存邮件
            dao.saveEmail(title, type, to_userid, from_userid, content_id, otherId, goods_type);
            // 有未读邮件通知
            this.pushUndoEven(to_userid, TypeEnum.UndoEvenType.email);
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
                console.log('VIP配置表' + c);
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

                dao.checkTotalCharge(userId, (res, data) => {
                    let totalRecharge = 0;
                    let submittedRecharge = 0;
                    if (res === 1) {
                        totalRecharge = parseFloat(data.totalRecharge) ;
                        submittedRecharge = parseFloat(data.subRecharge ? data.subRecharge : 0);
                        log.info(userId + '查询提现页面,总充值:' + totalRecharge + '已提现金额充值额度:' + submittedRecharge)
                    }
                    CacheUtil.getVipConfig().then(config => {
                        let withdrawRatio = config.find(it => it.level === this.userList[userId].vip_level).withdraw_ratio;
                        withdrawRatio = parseInt(withdrawRatio) === 0 ? 0 : withdrawRatio;
                        // 获取提现额度
                        const withdrawLimit = StringUtil.rideNumbers(StringUtil.reduceNumbers(totalRecharge, submittedRecharge) , withdrawRatio / 100, 2);
                        log.info(userId + '查询提现页面,总充值:' + totalRecharge + '已提现金额充值额度:' + submittedRecharge + '提现额度:' + withdrawLimit + 'withdrawRatio:' + withdrawRatio)
                        dao.getBank(userId, (code, rows) => {
                            if (!code) {
                                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                return;
                            }
                            let cards = []
                            if (rows.length > 0) {
                                cards = rows.map(it => {
                                    return {
                                        withdrawChannel: it.bankType,
                                        num: it.account
                                    }
                                })
                            }
                            CacheUtil.getBankTransferConfig().then(config => {
                                const withdrawWard = config.withdrawWard;
                                const withdrawChannel = config.withdrawChannel;
                                // 提现手续费
                                const withdrawalCommission = config.withdrawal_commission;
                                const withdrawProportion = config.withdraw_proportion;
                                log.info(userId + '获取提现额度:' + withdrawLimit + '提现手续费:' + withdrawalCommission + 'withdrawChannel:' + withdrawChannel);

                                const data = {
                                    withdrawLimit: withdrawLimit,
                                    currencyType: "BRL",
                                    withdrawWard: withdrawWard,
                                    withdrawChannel: withdrawChannel,
                                    cards: cards,
                                    withdrawalCommission: withdrawalCommission,
                                    withdrawLimitGoldCoin: StringUtil.rideNumbers(withdrawLimit, withdrawProportion)
                                }
                                callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, data)
                            })
                        })
                    })
                });
               /* CacheUtil.getBankTransferConfig().then(config => {
                    // 银行积分兑换成BRL 提现比率 withdrawProportion：1
                    const withdrawProportion = config.withdraw_proportion;

                })*/
            } catch (e) {
                callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
            }
        }

        // 提现申请
        this.withdrawApply = function (userId, pwd, amount, account, currencyType, callback) {
            CacheUtil.getServerUrlConfig().then(config => {
                try {
                    const hallUrl = config.hallUrl ? config.hallUrl : '';
                    dao.getBank(userId, (code, cards) => {
                        if (!code || cards.length === 0) {
                            callback(ErrorCode.FAILED.code, '卡号信息错误')
                            return;
                        }
                        const card = cards[0];
                        const bankType = card.bankType;
                        const name = card.name;
                        const cpf = card.cpf;

                        CacheUtil.getBankTransferConfig().then(config => {
                            // 提现VIP等级
                            const withdrawVipLevel = config.withdraw_vipLv;
                            // 银行积分兑换成BRL 提现比率 withdrawProportion：1
                            const withdrawProportion = config.withdraw_proportion;
                            // 提现手续费
                            const withdrawalCommission = config.withdrawal_commission;
                            // 判断是否有提现权限
                            if (this.userList[userId].vip_level < withdrawVipLevel) {
                                callback(ErrorCode.FAILED.code, 'VIP等级不够')
                                return;
                            }

                            dao.checkTotalCharge(parseInt(userId), (res, data) => {
                                let totalRecharge = 0;
                                let submittedRecharge = 0;
                                if (res === 1) {
                                    totalRecharge = data.totalRecharge;
                                    submittedRecharge = data.subRecharge;
                                }

                                CacheUtil.getVipConfig().then(config => {
                                    const withdrawRatio = config.find(it => it.level === this.userList[userId].vip_level).withdraw_ratio;
                                    // 获取提现额度
                                    const withdrawLimit = StringUtil.rideNumbers(StringUtil.reduceNumbers(totalRecharge,submittedRecharge), withdrawRatio / 100, 2);

                                    // 判断金额是否正确
                                    dao.searchUserMoney(userId, (row) => {
                                        if (row) {
                                            const bankScore = row.bankScore;

                                            const currAmount = StringUtil.divNumbers(bankScore, withdrawProportion);
                                            // 加上提现手续费后的金额
                                            const fee = StringUtil.rideNumbers(amount, withdrawalCommission / 100);
                                            const totalAmount = StringUtil.addNumbers(amount, fee)
                                            log.info(userId + '发起提现,当前银行金币:' + bankScore + '提现比例:' + withdrawProportion + '当前可提现:' + currAmount + '可提现额度:' + withdrawLimit + 'submittedRecharge:' + submittedRecharge)

                                            if (currAmount < totalAmount) {
                                                callback(ErrorCode.FAILED.code, '金额不足')
                                                return;
                                            }
                                            if (amount > withdrawLimit) {
                                                callback(ErrorCode.FAILED.code, '超出提现额度')
                                                return;
                                            }

                                            // 校验银行密码
                                            dao.getBankPwdById(userId, (code, bankPwd) => {
                                                if (code && bankPwd && Number(bankPwd) === Number(pwd)) {
                                                    // 锁定银行积分
                                                    const lockBankScore = StringUtil.rideNumbers(amount, withdrawProportion);
                                                    // 锁定提现额度
                                                    const lockWithdrawLimit = amount

                                                    dao.lockBankScore(userId, lockBankScore, lockWithdrawLimit, ret => {
                                                        log.info(userId + '锁定银行积分:' + lockBankScore + '锁定提现额度:' + lockWithdrawLimit + 'ret:' + ret);
                                                        // 扣手续费
                                                        this.userList[userId].bankScore = StringUtil.reduceNumbers(this.userList[userId].bankScore, StringUtil.rideNumbers(fee, withdrawProportion));
                                                        // 锁定积分
                                                        this.userList[userId].bankScore = StringUtil.reduceNumbers(this.userList[userId].bankScore, lockBankScore);
                                                        if (ret) {
                                                            const orderId = StringUtil.generateOrderId();
                                                            const callbackUrl = hallUrl + '/withdrawCallBack?userId=' + userId + '&orderId=' + orderId;
                                                            // 生成提现订单
                                                            dao.withdrawApplyRecord(userId, amount, account, bankType, name, cpf, callbackUrl, orderId, lockBankScore, currencyType, ret => {
                                                                if (ret) {
                                                                    dao.submittedRecharge(userId,  StringUtil.divNumbers(amount, withdrawRatio / 100, 2), ret =>{
                                                                        const currWithdrawLimit = withdrawLimit - amount;
                                                                        callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, {currWithdrawLimit: currWithdrawLimit})
                                                                    });
                                                                } else {
                                                                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                                }
                                                            })
                                                        } else {
                                                            callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                                                        }
                                                    });

                                                } else {
                                                    callback(ErrorCode.FAILED.code, '密码错误')
                                                }
                                            })
                                        }
                                    });
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

        // 查询提现记录
        this.withdrawRecord = function (userId, callback) {
            dao.searchWithdrawApplyRecord(userId, (code, rows) => {
                if (code) {
                    callback(ErrorCode.SUCCESS.code, ErrorCode.SUCCESS.msg, rows)
                } else {
                    callback(ErrorCode.ERROR.code, ErrorCode.ERROR.msg)
                }
            })
        }

        // 更新VIP积分
        this.updateVipScore = function (userId, vipScore) {
            dao.updateVipScore(userId, vipScore, (res) => {
                if (!res) {
                    log.warn('dao.updateVipScore' + res);
                } else {
                    log.info('更新VIP积分:' + vipScore);
                }
            });
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
