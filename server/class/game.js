var User = require("./User");
var dao = require("./../dao/dao");
var redis_dao = require("./../dao/redis_dao");
var crypto = require('crypto');
var ServerInfo = require('./../config/ServerInfo').getInstand;
var activityConfig = require('./../config/activityConfig');
var schedule = require("node-schedule");
var log = require("../../CClass/class/loginfo").getInstand;
var async = require('async');
var updateConfig = require('./update_config').getInstand;
var RobotConfig = require('./../config/RobotConfig');
var ml_api = require('./ml_api');
var redis_laba_win_pool = require("./../../util/redis_laba_win_pool");
var redis_send_and_listen = require("./../../util/redis_send_and_listen");
const SendEmail = require('../../util/email_send_code');
const RedisUtil = require('../../util/redis_util');
const ErrorCode = require('../../util/ErrorCode');
const gameConfig = require('../config/gameConfig');
const StringUtil = require('../../util/string_util');
const Config = require("../config/read_turntable_config").getInstand;
const LABA = require("../../util/laba");
const laba_config = require("../../util/config/laba_config");
const CacheUtil = require("../../util/cache_util");
const gameEnum = require("../config/gameEnum");



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

            this.server_log_list = [];
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
                        log.info(userInfo.Id + "获取道具");
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
                        const loginUser= self.loginUserInfo(userInfo.Id);

                        result = {code: ErrorCode.LOGIN_SUCCESS.code, msg: ErrorCode.LOGIN_SUCCESS.msg, Obj: loginUser};
                        log.info("登录成功:" + result);
                        callback(null, result);
                    })
                },
                function (result, callback) {//读取重要数据
                    dao.getScore(userInfo.Id, function (Result, rows) {
                        if (Result) {
                            result.Obj.score = rows.score;
                            result.Obj.diamond = rows.diamond;
                            log.info("获取积分:" + result);
                            callback(null, result);
                        }
                    })
                },
                function (result, callback) {
                    log.info(userInfo.Id + "添加金币");
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
                    log.info(userInfo.Id + "添加钻石");
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
                                        console.log('登录结果', result);
                                        socket.emit('loginResult', result);
                                        ++self.onlinePlayerCount;
                                    }
                                });
                            });
                        })
                    });
                    callback(null);
                }
            ], function (err, result) {
                const userId = userInfo.Id;

                if(self.userList[userId]){
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
                    socket.emit('noticeMsg', self.server_log_list);
                    console.log("大厅在线人数:", self.onlinePlayerCount);

                    // 每日转盘活动
                    CacheUtil.activityLuckyConfig(userId, updateConfig.getLuckyCoinConfig());
                    callback_a(1);
                }
            });

        };


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
        this.loginUserInfo = function (userId) {
            const user = this.userList[userId];
            return {
                account: user._account,
                id: user._userId,
                nickname: user._nickname,
                score: user._score,
                sign: user._sign,
                proplist: user._proList,
                headimgurl: user._headimgurl,
                diamond: user._diamond,
                phoneNo: user._phoneNo,
                official: user._official,
                isVip: user.is_vip,
                totalRecharge: user.totalRecharge,
                vip_level: user.vip_level,
                vip_score: user.vip_score,
                dailyGet: user.dailyGet,
                monthlyGet: user.monthlyGet,
                firstRecharge: user.firstRecharge,
                bankScore: user.bankScore,
                bankLock: user.bankLock,
                addDate: user.addDate,
                existBankPwd: user.bankPwd ? 1 : 0
            };
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


        //商城购买
        this.Shopping = function (userId, productId, count, socket) {
            try {
                // 查询购买的金币道具的数量和价值
                const shopConfig = updateConfig.getShopConfig();
                const shopItem = shopConfig.find(item => item.id === productId);
                if(!shopItem){
                    socket.emit('ShoppingResult', {code:0,msg:"商品不存在"});
                    return;
                }
                // 已经首充不用
                if(this.userList[userId].firstRecharge === 1 && shopItem.group === 1){
                    socket.emit('ShoppingResult', {code:0,msg:"已经购买过首充礼包"});
                    return;
                }

                // 需要充值的金额 折扣价
                const amount = parseFloat(shopItem['target_price']) * count;
                // 原价
                const price = parseFloat(shopItem['source_price']) * count;

                // 暂时测试用 默认充值成功
                let addVipScore = Number(price * gameConfig.recharge_vip_socre_percentage / 100);
                this.Recharge(userId, amount, c =>{
                    if(c){
                        console.log('测试用: 购买商品给用户充值成功', amount);
                    }
                });

                let sourceVal = 0;
                let addVal = 0;
                let totalVal = 0;

                // 获取VIP配置
                const vip_level = this.userList[userId].vip_level;
                const config = this.getVipConfigByLevel(vip_level);

                // 购买金币
                if(0 === shopItem.type){
                    // 充值得到的金币
                    let sourceScore = parseFloat(price * gameConfig.score_amount_ratio);

                    // 获取VIP等级额外加金币
                    const shopScoreAddRate = config.shopScoreAddRate ? config.shopScoreAddRate : 0;
                    const addScore = parseFloat((sourceScore *  ((shopScoreAddRate - 100)/ 100)).toFixed(2));
                    const score = sourceScore + addScore;

                    sourceVal = sourceScore;
                    addVal = addScore;
                    totalVal = score;
                }else if(1 === shopItem.type){
                    sourceVal = price;
                    addVal = 0;
                    totalVal = sourceVal;
                }


                // 扣款
                this.reduce_bx_balance(userId, amount, ret =>{
                    if(ret){
                        // 是否购买了首充礼包
                        if(shopItem.group === 1 && !this.userList[userId].firstRecharge){
                            // 更新为已购买首充礼包
                            this.userList[userId].firstRecharge = 1;
                        }

                        if(0 === shopItem.type) {
                            // 账户增加金币
                            this.addUserscore(userId, totalVal);
                            log.info('扣款'+ amount + '购买成功 额外加成金币' + addVal + '用户获得金币' + totalVal);
                        }else if(1 === shopItem.type){
                            // 账户增加钻石
                            this.adddiamond(userId, totalVal);
                        }

                        const result = {
                            vipLevel: this.userList[userId].vip_level,
                            addVipScore: addVipScore,
                            firstRecharge: this.userList[userId].firstRecharge,
                            goodsType: shopItem.type,
                            sourceVal: sourceVal,
                            addVal: addVal,
                            totalVal: totalVal,
                            shopScoreAddRate: config.shopScoreAddRate
                        }
                        socket.emit('ShoppingResult', {code:1,msg:"购买成功", data: result});
                    }else{
                        socket.emit('ShoppingResult', {code:0,msg:"账户余额不足"});
                    }
                });
            }catch (e) {
                log.err(e);
                socket.emit('ShoppingResult', {code:0,msg:"购买失败"});
            }
        };

        // VIP领取金币
        this.vipGetGold = function (socket, type) {
            const vipLevel = this.userList[socket.userId].vip_level;
            const dailyGet = this.userList[socket.userId].dailyGetGold;
            const monthlyGet = this.userList[socket.userId].monthlyGetGold;
            const currConfig = updateConfig.getVipConfig().find(item => item.level === vipLevel);

            if(!this.userList[socket.userId].is_vip){
                socket.emit('vipGetGoldResult', {code:0,msg:"非VIP不能领取"});
                return;
            }

            if(type === 0){
                // 每日领取
                if(!dailyGet){
                    this.userList[socket.userId]._score += parseInt(currConfig.dailyGetGold);
                    this.userList[socket.userId].dailyGet = 1;
                    socket.emit('vipGetGoldResult', {code:1,data: {
                        type : 0
                    }});
                }else{
                    socket.emit('vipGetGoldResult', {code:0,msg:"不要重复领取"});
                }
            }else if(type === 1){
                // 每月领取
                if(!monthlyGet){
                    this.userList[socket.userId]._score += parseInt(currConfig.monthlyGetGold);
                    this.userList[socket.userId].monthlyGet = 1;
                    socket.emit('vipGetGoldResult', {code:1,data:{
                        type : 0
                    }});
                }else{
                    socket.emit('vipGetGoldResult', {code:0,msg:"不要重复领取"});
                }
            }else{
                socket.emit('vipGetGoldResult', {code:0,msg:"参数错误"});
            }
        };


        // 查询能领取多少金币
        this.vipGetGoldDetail = function (socket) {
            const vipLevel = this.userList[socket.userId].vip_level;
            const dailyGet = this.userList[socket.userId].dailyGet;
            const monthlyGet = this.userList[socket.userId].monthlyGet;
            const currConfig = updateConfig.getVipConfig().find(item => item.level === vipLevel);

            const result ={
                vipLevel: vipLevel,
                monthlyGetGold: currConfig.monthlyGetGold,
                dailyGetGold: currConfig.dailyGetGold,
                dailyGet: dailyGet,
                monthlyGet: monthlyGet
            }
            socket.emit('vipGetGoldDetailResult', result);
        };

        //用户是否在线
        this.IsPlayerOnline = function (_userId) {
            if (!_userId) {	//传输ID错误
                console.log("查询在线,参数错误");
                return 0;
            }
            if (this.userList[_userId]) {//未找到用户
                return 1;
            } else {
                return 0;
            }
        };

        // 查询用户签到详情页
        this.searchUserSignInDetail = function (socket) {
            const config = updateConfig.getSignInConfig();

            // 查询当前用户签到第几天了
            dao.searchUserSignIn(socket.userId, res =>{
                let result = {};
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
                    result = {
                        code:1,
                        data: {
                            currSignInFlag: currSignInFlag, signInConfig,
                        }
                    }
                    socket.emit('getSignInDetailResult', result);
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
                    result = {
                        code:1,
                        data: {
                            currSignInFlag: currSignInFlag, signInConfig
                        }
                    }
                    socket.emit('getSignInDetailResult', result);
                }

            });


        }

        // 查询用户签到信息
        this.signIn = function (socket) {
            const userId = socket.userId;

           dao.userSignIn(socket.userId, res =>{
               if(res.rcode){
                   const consecutiveDays = res.rcode;
                   const signInConfig = updateConfig.getSignInConfig().find(item => item.id = consecutiveDays);
                   if(signInConfig.award){
                       const level = this.userList[userId].vip_level;
                       const currVipConfig = updateConfig.getVipConfig().find(item => item.level === level);

                       for(let i = 0; i < signInConfig.award.length; i++){
                            if(signInConfig.award[0].type === 0){
                                const addScore = parseInt(signInConfig.award[0].val * currVipConfig.dailySignScoreAddRate / 100);
                                // 发放金币
                                const currScore = this.userList[userId]._score;
                                this.userList[userId]._score += addScore;
                                console.log('每日签到前金币', currScore, '未加成前领取金币', signInConfig.award[0].val, '加成百分比', currVipConfig.dailySignScoreAddRate , '每日签到后金币', this.userList[userId]._score)
                            }else if(signInConfig.award[0].type === 1){
                                // 发放钻石
                            }
                       }
                   }
                   socket.emit('signInResult', { code : 1 , msg : '签到成功'});
               }else{
                   socket.emit('signInResult', { code : 0 , msg : '重复签到'});
               }
           });
        }

        // 获取大厅幸运币详情页
        this.getHallLuckyPageDetail = function (socket, activityJackpot) {
            // 获取幸运币配置
            const turntableJackpot = this.getTurntableJackpot(activityJackpot);
            const luckGlodJackpot = this.getLuckGlodJackpot(activityJackpot);

            const now = new Date().getTime();
            const luckyCoinConfig = updateConfig.getLuckyCoinConfig();
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
                        luckGlodJackpot: luckGlodJackpot, // 幸运金币活动奖池
                        luckyRushStartTime: luckyRushStartTime, // 幸运金币刷新开始时间
                        luckyRushEndTime: luckyRushEndTime, // 幸运金币刷新结束时间
                        currTime: now, // 幸运金币刷新结束时间
                        luckyCoinGetStatus: luckyCoinGetStatus, // 幸运金币是否可领取
                        luckyCoinTask: luckyCoinConfig.luckyCoinTask, // 每日任务数量
                        doLuckyCoinTask: doLuckyCoinTask, // 完成任务数量
                        luckyCoinTaskStatus: luckyCoinTaskStatus, // 任务是否可以领币 0可领 1不可领
                        luckyCoin: luckyCoin // 当前用户幸运币个数
                    }
                    // console.log('hallLuckyPageDetailResult' + data, 'flag:',  now > data.luckyRushEndTime);
                    socket.emit('hallLuckyPageDetailResult', {code:1, data: data});
                }

            });
        }
        
        // 领取幸运币
        this.getLuckyCoin = function (socket, type) {
            const luckyCoinConfig = updateConfig.getLuckyCoinConfig();
            CacheUtil.getActivityLuckyDetailByUserId(socket.userId, ret =>{
                if(ret){
                    const luckyCoin = ret.luckyCoin;
                    const luckyCoinGetStatus = ret.luckyCoinGetStatus;
                    const luckyCoinTaskGetStatus = ret.luckyCoinTaskGetStatus;
                    if(luckyCoin === luckyCoinConfig.luckyCoinGetLimit){
                        socket.emit('getLuckyCoinResult', {code:0, msg: "领取上限"});
                        return;
                    }
                    if(!luckyCoinGetStatus && !luckyCoinTaskGetStatus){
                        log.info('不可领取幸运币,用户:'+  socket.userId  +'间隔领取状态' + luckyCoinGetStatus + '完成任务状态' +luckyCoinTaskGetStatus);
                        socket.emit('getLuckyCoinResult', {code:0, msg: "不可领取状态"});
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

                    log.info('幸运币领取成功，用户:'+ socket.userId + '类型' + type + '币数量' + ret.luckyCoin);
                    CacheUtil.updateActivityLuckyConfig(socket.userId, ret).then( result =>{
                        if(result){
                            socket.emit('getLuckyCoinResult', {code:1, msg: "成功"});
                        }
                    });
                }
            });
        }

        // 获取幸运币活动配置
        this.getLuckyCoinDetail = function (socket, activityJackpot, val) {
            try {
                const userId = socket.userId;
                // 获取幸运币配置
                const luckyCoinConfig = updateConfig.getLuckyCoinConfig();
                const turntableJackpot = this.getTurntableJackpot(activityJackpot);
                // 获取基础倍数
                const baseMul = Number(this.getBaseMul(userId, activityJackpot, null).toFixed(2));
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
            }catch (e){
                log.err(e);
                socket.emit('luckyCoinDetailResult', {code: 0, msg: "获取倍数失败"});
            }
        }


        // 转盘购买
        this.mulBuy = function (mul, callback) {
            // 获取幸运币配置
            const luckyCoinConfig = updateConfig.getLuckyCoinConfig();
            const buyMulPriceItem = luckyCoinConfig.turntableBuyMulPrice.find(item => item.mul === mul);
            if(!buyMulPriceItem){
                console.log("没有此倍率的配置")
                callback(0);
                return;
            }
            // 价格
            const price = buyMulPriceItem.price;
            // 货币类型
            const currencyType = buyMulPriceItem.currencyType;
            // 扣款


            callback(1);
        }

        // 转动转盘
        this.turntable = function (socket, betMul, activityJackpot) {
            const userId = socket.userId;
            if(!Config.coinConfig.includes(betMul)){
                socket.emit('turntableResult', {code:0, msg:"没有对应的倍率"});
                return;
            }

            const cards = Config.cards;
            const weight_two_array = Config.weight_two_array;
            const col_count = Config.col_count;
            const line_count = Config.line_count;
            const iconTypeBind = Config.icon_type_bind;
            const cardsNumber = 1;
            let iconBindSwitch = iconTypeBind ? 1 : 0;


            const dictAnalyseResult = {
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




            // 转盘奖池
            const turntableJackpot = this.getTurntableJackpot(activityJackpot);
            let nHandCards = [];
            let win = 0;
            while(true){
                // 生成图案
                nHandCards = LABA.createHandCards(cards, weight_two_array, col_count, line_count, cardsNumber, -1, iconBindSwitch , iconTypeBind, 0);

                let winIndex = nHandCards[0];
                dictAnalyseResult["nWinLines"] = winIndex;
                // 基础倍数*转盘倍数*VIP加成*购买倍数
                win = this.getWin(userId, activityJackpot, betMul, winIndex, dictAnalyseResult);
                dictAnalyseResult["win"] = win;

                // 获得奖励不能大于转盘总奖池
                if (!iconTypeBind && turntableJackpot < win) {
                    continue;
                }
                break;
            }
            // 扣减总奖池
            redis_laba_win_pool.redis_win_pool_decrby(win).then( turntableJackpot =>{
                console.log("剩余奖池", turntableJackpot)
                this.userList[userId].winscore(win);
                socket.emit('turntableResult', {code:1, data: dictAnalyseResult});
            });
        }

        // 获取赢的金币
        this.getWin = function (userId, activityJackpot, betMul, winIndex, dictAnalyseResult) {
            // 获取基础倍数
            const baseMul = this.getBaseMul(userId, activityJackpot, dictAnalyseResult);

            const turntableGameAddRate = this.getTurntableGameAddRate(userId);
            // 奖金币 = 基础倍数 * 中奖倍数 * VIP转盘加成 * 下注倍数
            const win = baseMul * Config.icon_mul[0][winIndex] * turntableGameAddRate * betMul;

            dictAnalyseResult["baseMul"] = baseMul;
            dictAnalyseResult["iconMul"] = Config.icon_mul[0][winIndex];
            dictAnalyseResult["turntableGameAddRate"] = turntableGameAddRate;

            console.log('转盘获得金币:'+ win +'免费转盘基础倍数:', baseMul, '赢倍数:', Config.icon_mul[0][winIndex], '转盘加成:', turntableGameAddRate, '下注倍数:', betMul)
            return win;
        }


        /**
         *
         * @returns {number}
         */
        this.getBaseMul = function (userId, activityJackpot, dictAnalyseResult) {
            // 获取VIP最大加成
            const maxTurntableGameAddRate = this.getMaxTurntableGameAddRate();

            const turntableJackpot = this.getTurntableJackpot(activityJackpot);
            const luckyCoinConfig = updateConfig.getLuckyCoinConfig();

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
            console.log('计算转盘基础倍数 活动奖池:'+ activityJackpot + '转盘奖池:', turntableJackpot, '转盘最大倍数:', turntableMaxMul, 'VIP最大加成:', maxTurntableGameAddRate, '购买倍数最大值:', maxBuyMul)
            // 计算转盘奖池基础倍数(向下取整) = 当前奖池/转盘最大倍数/VIP加成/购买倍数最大值
            return Math.floor(turntableJackpot / turntableMaxMul / maxTurntableGameAddRate / maxBuyMul);
        }
        
        this.getTurntableGameAddRate = function (userId) {
            // 获取VIP转盘加成
            const vipLevel = this.userList[userId].vip_level;
            const turntableGameAddRate = updateConfig.getVipConfig().find(item => item.level === vipLevel).turntableGameAddRate;

            return turntableGameAddRate ? (turntableGameAddRate / 100) : 1;
        }

        this.getMaxTurntableGameAddRate = function () {
            // 获取VIP转盘最大加成
            const maxItem = updateConfig.getVipConfig().reduce((max, current) => (current.turntableGameAddRate > max.turntableGameAddRate ? current : max), updateConfig.getVipConfig()[0]);
            const maxTurntableGameAddRate = maxItem.turntableGameAddRate;
            return maxTurntableGameAddRate ? (maxTurntableGameAddRate / 100) : 1;
        }

        // 获取转盘奖池
        this.getTurntableJackpot = function (activityJackpot) {
            // 获取活动奖励配置
            const aJackpotConfig= updateConfig.getActivityJackpotConfig();
            const totalRatio = aJackpotConfig.freeRatio.totalRatio;
            const turntableRatio = aJackpotConfig.freeRatio.turntableRatio;
            // 转盘游戏总奖池
            return parseInt(activityJackpot * (totalRatio / 100) * (turntableRatio / 100));
        }

        // 获取幸运金奖池
        this.getLuckGlodJackpot = function (activityJackpot) {
            // 获取活动奖励配置
            const aJackpotConfig= updateConfig.getActivityJackpotConfig();
            const totalRatio = aJackpotConfig.freeRatio.totalRatio;
            const turntableRatio = aJackpotConfig.freeRatio.luckyGoldRatio;
            // 转盘游戏总奖池
            return parseInt(activityJackpot * (totalRatio / 100) * (turntableRatio / 100));
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

                return userInfo;
            } else {
                log.err("用户进入游戏" + _userId + "密码错误!");
                return {_userId: 0, msg: "密码错误!"};
            }

        };

        this.addLoginList = function (user) {
            //已经存在删掉前面的push后面的
            //列队状态1.排队,2.离线中,3.登录中，5.完成登录
            this.deleteLoginList(user.userName)
            user.state = 1;
            user.AutoOutCount = 0;
            this._loginList.push(user);
        };
        
        this.existGameDel = function (userId) {
            const gameId = this.userList[userId].getGameId();
            if (gameId) {
                // 在大厅的用户，不应该在游戏内 断开游戏连接
                const gameScoket = ServerInfo.getScoket(gameId);
                log.info('在大厅的用户，不应该在游戏内 断开游戏连接userId', + userId + 'gameId' + gameId);
                if(gameScoket) gameScoket.emit('disconnectUser', {userId: userId});
            }
        }


        this.getLoginState = function (useraccount, state) {
            for (var i = 0; i < this._loginList.length; i++) {
                if (this._loginList[i].userName == useraccount && this._loginList[i].state == state) {
                    return true;
                }
            }
            return false;
        };

        this.deleteLoginList = function (useraccount) {
            var idx = -1;
            for (var i = 0; i < this._loginList.length; i++) {
                if (this._loginList[i].userName == useraccount) {
                    idx = i;
                    break;
                }
            }

            if (idx != -1) {
                this._loginList.splice(idx, 1)
            }

        };




        //赠送金币
        this.sendCoin = function (_socket, _info) {
            //被赠送id
            //金额
            if (_socket.userId == _info.sendUserId) {
                _socket.emit('sendCoinResult', {Result: 0, msg: "不能自己赠送自己"});
                return;
            }

            if (_info.sendUserId <= 0) {
                _socket.emit('sendCoinResult', {Result: 0, msg: "赠送ID不能小于0"});
                return;
            }

            if (_info.sendCoin < 1000) {
                _socket.emit('sendCoinResult', {Result: 0, msg: "赠送金币不能小于1000"});
                return;
            }


            // var userItem = this.getUser(_info.sendUserId);
            // if (userItem && userItem.getGameId()){
            // 	_socket.emit('sendCoinResult',{Result:0,msg:"对方在游戏中,赠送失败!"});
            // 	return;
            // }

            var myNowScore = this.userList[_socket.userId].getScore();

            if (!this.userList[_socket.userId]) {
                _socket.emit('sendCoinResult', {Result: 0, msg: "用户错误,请重新登录"});
                return;
            }


            // if (!this.userList[_socket.userId]._phoneNo) {
            //     _socket.emit('sendCoinResult', {Result: 0, msg: "未绑定手机,不允许赠送"});
            //     return;
            // }

            if (this.userList[_socket.userId].getScore() - _info.sendCoin < 1000) {
                _socket.emit('sendCoinResult', {Result: 0, msg: "赠送失败,剩余金币不能低于1000"});
                return;
            }

            //获取昵称
            dao.checkNickName(_info.sendUserId, (result, nickName) => {
                if (result) {
                    if (this.userList[_socket.userId].addgold(-_info.sendCoin)) {
                        log.info(_socket.userId + "赠送前,金币:" + myNowScore);
                        log.info(_socket.userId + "赠送金币:" + _info.sendCoin);
                        var info = {
                            userId: _info.sendUserId,
                            winPropId: 0,
                            winPropCount: 0,
                            winScore: _info.sendCoin,
                            type: 1,
                            sendCoinUserId: _socket.userId,
                            nickName: this.userList[_socket.userId]._nickname
                        };
                        this.sendEmail(info);

                        //给自己做钱的记录
                        var score_change = parseInt(_info.sendCoin);
                        var NowScore = this.userList[_socket.userId].getScore();
                        var userInfo = {
                            userid: _socket.userId,
                            score_before: myNowScore,
                            score_change: -score_change,
                            score_current: NowScore,
                            change_type: 3,
                            isOnline: true
                        };
                        this.score_changeLogList.push(userInfo);
                        log.info(_socket.userId + "赠送后:" + NowScore);
                        //获取昵称
                        _socket.emit('sendCoinResult', {Result: 1, score: -_info.sendCoin, msg: "赠送成功"});
                        userInfo = {
                            userid: _socket.userId,
                            getcoinuserid: _info.sendUserId,
                            sendcoin: score_change,
                            nickname: nickName,
                            commission: 0,
                            state: 0
                        };
                        dao.sendcoinlog(userInfo, (code, insertId) => {
                            let emailInfo = {
                                isread: 0,
                                title: "转账送礼",
                                type: 1,
                                otherId: insertId,
                                userid: _info.sendUserId,
                                sendid: _socket.userId,
                            };
                            dao.saveEmail(emailInfo);
                        });
                    } else {
                        //减分失败
                        _socket.emit('sendCoinResult', {Result: 0, msg: "赠送失败,金钱不足"});
                    }
                } else {
                    _socket.emit('sendCoinResult', {Result: 0, msg: "未找到该用户"});
                }
            });

        };
        //查询金币记录
        this.selectUserIdAndSendCoin = function (_socket, _info) {
            dao.getUserId(_info.sendUserName, (code, id) => {
                if (code) {
                    _info.sendUserId = parseInt(id);
                    this.sendCoin(_socket, _info);
                } else {
                    _socket.emit('sendCoinResult', {Result: 0, msg: "未找到该用户"});
                }
            });
        };

        //查询金币记录
        this.selectCoinLog = function (_socket) {
            dao.selectcoinlog(_socket.userId, (code, res) => {
                if (code) {
                    _socket.emit('selectCoinLogResult', {Result: 1, data: res});
                } else {
                    console.log("selectCoinLog失败");
                    // _socket.emit('selectCoinLogResult', {Result: 0, msg: "查询失败"});
                }
            });
        };
        //查询收取金币记录
        this.selectgetCoinLog = function (_socket) {
            dao.selectgetcoinlog(_socket.userId, (code, res) => {
                if (code) {
                    _socket.emit('selectgetcoinlogResult', {Result: 1, data: res});
                } else {
                    console.log("selectCoinLog失败");
                    // _socket.emit('selectCoinLogResult', {Result: 0, msg: "查询失败"});
                }
            });
        };

        this.updateCoinLogState = function (_socket, _info) {
            let state = _info.state;
            let id = _info.id;
            let coin = _info.coin;

            dao.updateCoinLogState(state, id, (code) => {
                if (code) {
                    //发还金币
                    let sendInfo = {
                        sendUserId: _socket.userId,
                        sendCoin: coin,
                        change_type: 11,
                        diamond: 0
                    };
                    this.GameBalance(sendInfo);
                    //发送邮件
                    let emailInfo = {
                        isread: 0,
                        title: "礼物撤回",
                        type: 0,
                        otherId: id,
                        userid: _socket.userId,
                        sendid: 0,
                    };
                    dao.saveEmail(emailInfo);

                    _socket.emit('updateCoinLogStateResult', {Result: 1, data: {state: state, id: id}});
                } else {
                    console.log("updateCoinLogState失败");
                }
            });
        };
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
        this.getEmail = function (_socket) {
            //先查系统邮件，再查个人邮件
            let newList = [];
            dao.selectSystemEmail((code, res) => {
                if (code) {
                    for (let i = 0; i < res.length; i++) {
                        newList.push(res[i]);
                    }
                }
                dao.selectEmail(_socket.userId, (code, res) => {
                    if (code) {
                        for (let i = 0; i < res.length; i++) {
                            newList.push(res[i]);
                        }
                    }
                    if (newList.length > 0) {
                        _socket.emit('getEmailResult', {Result: 1, data: newList});
                    } else {
                        _socket.emit('getEmailResult', {Result: 0, msg: "未查到新邮件"});
                    }
                });
            });
        };

        this.setEmailRead = function (_socket, _info) {
            dao.setEmailisRead(_info.id, (code, res) => {
                if (code) {
                    _socket.emit('setEmailReadResult', {Result: 1, data: res});
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
        //使用点卡
        this.useEXcard = function (_socket, _info) {
            if (this.sendCardList[_socket.userId] && (this.sendCardList[_socket.userId] + _info.cardNum) > 2) {
                _socket.emit('sendcardResult', {Result: 0, msg: "超过当天使用上限"});
                return;
            }
            let userInfo = {
                sendUserId: _socket.userId,
                sendCoin: 0,
                change_type: 13,
                diamond: -_info.cardNum
            };

            dao.checkVip(_info.userId, (code, isVip) => {
                if (code) {
                    if (!isVip) {
                        this.GameBalanceSub(userInfo, (result) => {
                            var data = JSON.parse(result);
                            if (!data.status) {
                                if (this.sendCardList[_socket.userId]) {
                                    this.sendCardList[_socket.userId] += _info.cardNum;
                                } else {
                                    this.sendCardList[_socket.userId] = _info.cardNum;
                                }

                                let userInfo2 = {
                                    sendUserId: _info.userId,
                                    sendCoin: 10000 * _info.cardNum,
                                    change_type: 12,
                                    diamond: 0
                                };
                                this.GameBalance(userInfo2);

                                var userInfolog = {
                                    userid: _socket.userId,
                                    targetId: _info.userId,
                                    coin: 10000 * _info.cardNum,
                                    cardNum: _info.cardNum,
                                };
                                dao.saveCardRecord(userInfolog);
                                _socket.emit('sendcardResult', {Result: 0, msg: "赠送成功"});
                            } else {
                                _socket.emit('sendcardResult', {Result: 0, msg: "赠送失败"});
                            }
                        });
                    } else {
                        _socket.emit('sendcardResult', {Result: 0, msg: "该用户不是普通玩家"});
                    }
                }
            });

        };
        //转赠点卡
        this.sendcard = function (_socket, _info) {
            dao.checkVip(_info.userId, (code, isVip) => {
                if (code) {
                    if (isVip) {
                        let userInfo = {
                            sendUserId: _socket.userId,
                            sendCoin: 0,
                            change_type: 13,
                            diamond: -_info.cardNum
                        };
                        this.GameBalanceSub(userInfo, (result) => {
                            var data = JSON.parse(result);
                            if (!data.status) {
                                let userInfo2 = {
                                    sendUserId: _info.userId,
                                    sendCoin: 0,
                                    change_type: 13,
                                    diamond: _info.cardNum
                                };
                                this.GameBalance(userInfo2);
                                _socket.emit('sendcardResult', {Result: 0, msg: "赠送成功"});
                            } else {
                                _socket.emit('sendcardResult', {Result: 0, msg: "赠送失败"});
                            }
                        });
                    } else {
                        _socket.emit('sendcardResult', {Result: 0, msg: "该用户不是VIP"});
                    }
                }
            });
        };
        //查点卡
        this.cardLog = function (_socket, _info) {
            dao.getCardRecord(_info.userid, (code, res) => {
                if (code) {
                    _socket.emit('cardLogResult', {Result: 1, data: res});
                }
            });
        };
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
        this.updateNickName = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.err("更新用户ID,用户" + _userId + "不存在");
                _socket.emit('updateNickNameResult', {Result: 1, msg: "ID不存在"});
                return;
            }

            //金额
            if (_info.newNickName == "") {
                _socket.emit('updateNickNameResult', {Result: 2, msg: "昵称不能为空"});
                return;
            }
            var self = this;

            dao.updateNickName(_socket.userId, _info.newNickName, function (result, nickName) {
                if (self.userList[_socket.userId]) {
                    if (result) {
                        //log.info("发送" + _socket.userId + "检测ID");
                        self.userList[_socket.userId]._socket.emit("updateNickNameResult", {Result: 0, msg: "修改成功"});
                    } else {
                        self.userList[_socket.userId]._socket.emit("updateNickNameResult", {Result: 3, msg: "修改失败"});
                    }
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
            if (_info.url == "") {
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




        //绑定银行卡
        this.BankInfo = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.err("绑定银行卡,用户" + _userId + "不存在");
                _socket.emit('BankInfoResult', {Result: 1, act: _info.act, msg: "ID不存在"});
                return;
            }

            if (!_info.act) {
                _socket.emit('BankInfoResult', {Result: 2, act: _info.act, msg: "银行卡操作码不能为空"});
                return;
            }

            if (_info.act == 1) {
                if (_info.account == "" || _info.account.length > 30) {
                    _socket.emit('BankInfoResult', {Result: 3, act: _info.act, msg: "添加银行卡账号错误"});
                    return;
                }

                if (_info.name == "" || _info.name.length > 30) {
                    _socket.emit('BankInfoResult', {Result: 4, act: _info.act, msg: "添加银行卡实名制名字错误"});
                    return;
                }

                if (!_info.bankType) {
                    _socket.emit('BankInfoResult', {Result: 5, act: _info.act, msg: "添加银行卡类型不能为空"})
                    return;
                }

                var self = this;
                dao.addBank(_socket.userId, _info.account, _info.name, _info.bankType, function (result, nickName) {
                    if (self.userList[_socket.userId]) {
                        if (result) {
                            //log.info("发送" + _socket.userId + "检测ID");
                            self.userList[_socket.userId]._cardList.push({
                                cardId: result,
                                name: _info.name,
                                bankType: _info.bankType,
                                account: _info.account
                            });
                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 0,
                                act: _info.act,
                                cardId: result,
                                msg: "添加银行卡成功"
                            });
                        } else {
                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 4,
                                act: _info.act,
                                cardId: 0,
                                msg: "添加银行卡失败"
                            });
                        }
                    }
                });
            } else if (_info.act == 2) {

                if (_info.cardId == "") {
                    _socket.emit('BankInfoResult', {Result: 3, act: _info.act, msg: "修改卡ID不能为空"});
                    return;
                }

                if (_info.account == "" || _info.account.length > 30) {
                    _socket.emit('BankInfoResult', {Result: 3, act: _info.act, msg: "添加银行卡账号错误"});
                    return;
                }

                if (_info.name == "" || _info.name.length > 30) {
                    _socket.emit('BankInfoResult', {Result: 4, act: _info.act, msg: "添加银行卡实名制名字错误"});
                    return;
                }

                if (!_info.bankType) {
                    _socket.emit('BankInfoResult', {Result: 5, act: _info.act, msg: "修改银行卡类型不能为空"});
                    return;
                }

                var self = this;
                dao.editBank(_socket.userId, _info.account, _info.name, _info.bankType, _info.cardId, function (result, nickName) {
                    if (self.userList[_socket.userId]) {
                        if (result) {
                            //log.info("发送" + _socket.userId + "检测ID");

                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 0,
                                act: _info.act,
                                cardId: _info.cardId,
                                msg: "修改银行卡成功"
                            });
                        } else {
                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 4,
                                act: _info.act,
                                cardId: _info.cardId,
                                msg: "修改银行卡失败"
                            });
                        }
                    }
                });
            } else if (_info.act == 3) {
                if (_info.cardId == "") {
                    _socket.emit('BankInfoResult', {Result: 3, act: _info.act, msg: "删除卡ID不能为空"});
                    return;
                }

                var self = this;
                dao.delBank(_socket.userId, _info.cardId, function (result, nickName) {
                    if (self.userList[_socket.userId]) {
                        if (result) {
                            //log.info("发送" + _socket.userId + "检测ID");
                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 0,
                                act: _info.act,
                                cardId: _info.cardId,
                                msg: "删除银行卡成功"
                            });
                        } else {
                            self.userList[_socket.userId]._socket.emit("BankInfoResult", {
                                Result: 4,
                                act: _info.act,
                                cardId: _info.cardId,
                                msg: "删除银行卡失败"
                            });
                        }
                    }
                });
            }
        };

        //获取银行卡
        this.getBank = function (_socket) {
            if (!this.userList[_socket.userId]) {
                _socket.emit("getBankResult", {ResultCode: 1, msg: "请先登录"});
                return;
            }

            var self = this;

            dao.getBank(_socket.userId, function (Result, row) {
                // console.log(Result);
                if (Result) {
                    self.userList[_socket.userId]._cardList = row;
                    //console.log(self.userList[_socket.userId]._cardList)
                    _socket.emit('getBankResult', {ResultCode: 0, data: {bankList: row}})
                } else {
                    _socket.emit('getBankResult', {ResultCode: 1, data: {bankList: []}})
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
        this.sendEmailCode = function (_socket, toEmail) {
            // 邮箱地址校验
            if (!emailValidator(toEmail)) {
                _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_INPUT_ERROR.code, msg: ErrorCode.EMAIL_INPUT_ERROR.msg});
                return;
            }
            const verificationCode = 666666;
            //const verificationCode = SendEmail(toEmail,  callback =>{
                const expireKey = 'send_email_code_expire_' + toEmail;
                // 是否过期存储
                RedisUtil.set(expireKey, verificationCode).then(ret1 =>{
                    const key = 'send_email_code_' + toEmail;
                    //RedisUtil.expire(key, 240).then(ret2 =>{
                        //if(ret1 && ret2){
                            // 存储验证码
                            RedisUtil.set(key, verificationCode).then(result =>{
                                //RedisUtil.expire(key, 180).then(r =>{
                                    //if(result && r){
                                        log.info('邮箱验证码发送成功' + toEmail + 'code:' + verificationCode);
                                        _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_SUCCESS.code, msg: ErrorCode.EMAIL_CODE_SEND_SUCCESS.msg});
                                    //}else{
                                    //    log.err('邮箱验证码发送失败' + toEmail);
                                    //    _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_FAILED.code, msg: ErrorCode.EMAIL_CODE_SEND_FAILED.msg});
                                    //}
                                //});
                            });
                        //}else{
                            _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_FAILED.code, msg: ErrorCode.EMAIL_CODE_SEND_FAILED.msg});
                        //}
                    //});
                });
            //});
        };

        // 校验验证码
        this.register = function (_socket, email, code) {
            if(isNaN(code)){
                _socket.emit('registerResult', {code: ErrorCode.EMAIL_CODE_INPUT_ERROR.code, msg: ErrorCode.EMAIL_CODE_INPUT_ERROR.msg});
                return;
            }
            this.verifyEmailCode(email, code, (code, msg) =>{
                if(code === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                    //判断邮箱是否注册
                    dao.emailSearch(email, exits =>{
                        if(exits){
                            log.info('邮箱已注册' + email);
                            _socket.emit('registerResult', {code: ErrorCode.ACCOUNT_REGISTERED_ERROR.code, msg: ErrorCode.ACCOUNT_REGISTERED_ERROR.msg});
                            return;
                        }
                        // 通过邮箱注册
                        dao.registerByEmail(_socket, email);
                    });
                }else{
                    _socket.emit('registerResult', {code: code, msg: msg});
                }
            });
        }

        this.verifyEmailCode = function (email, code, callback) {
            const expireKey = 'send_email_code_expire_' + email;
            // 是否过期存储
            RedisUtil.get(expireKey).then(expireCode => {
                const key = 'send_email_code_' + email;
                RedisUtil.get(key).then(verificationCode => {
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





        //每日活动
        this.getdaySendPrize = function (_userId, callback) {

            if (!this.userList[_userId]) {
                callback(0);
                return;
            }
            var self = this;
            dao.getdaySendPrize(_userId, function (result, rows) {
                var resultBack = {};
                var values = [];
                //console.log(rows.length)
                if (result) {
                    //console.log(rows)
                    for (var i = 0; i < rows.length; i++) {
                        resultBack.nowday = rows[i].nowday;
                        if (rows[i].day) {
                            if (!rows[i].mark) {
                                values.push({
                                    id: rows[i].id,
                                    day: rows[i].day,
                                    mark: rows[i].mark
                                });
                            }
                            if (rows[i].day == resultBack.nowday) {
                                resultBack.getcoin = -1;
                            }

                        } else {
                            resultBack.getcoin = rows[i].getCoin;
                        }
                    }
                }
                if (self.userList[_userId]) {
                    self.userList[_userId]._dayprize = values;
                }
                resultBack.list = values;
                if (!resultBack.nowday) {
                    resultBack.nowday = 1;
                }
                if (!resultBack.getcoin) {
                    resultBack.getcoin = 0;
                }
                //console.log(resultBack);
                callback(resultBack);
            })
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


        //领每日奖品
        this.getDayPrize = function (_socket, _info) {

            var dayprize = this.userList[_socket.userId]._dayprize;

            if (!dayprize || dayprize.length <= 0) {
                _socket.emit('getDayPrizeResult', {Result: 0, msg: "领奖列表为空"});
                return;
            }

            var found = false;
            for (var i = 0; i < dayprize.length; i++) {
                if (_info.id == dayprize[i].id) {
                    found = true;
                    if (!dayprize[i].mark) {
                        dayprize[i].mark = 1;
                        var propId = activityConfig.dayprize[dayprize[i].day - 1].propId;
                        var propCount = activityConfig.dayprize[dayprize[i].day - 1].propCount;
                        _socket.emit('getDayPrizeResult', {
                            Result: 1,
                            msg: "成功领取",
                            data: {winPropId: propId, winPropCount: propCount}
                        });
                        //内存添加道具
                        if (this.userList[_socket.userId]._proList[propId]) {
                            this.userList[_socket.userId]._proList[propId] += propCount;
                        } else {
                            this.userList[_socket.userId]._proList[propId] = propCount;
                        }

                        var info = {userId: _socket.userId, propId: propId, propCount: propCount, roomid: 0, typeid: 4}
                        //数据库添加道具
                        dao.updateProp(info, function (result) {
                        });
                        //数据库更新
                        dao.getDayPrize(_info.id, function (Result) {
                        })
                        return;
                    } else {
                        _socket.emit('getDayPrizeResult', {Result: 0, msg: "奖品已经领取"});
                        return;
                    }
                    break;
                }
            }

            if (!found) {
                _socket.emit('getDayPrizeResult', {Result: 0, msg: "未能找到领奖ID"});
                return;
            }
        };

        this.getServerRank = function (_socket, _info) {
            _socket.emit('getServerRankResult', {Result: 1, msg: "", data: this.gameRank[_info.serverId]});
        };

        this.setServerRank = function (_info) {
            this.gameRank[_info.serverId] = _info;
        };


        this.refreshLuckCoinActivity = function () {
            const luckyCoinConfig = updateConfig.getLuckyCoinConfig();
            const now = new Date().getTime();
            const luckyRushTimeMs = luckyCoinConfig.luckyRushTime * 60 * 1000;


            CacheUtil.getActivityLuckyDetail(ret =>{
                if(ret){
                    for(const key in ret){
                        const luckyItem = JSON.parse(ret[key]);
                        // 可领取状态 未领取
                        if(now >= luckyItem.luckyRushEndTime && luckyItem.luckyCoinGetStatus === 0){
                            luckyItem.luckyCoinGetStatus = 1;
                            luckyItem.luckyRushStartTime = now;
                            luckyItem.luckyRushEndTime = now + luckyRushTimeMs;
                        }

                        const doLuckyCoinTask = luckyItem.doLuckyCoinTask;
                        if(doLuckyCoinTask > 0 && doLuckyCoinTask >= luckyCoinConfig.luckyCoinTask){
                            luckyItem.luckyCoinTaskGetStatus = 1;
                        }
                        CacheUtil.updateActivityLuckyConfig(key, luckyItem);
                    }
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
                if(users){
                    /*for (let i = 0; i < users.length; ++i) {
                        log.info("成功保存在线用户信息" + users[i].id);
                    }*/
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
        this.getShoppingGoods = function (_socket) {
            try {
                const shopConfig = updateConfig.getShopConfig();

                let result = [];
                for (let i = 0; i < shopConfig.length; i++) {
                    if (result[shopConfig[i].group]) {
                        result[shopConfig[i].group].push(shopConfig[i]);
                    } else {
                        result[shopConfig[i].group] = [];
                        result[shopConfig[i].group].push(shopConfig[i]);
                    }
                }
                _socket.emit("getShoppingResult", {code: 1, data: {
                        firstRecharge : this.userList[_socket.userId].firstRecharge,
                        goods : result
                }});
            }catch (e) {
                _socket.emit("getShoppingResult", {code: 0, msg: "获取商城列表错误"});
            }
        };



        //每日登录奖励
        this.getEveryLogin = function (_socket) {
            redis_dao.updateEveryLogin(_socket.userId, 2, (res) => {
                if (res) {
                    let userItem = this.userList[_socket.userId];

                    userItem.addgold(activityConfig.everyCoin[res.num - 1]);
                    userItem._socket.emit('sendCoinResult', {
                        Result: 1,
                        score: activityConfig.everyCoin[res.num - 1],
                        msg: "领取成功"
                    });
                    _socket.emit("getEveryLoginResult", {ResultCode: 1, result: res});
                }
            });
        };

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
                    socket.emit('setBankPwdResult', {code: 1, msg: "设置成功"});
                }else{
                    socket.emit('setBankPwdResult', {code: 0, msg: "设置失败"});
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
        this.Recharge = function (userId, amount, callback) {
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
                                log.info('增加巴西账户余额:' + amount);

                                // 计算充值获得VIP积分
                                const rechargeVipScore = data.totalRecharge * (gameConfig.recharge_vip_socre_percentage / 100);
                                const flowVipScore = (scoreFlow / gameConfig.score_amount_ratio) * (gameConfig.flow_vip_socre_percentage / 100);

                                // VIP积分=充值获得积分+消费流水获得积分
                                const vScore = parseInt(rechargeVipScore) + parseInt(flowVipScore);
                                // 计算VIP等级
                                const vipLevel = this.getVipLevelByScore(vScore);

                                // 更新VIP积分
                                this.userList[userId].vip_score = vScore;
                                this.updateVipScore(userId, vScore);

                                // VIP升级
                                if (vipLevel > housecard) {
                                    this.userList[userId].vip_level = vipLevel;
                                    this.userList[userId].is_vip = 1;
                                    // 更新VIP等级
                                    this.updateVipLevel(userId, vipLevel, housecard);
                                }
                                // 修改累计充值
                                this.updateTotalCharge(userId, data.totalRecharge, amount);
                                callback(1);
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
        }

        // 更新VIP等级
        this.updateVipLevel = function (userId, vipLevel, housecard) {
            dao.updateVipLevel(userId, vipLevel, (res) => {
                if(!res){
                    log.warn('dao.updateVipLevel' + res);
                }else{
                    log.info('充值成功，原等级:' + housecard + '现等级:' + vipLevel);
                }
            });
        }
        // 通过VIP积分获取VIP等级
        this.getVipLevelByScore = function (vScore) {
            const vipConfig = updateConfig.getVipConfig();
            let l = 0;
            for(let i = 0; i < vipConfig.length; i++){
                const config = vipConfig[i];
                const currVipScore = config.vipScore;
                if(vScore >= currVipScore){
                    l = config.level;
                }
            }
            console.log('VIP等级' + l);
            return l;
        }

        // 通过VIP配置
        this.getVipConfig = function () {
            return updateConfig.getVipConfig();
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
        this.bankIntoHallGold = function (socket, gold) {
            const bankTransferConfig = updateConfig.getBankTransferConfig();
            // 最低取出
            const gold_transfer_min = bankTransferConfig.gold_transfer_min;
            // 转账等级
            const transfer_vipLv = bankTransferConfig.transfer_vipLv;
            // 提现倍率
          /*  const withdraw_proportion = bankTransferConfig.withdraw_proportion;*/
            if(!gold_transfer_min || !transfer_vipLv){
                return;
            }

            // 金币最低转账
            if(gold < gold_transfer_min){
                socket.emit('bankIntoHallGoldResult', {code:0, msg: "失败!最低转出" + gold_transfer_min });
                return;
            }
            const vipLevel = this.userList[socket.userId].vip_level;
            // 判断VIP是否达到转账要求
            if(vipLevel < transfer_vipLv){
                socket.emit('bankIntoHallGoldResult', {code:0, msg: "VIP等级不足!最低" + transfer_vipLv });
                return;
            }
            const bankScore = gold;
            if(!bankScore || isNaN(bankScore) || bankScore < 0){
                socket.emit('bankIntoHallGoldResult', {code:0, msg: "参数有误" });
                return;
            }
            // 账户余额不足
            const currBankScore = this.userList[socket.userId].bankScore;
            if(currBankScore < bankScore){
                socket.emit('bankIntoHallGoldResult', {code:0, msg: "账户余额不足" });
                return;
            }

            this.userList[socket.userId].bankScore = this.userList[socket.userId].bankScore - bankScore;
            this.userList[socket.userId]._score =  this.userList[socket.userId]._score + parseInt(gold);

            // 记录入库


            const result = {
                bankScore: this.userList[socket.userId].bankScore,
                gold: this.userList[socket.userId]._score
            }
            socket.emit('bankIntoHallGoldResult', {code:1, msg: result });
        }

        // 银行转入金币
        this.hallGoldIntoBank = function (socket, gold) {
            const bankTransferConfig = updateConfig.getBankTransferConfig();
            // 最低取出
            const gold_transfer_min = bankTransferConfig.gold_transfer_min;
            // 转账等级
            const transfer_vipLv = bankTransferConfig.transfer_vipLv;
            // 提现倍率
            /*const withdraw_proportion = bankTransferConfig.withdraw_proportion;*/
            if(!gold_transfer_min || !transfer_vipLv){
                return;
            }
            // 金币最低转账
            if(gold < gold_transfer_min){
                socket.emit('hallGoldIntoBankResult', {code:0, msg: "失败!最低存入" + gold_transfer_min });
                return;
            }
            const vipLevel = this.userList[socket.userId].vip_level;
            // 判断VIP是否达到转账要求
            if(vipLevel < transfer_vipLv){
                socket.emit('hallGoldIntoBankResult', {code:0, msg: "VIP等级不足!最低" + transfer_vipLv });
                return;
            }
            if(!gold || isNaN(gold) || gold < 0){
                socket.emit('hallGoldIntoBankResult', {code:0, msg: "参数有误" });
                return;
            }
            // 账户余额不足
            const currGold = this.userList[socket.userId]._score;
            if(currGold < gold){
                socket.emit('hallGoldIntoBankResult', {code:0, msg: "账户余额不足" });
                return;
            }

            const addBankScore = Number(gold);
            this.userList[socket.userId]._score =  this.userList[socket.userId]._score - Number(gold);
            this.userList[socket.userId].bankScore =  this.userList[socket.userId].bankScore + addBankScore;

            const result = {
                bankScore: this.userList[socket.userId].bankScore,
                gold: this.userList[socket.userId]._score
            }
            socket.emit('hallGoldIntoBankResult', {code:1,  msg: result });
        }

        // 转账
        this.bankTransferOtherBank = function (socket, giveUserId ,bankScore) {
            const bankTransferConfig = updateConfig.getBankTransferConfig();
            // 最低取出
            const gold_transfer_min = bankTransferConfig.gold_transfer_min;
            // 转账等级
            const transfer_vipLv = bankTransferConfig.transfer_vipLv;
            if(!gold_transfer_min || !transfer_vipLv){
                return;
            }
            // 金币最低转账
            if(bankScore < gold_transfer_min){
                socket.emit('bankTransferOtherBankResult', {code:0, msg: "失败!最低存入" + gold_transfer_min });
                return;
            }
            const vipLevel = this.userList[socket.userId].vip_level;
            // 判断VIP是否达到转账要求
            if(vipLevel < transfer_vipLv){
                socket.emit('bankTransferOtherBankResult', {code:0, msg: "VIP等级不足!最低" + transfer_vipLv });
                return;
            }
            // 账户余额不足
            const currBankScore = this.userList[socket.userId].bankScore;
            if(currBankScore < bankScore){
                socket.emit('bankTransferOtherBankResult', {code:0, msg: "账户余额不足" });
                return;
            }


            dao.BankTransfer(socket.userId, giveUserId, bankScore, 3, callback =>{
                if(callback){
                    if(callback.rcode > 0){
                        // 赠送账户减少银行积分
                        this.userList[socket.userId].bankScore -= bankScore;
                        // 如果被赠送用户在线
                        if(this.userList[giveUserId]){
                            this.userList[giveUserId].bankScore += bankScore;
                        }
                        const result = {
                            bankScore: this.userList[socket.userId].bankScore,
                            gold: this.userList[socket.userId]._score
                        }
                        socket.emit('bankTransferOtherBankResult', {code:1,  data: result });
                    }
                }else{
                    socket.emit('bankTransferOtherBankResult', {code:0,  msg: '转账失败' });
                }
            });
        }

        // 通过VIP等级获取VIP配置表
        this.getVipConfigByLevel = function (level) {
            const vipConfig = updateConfig.getVipConfig();
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
        // 增加巴西账户余额
        this.add_bx_balance = function (userId, amount, callback) {
            dao.add_bx_balance(userId, amount, callback);
        }

        // 减少巴西账户余额
        this.reduce_bx_balance = function (userId, amount, callback) {
            dao.reduce_bx_balance(userId, amount, callback);
        }

        // 修改累计充值
        this.updateTotalCharge = function (userId, totalRecharge, amount) {
            dao.updateTotalCharge(userId, totalRecharge, (res) => {
                if(!res){
                    log.warn('dao.updateTotalCharge' + res);
                }else{
                    log.info('充值成功，充值:' + amount + '累计充值:' + totalRecharge);
                }
            });
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
            if (_info.state == 1) {
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


        this.changeOfficial = function (_socket, _info) {
            _info.userId = _socket.userId;
            var key = "89b5b987124d2ec3";
            var content = _info.newAccount + _info.password + key;
            _info.p = _info.password;
            var md5 = crypto.createHash('md5');
            md5.update(content);
            _info.password = md5.digest('hex');
            var self = this;
            dao.changeOfficial(_info, function (result) {
                if (result) {
                    //_socket.emit('changeOfficialResult',{ResultCode:0,msg:"转正成功",data:{ps:_info.password}});
                    //修改内存数据
                    if (self.userList[_socket.userId]) {
                        self.userList[_socket.userId]._official = true;
                        self.userList[_socket.userId]._p = _info.p;
                        self.userList[_socket.userId]._account = _info.newAccount;
                    }
                    _socket.emit('changeOfficialResult', {ResultCode: 0, msg: "转正成功"});
                } else {
                    _socket.emit('changeOfficialResult', {ResultCode: 5, msg: "用户名已经存在,修改后重试"});
                }
            })
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


        this.scoreOut = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.info("用户不在线,无法操作");
                _socket.emit('scoreOutResult', {ResultCode: 1, msg: "用户不在线,无法操作"});
                return false;
            }

            if (_info.score < 5000) {
                log.info("兑奖数量出错!");
                _socket.emit('scoreOutResult', {ResultCode: 2, msg: "最少兑奖50"});
                return false;
            }

            if (_info.score % 100 != 0) {
                log.info("兑换金额必须是100的倍数");
                _socket.emit('scoreOutResult', {ResultCode: 7, msg: "兑换金额必须是100的倍数"});
                return false;
            }

            var score = this.userList[_socket.userId].getScore();


            if (score - _info.score < 800) {
                log.info("至少保留10!");
                _socket.emit('scoreOutResult', {ResultCode: 5, msg: "至少保留8"});
                return false;
            }

            if (!(_info.type == 0 || _info.type == 1)) {
                log.err("兑换类型不对!");
                _socket.emit('scoreOutResult', {ResultCode: 6, msg: "兑换类型不对!"});
                return false;
            }

            var cardId = -1;
            var cardInfo = null;


            if (_info.type == 0) {
                if (!this.userList[_socket.userId]._zhifubao) {
                    log.info("请先绑定支付宝!");
                    _socket.emit('scoreOutResult', {ResultCode: 3, msg: "请先绑定支付宝"});
                    return false;
                }

                var myDate = new Date();
                var out_trade_no = String(myDate.getFullYear()) + String(myDate.getMonth() + 1) + String(myDate.getDate()) + String(myDate.getTime()) + String(this.todayId);
                if (this.todayId > 10000) {
                    this.todayId = 0;
                }

                this.todayId++;

                var userInfo = {sendUserId: _socket.userId, sendCoin: -_info.score, change_type: 2};
                var self = this;
                this.GameBalanceSub(userInfo, function (_sendStr) {
                    var data = JSON.parse(_sendStr);
                    if (!data.status) {
                        //记录订单
                        //保存兑换记录
                        _socket.emit('scoreOutResult', {ResultCode: 0, msg: "兑奖成功"});

                        var socreOut_userInfo = {
                            sendUserId: _socket.userId,
                            sendCoin: _info.score,
                            cardType: _info.type,
                            cardId: cardId,
                            out_trade_no: out_trade_no,
                            zfb_account: self.userList[_socket.userId]._zhifubao,
                            zfb_name: self.userList[_socket.userId]._zhifubaoName,
                            tax: 0
                        };
                        if (_info.score <= 10000) {
                            socreOut_userInfo.tax = 300;
                        } else {
                            socreOut_userInfo.tax = _info.score * 0.02;
                        }

                        socreOut_userInfo.coin = ((_info.score - socreOut_userInfo.tax) / 100).toFixed(2);

                        dao.socreOut(socreOut_userInfo, function (result) {
                            if (result) {
                                //立即到账
                                // var info = {out_biz_no:out_trade_no,payee_account:self.userList[_socket.userId]._zhifubao,amount:(_info.score / 100).toFixed(2),payee_real_name:self.userList[_socket.userId]._zhifubaoName,Key:'89b5b987124d2ec3'};
                                // Post.postExchangeCoin(info,function(post_result){
                                // 	if (post_result){
                                // 		self.updateScoreOut(out_trade_no,function(result){
                                // 			switch(result){
                                // 				case 0:
                                // 					log.info("兑奖更新成功");
                                // 				break;
                                // 				case 1:
                                // 					log.err("兑奖更新失败,找不到订单");
                                // 				break;
                                // 			}
                                // 		});
                                // 	}else{
                                // 		//告知玩家,支付宝帐号有错误，并退款
                                // 		var info = {userId:_socket.userId,msg:'你的支付宝有误,确认后重新绑定后,再试!'}
                                // 		self.sendMsgToUserBySystem(info);
                                // 		userInfo.sendCoin = userInfo.sendCoin * -1;
                                // 		self.GameBalance(userInfo);
                                // 	}
                                // });
                            } else {
                                log.err("创建兑换订单出错");
                            }

                        });
                        //发送

                    }
                });

            } else if (_info.type == 1) {
                var flag = false;
                console.log(this.userList[_socket.userId]._cardList)
                for (var i = 0; i < this.userList[_socket.userId]._cardList.length; ++i) {
                    console.log(this.userList[_socket.userId]._cardList[i].cardId)
                    console.log(_info.cardId)
                    if (this.userList[_socket.userId]._cardList[i].cardId == _info.cardId) {
                        flag = true;
                        cardInfo = this.userList[_socket.userId]._cardList[i];
                        break;
                    }
                }

                if (!flag) {
                    log.err("兑换卡ID不对!");
                    _socket.emit('scoreOutResult', {ResultCode: 7, msg: "兑换卡ID不对!"});
                    return false;
                }
                cardId = _info.cardId;


                if (cardInfo) {
                    var bank = ['ICBC', 'BOC', 'ABC', 'CCB', 'BOCOM', 'CMB', 'PSBC', 'CEB', 'CMBC', 'CITIC', 'CIB', 'HXB'];
                    var withdrawalInfo = {
                        username: this.userList[_socket.userId]._account,
                        fullname: cardInfo.name,
                        baCode: bank[cardInfo.bankType - 1],
                        amount: _info.score,
                        baNo: cardInfo.account,
                        ip: _info.ip
                    }
                    var self = this;

                    ml_api.withdrawal(withdrawalInfo, function (result) {
                        if (result) {
                            var myDate = new Date();
                            var out_trade_no = String(myDate.getFullYear()) + String(myDate.getMonth() + 1) + String(myDate.getDate()) + String(myDate.getTime()) + self.todayId;
                            if (self.todayId > 10000) {
                                self.todayId = 0;
                            }

                            self.todayId++;

                            var userInfo = {
                                sendUserId: _socket.userId,
                                sendCoin: -_info.score,
                                change_type: 2,
                                cardType: _info.type,
                                cardId: cardId,
                                out_trade_no: out_trade_no
                            };
                            self.GameBalanceSub(userInfo, function (_sendStr) {
                                var data = JSON.parse(_sendStr);
                                if (!data.status) {
                                    //记录订单
                                    //保存兑换记录
                                    dao.socreOut(userInfo, function () {
                                    });
                                    data.msg = "兑奖成功";
                                }
                                _socket.emit('scoreOutResult', {ResultCode: data.status, msg: data.msg});
                                //callback(_sendStr);
                            });
                        } else {
                            _socket.emit('scoreOutResult', {ResultCode: 1, msg: "接口失败"});
                        }

                    })
                }
            }

            //console.log(cardInfo)


            //未完成
            // dao.checkScoreByLog(_socket.userId,score,function(result){
            // 	info.warn('金币有异常,让管理员详细查看数据确认。')
            // })


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
