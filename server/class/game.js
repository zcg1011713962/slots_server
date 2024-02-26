var User = require("./User");
var dao = require("./../dao/dao");
let shopping_dao = require("./../dao/shopping_dao");
var redis_dao = require("./../dao/redis_dao");
var crypto = require('crypto');
var ServerInfo = require('./../config/ServerInfo').getInstand;
var activityConfig = require('./../config/activityConfig');
var Post = require('./post');
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

            this.tempuserList = {};

            this.sendCardList = {};

            this.score_changeLogList = [];

            this.diamond_changeLogList = [];

            this.sendApiList = [];

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
            //初始化redis
            redis_laba_win_pool.redis_win_pool_init();

            var rule = new schedule.RecurrenceRule();
            var times = [];
            for (var i = 0; i < 60; i++) {
                times.push(i);
            }
            rule.second = times;
            var c = 0;
            var self = this;
            var j = schedule.scheduleJob(rule, function () {
                if (self.maintain) {
                    --gameConfig.maintainTime;
                    //console.log(gameConfig.maintainTime);;
                    if (!gameConfig.maintainTime) {
                        self.disconnectAllUser();
                    }
                }

                var nowDate = new Date();
                var now_hours = nowDate.getHours();
                var minute = nowDate.getMinutes();
                var second = nowDate.getSeconds();
                self.game_second = second;
                if (second == 0) {    //彩金推送
                    // self.userList[_userId]
                    redis_laba_win_pool.get_redis_win_pool().then(function (data) {
                        for (var i in self.userList) {
                            self.userList[i]._socket.emit("RedisWinPool", data)
                        }
                        // console.log("彩金推送",data)

                    })
                }

                if (now_hours == 5) {
                    this.sendCardList = {};
                }
            });


        };

        this.disconnectAllUser = function () {
            for (var itme in this.userList) {
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

                        self.userList[userInfo.Id] = new User(userInfo, socket);
                        const resultObj = {
                            account: self.userList[userInfo.Id]._account,
                            id: self.userList[userInfo.Id]._userId,
                            nickname: self.userList[userInfo.Id]._nickname,
                            score: self.userList[userInfo.Id]._score,
                            sign: self.userList[userInfo.Id]._sign,
                            proplist: self.userList[userInfo.Id]._proList,
                            headimgurl: self.userList[userInfo.Id]._headimgurl,
                            diamond: self.userList[userInfo.Id]._diamond,
                            giftTicket: self.userList[userInfo.Id]._giftTicket,
                            phoneNo: self.userList[userInfo.Id]._phoneNo,
                            official: self.userList[userInfo.Id]._official,
                            isVip: self.userList[userInfo.Id].is_vip,
                            totalRecharge: self.userList[userInfo.Id].totalRecharge,
                            vip_level: self.userList[userInfo.Id].vip_level,
                        };
                        result = {code: ErrorCode.LOGIN_SUCCESS.code, msg: ErrorCode.LOGIN_SUCCESS.msg, Obj: resultObj};

                        log.info("登录成功:" + resultObj);
                        callback(null, result);
                    })
                },
                function (result, callback) {//读取重要数据
                    dao.getScore(userInfo.Id, function (Result, rows) {
                        //console.log(Result)
                        if (Result) {
                            self.userList[userInfo.Id]._diamond = rows.diamond;
                            self.userList[userInfo.Id]._giftTicket = rows.giftTicket;
                            self.userList[userInfo.Id]._score = rows.score;
                            result.Obj.score = rows.score;
                            result.Obj.diamond = rows.diamond;
                            result.Obj.giftTicket = rows.giftTicket;
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
                        //callback(result);
                    });
                },
                function (result, callback) {
                    log.info(userInfo.Id + "添加钻石");
                    // log.info(result);
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
                    redis_laba_win_pool.get_redis_win_pool().then(function (data) {
                        result.win_pool = data;
                        console.log('登录结果', result);
                        socket.emit('loginResult', result);
                        ++self.onlinePlayerCount;
                        callback(null);
                    })
                }
            ], function (err, result) {

                log.info(userInfo.Id + "登录分数" + self.userList[userInfo.Id]._score);
                log.info(userInfo.Id + "登录钻石" + self.userList[userInfo.Id]._diamond);
                self.userList[userInfo.Id].loginEnd = true;
                if (err) {
                    console.log(err);
                    console.log(result);
                    callback_a(0);
                } else {

                    socket.emit('ServerListResult', {GameInfo: ServerInfo.getServerAll()});
                    self.getSendPrize(userInfo.Id, function (result) {
                        socket.emit('prizeListResult', {prizeList: result});
                    })

                    //是否有首次兑换
                    self.getfirstexchange(userInfo.Id, function (result) {
                        //console.log(result)
                        socket.emit('firstExchagerResult', {
                            firstExchager: result.firstexchange,
                            zhifubao: result.zhifubao,
                            zhifubaoName: result.zhifubaoName
                        });
                    })

                    //发送等级信息
                    self.getLv(userInfo.Id, function (result) {
                        //console.log(result)
                        socket.emit('lv', result);
                    })

                    //发送是否在房间信息
                    var linemsg = self.getLineOutMsg(userInfo.Id);
                    console.log("linemsg--------------------------------------")
                    console.log(linemsg);
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
                    console.log("zaixianrenshu----------------------------------", self.onlinePlayerCount);
                    callback_a(1);
                }
            });

        };

        this.logintime = function (_id) {
            if (this.userList[_id]) {
                return this.userList[_id].logincheck(new Date());
            }
            return 1;
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
            //console.log("delete")
            //console.log(_userinfo)
            if (_userinfo.userId) {
                //指定用户储存
                log.info("用户" + _userinfo.userId + "删除!");
                if (this.userList[_userinfo.userId] && !this.userList[_userinfo.userId].getGameId() && !this.userList[_userinfo.userId].deleteFlag && !this.userList[_userinfo.userId]._Robot) {
                    log.info("用户" + _userinfo.userId + "没有游戏ID");
                    var score_change = _userinfo.userScore - this.userList[_userinfo.userId]._score;
                    var score_before = this.userList[_userinfo.userId]._score;
                    this.userList[_userinfo.userId].deleteFlag = true;
                    this.tempuserList[_userinfo.userId] = this.userList[_userinfo.userId];
                    if (_userinfo.userScore != null) {
                        this.tempuserList[_userinfo.userId]._score = _userinfo.userScore;
                        //储存玩家游戏金钱变化量
                        if (!_userinfo.nolog) {
                            var info = {
                                userid: _userinfo.userId,
                                score_before: score_before,
                                score_change: score_change,
                                score_current: _userinfo.userScore,
                                change_type: (_userinfo.gameId + 10),
                                isOnline: true,
                                ChannelType: this.userList[_userinfo.userId]._ChannelType
                            }
                            this.score_changeLogList.push(info);
                        }
                    }
                    // console.log("-------------------------------钻石")
                    // console.log(_userinfo.userDiamond)
                    // console.log(this.userList[_userinfo.userId]._diamond)
                    var diamond_change = _userinfo.userDiamond - this.userList[_userinfo.userId]._diamond;
                    var diamond_before = this.userList[_userinfo.userId]._diamond;
                    if (_userinfo.userDiamond != null) {
                        this.tempuserList[_userinfo.userId]._diamond = _userinfo.userDiamond;

                        dao.AddDiamondSub({
                            userid: _userinfo.userId,
                            diamond: diamond_change,
                            change_type: 2,
                        }, function (result_u) {
                            if (result_u) {
                                log.info("钻石修改成功 用户:", _userinfo.userId);
                            } else {
                                log.err("钻石修改失败 用户:", _userinfo.userId);

                            }
                        });

                        //储存玩家游戏钻石变化量
                        if (!_userinfo.nolog) {
                            var info = {
                                userid: _userinfo.userId,
                                diamond_before: diamond_before,
                                diamond_change: diamond_change,
                                diamond_current: _userinfo.userDiamond,
                                change_type: (_userinfo.gameId + 10),
                                isOnline: true,
                                ChannelType: this.userList[_userinfo.userId]._ChannelType
                            }
                            this.diamond_changeLogList.push(info);
                        }
                    }
                }

            }
        };

        this.deleteUserNoLoginGame = function (userid, flag) {
            if (this.userList[userid]) {
                //console.log("进入这里" + this.userList[userid].getRoomId())
                if (!this.userList[userid].getGameId() && !this.userList[userid]._ageinLogin) {
                    delete this.userList[userid];
                    --this.onlinePlayerCount;
                    //console.log("未登录游戏离线!同时在线:" + this.onlinePlayerCount + "人")
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

        // 查询商品价值
        this.searchShopItemValue = function (id, callback) {
            shopping_dao.selectGoodsInfo(id, callback);
        };

        //获得用户
        this.getUser = function (_userId) {
            if (_userId) {
                return this.userList[_userId];
            }
        };

        this.getUserTicket = function (_userId, callback) {
            var giftTicket = 0;
            if (_userId && this.userList[_userId]) {
                //用户在线
                giftTicket = this.userList[_userId]._giftTicket;
                callback(giftTicket);
            } else {
                //去数据库拿
                dao.getScore(_userId, function (Result, rows) {
                    if (Result) {
                        callback(rows.giftTicket);
                    } else {
                        callback(-1);
                    }
                })
            }
        };

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
            //获得商品配置
            shopping_dao.selectGoodsInfo(productId, callback =>{
                if(!callback){
                    socket.emit('ShoppingResult', '{"status":1,"msg":"商品不存在"}');
                }else{
                    // 购买金币
                    try {
                        // 查询购买的金币道具的数量和价值
                        this.searchShopItemValue(productId, callback => {
                            if (callback) {
                                const score = callback[0]['val'] * count;
                                this.addUserscore(userId, score);
                                console.log('购买成功 用户增加积分', score, '扣减账户余额');
                                socket.emit('ShoppingResult', '{"status":0,"msg":"购买成功"}');
                                this.addgold(userId, score, callback =>{
                                    if(callback){
                                        console.log('用户在游戏内 用户增加积分成功', score);
                                    }
                                });
                            }else{
                                socket.emit('ShoppingResult', '{"status":1,"msg":"购买失败"}');
                            }
                        });
                    }catch (e) {
                        log.err(e);
                        socket.emit('ShoppingResult', '{"status":1,"msg":"购买失败"}');
                    }
                }
            });
        };

        //保存所有用户
        this.saveAll = function () {
            dao.saveAll(this.userList, function (Result) {

            })
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
        this.adddiamond = function (_userId, score, callback) {

            if (!_userId) {					//传输ID错误
                console.log("加分,未登录")
                return 0;
            }
            if (!this.userList[_userId]) {	//未找到用户
                console.log("加分,未登录")
                return 0
            } else {
                //console.log(ServerInfo)
                var gameScoket = ServerInfo.getScoket(this.userList[_userId].getGameId())
                //console.log("1111");
                var self = this;
                gameScoket.emit('adddiamond', {userid: _userId, adddiamond: score})
                gameScoket.on('adddiamondResult', function (msg) {
                    //console.log(msg);
                    if (msg.Result) {
                        //可以成功加减分
                        var diamond_before = self.userList[_userId].getDiamond();
                        self.userList[_userId].adddiamond(score)
                        callback(1, diamond_before);
                    } else {
                        callback(0)
                    }
                    gameScoket.removeAllListeners('adddiamondResult');
                })
            }

        };


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
                if (gametype != 13900) {
                    this.userList[_userId].loginGame(gametype);
                }
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

        this.updateLogin = function () {

            for (i = 0; i < this._loginList.length; i++) {
                if (this.userList[this._loginList[i].id]) {
                    //存在,让他下线
                    if (this.userList[this._loginList[i].id].getGameId()) {
                        //1.游戏状态
                        //先让游戏下线,然后再新开一个用户
                        if (this._loginList[i].state != 4) {
                            log.info(this._loginList[i].id + "当前用户在线" + this.userList[this._loginList[i].id].getGameId() + "被强制下线");
                            var gameScoket = ServerInfo.getScoket(this.userList[this._loginList[i].id].getGameId())
                            this.userList[this._loginList[i].id]._socket.disconnect();
                            if(gameScoket) gameScoket.emit('disconnectUser', {userId: this._loginList[i].id})
                            try {
                                ServerInfo.getScoket(13900).emit('disconnectUser', {userId: this._loginList[i].id})//断开俱乐部
                            } catch (e) {
                                console.log("用户13900服务器断开 try catch server game 819行")
                            }

                            this._loginList[i].state = 4;
                        } else {
                            log.info("等待游戏服务器过来删除" + this._loginList[i].id);
                            ++this._loginList[i].AutoOutCount;
                            if (this._loginList[i].AutoOutCount > 100) {
                                delete this.userList[this._loginList[i].id];
                            }
                        }


                        //this.userList[userInfo.Id].changeSocke(socket,sign);
                    } else {
                        log.info(this._loginList[i].id + "用户只在登录服务器被强制下线");
                        //先判断socket 是否有真的连接
                        if (this.userList[this._loginList[i].id]._socket.connected) {
                            if (this._loginList[i].state == 1) {
                                this.userList[this._loginList[i].id]._socket.disconnect();
                                try {
                                    ServerInfo.getScoket(13900).emit('disconnectUser', {userId: this._loginList[i].id})//断开俱乐部
                                } catch (e) {
                                    console.log("server 13900断开失败 disconnectUser")
                                }

                                this._loginList[i].state = 2;

                            }
                        } else if (!this.userList[this._loginList[i].id].deleteFlag) {
                            delete this.userList[this._loginList[i].id];
                            //--this.onlinePlayerCount;
                            //console.log("离线!同时在线:" + this.onlinePlayerCount + "人")
                        }
                    }
                } else {
                    //完全不在线了,再让他登录一下
                    log.info(this._loginList[i].id + "完全下线了");
                    var self = this;
                    this._loginList[i].state = 3;
                    dao.login(this._loginList[i], this._loginList[i].socket, function (state, rows) {
                        if (!state) {
                            //如果状态不为3
                            if (self.getLoginState(rows.Account, 3)) {
                                //如果状态为3,才添加
                                self.deleteLoginList(rows.Account);
                                self.addUser(rows, rows.socket, function (rusult) {
                                    log.info("完成添加")
                                });

                            } else {
                                console.log("状态不为3,又重新登录了")
                            }

                        } else if (state == 1) {
                            var result = {};
                            result = {resultid: 0, msg: 'Account or password error,login fail!'};
                            socket.emit('loginResult', result);
                            log.info(user)
                            log.info("登录失败!");
                        } else if (state == 2) {
                            var result = {};
                            result = {resultid: -1, msg: 'This account is disabled!'};
                            socket.emit('loginResult', result);
                            log.info("登录失败,帐号被停用!");
                        }
                    })
                }
            }
        };


        //兑换电话费
        this.exchange = function (_userId, _info, io) {

            //_info.proId 道具ID
            //_info.proCount 道具数量
            var cost = 0;
            //用户存在
            if (!this.userList[_userId]) {
                return;
            }

            if (!this.userList[_userId]._phoneNo) {
                this.userList[_userId]._socket.emit('exchangeResult', {Result: 0, msg: "您未绑定手机"});
                return;
            }

            if (!(_info.proCount == 20 || _info.proCount == 50 || _info.proCount == 100)) {
                this.userList[_userId]._socket.emit('exchangeResult', {Result: 0, msg: "道具数量错误"});
                return;
            }

            var firstValue = 1;
            if (!this.userList[_userId]._firstexchange) {
                firstValue = 0.5
            }

            switch (_info.proCount) {
                case 20:
                    _info.deleteCount = Math.floor((_info.proCount * 10) + 0.1);
                    // if (this.userList[_userId]._score < 600 * firstValue){
                    // 	this.userList[_userId]._socket.emit('exchangeResult',{Result:0,msg:"金币不足" + 600 * firstValue});
                    // 	return;
                    // }
                    // cost = 600;
                    break;
                case 50:
                    _info.deleteCount = Math.floor((_info.proCount * 9.6) + 0.1);
                    // if (this.userList[_userId]._score < 1300 * firstValue){
                    // 	this.userList[_userId]._socket.emit('exchangeResult',{Result:0,msg:"金币不足" + 1300 * firstValue});
                    // 	return;
                    // }
                    // cost = 1300;
                    break;
                case 100:
                    _info.deleteCount = Math.floor((_info.proCount * 9.2) + 0.1);
                    // if (this.userList[_userId]._score < 2400 * firstValue){
                    // 	this.userList[_userId]._socket.emit('exchangeResult',{Result:0,msg:"金币不足" + 2400 * firstValue});
                    // 	return;
                    // }
                    //
                    // cost = 2400;
                    break;
            }
            if (!this.userList[_userId]._proList[1] || this.userList[_userId]._proList[1] < _info.deleteCount) {
                this.userList[_userId]._socket.emit('exchangeResult', {Result: 0, msg: "道具数量不足"});
                return;
            }

            console.log(_info.deleteCount);

            console.log(this.userList[_userId]._proList[1]);

            var info = {
                Type: 'A1',
                Account: this.userList[_userId]._userId,
                PhoneNo: this.userList[_userId]._phoneNo,
                OrderId: '1',
                CardNum: _info.proCount,
                Key: '89b5b987124d2ec3'
            };

            this.userList[_userId]._firstexchange = true;

            //调用接口
            //返回后
            //发送兑换结果
            //减掉道具
            //存储兑换记录
            var self = this;
            Post.postExchange(info, function (rusult) {
                if (rusult) {
                    self.userList[_userId]._proList[1] -= _info.deleteCount;
                    var myNowScore = self.userList[_userId]._score;
                    self.userList[_userId]._score -= (cost * firstValue);
                    var NowScore = self.userList[_userId]._score;
                    //console.log(self.userList[_userId]._score)
                    var info = {userId: _userId, propId: 1, propCount: -_info.deleteCount, roomid: 0, typeid: 2}
                    dao.updateProp(info, function (result) {
                    });
                    dao.updateFirstexchange(_userId);

                    var score_change = parseInt(cost * firstValue);
                    var userInfo = {
                        userid: _userId,
                        score_before: myNowScore,
                        score_change: -score_change,
                        score_current: NowScore,
                        change_type: 4,
                        isOnline: true
                    };
                    self.score_changeLogList.push(userInfo);

                    self.userList[_userId]._socket.emit('exchangeResult', {
                        Result: 1,
                        msg: "兑换成功",
                        deleteCount: -_info.deleteCount,
                        deleteCoin: -(cost * firstValue)
                    });
                    io.sockets.emit('noticeMsg', {
                        nickname: self.userList[_userId]._nickname,
                        msg: "成功兑换" + _info.proCount + "元电话卡!"
                    });

                }

            });

            return;
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
                log.err("更新用户ID,用户" + _userId + "不存在");
                _socket.emit('updateHeadUrlResult', {Result: 1, msg: "ID不存在"});
                return;
            }

            //头像
            if (_info.url == "") {
                _socket.emit('updateHeadUrlResult', {Result: 2, msg: "头像不能为空"});
                return;
            }
            var self = this;

            dao.updateHeadUrl(_socket.userId, _info.url, function (result, head_url) {
                if (self.userList[_socket.userId]) {
                    if (result) {
                        //log.info("发送" + _socket.userId + "检测ID");
                        self.userList[_socket.userId]._headimgurl = _info.url;
                        self.userList[_socket.userId]._socket.emit("updateHeadUrlResult", {
                            Result: 0,
                            msg: "修改成功",
                            url: _info.url
                        });
                    } else {
                        self.userList[_socket.userId]._socket.emit("updateHeadUrlResult", {Result: 3, msg: "修改失败"});
                    }
                }
            });
        }


        //绑定支付宝
        this.bindZhifubao = function (_socket, _info) {
            if (!this.userList[_socket.userId]) {
                log.err("绑定支付宝,用户" + _userId + "不存在");
                _socket.emit('bindZhifubaoResult', {Result: 1, msg: "ID不存在"});
                return;
            }

            //支付宝账号
            //支付宝真实名字
            if (_info.zhifubao == "") {
                _socket.emit('bindZhifubaoResult', {Result: 2, msg: "绑定支付宝账号不能为空"});
                return;
            }

            if (_info.name == "") {
                _socket.emit('bindZhifubaoResult', {Result: 3, msg: "绑定支付宝实名制名字不能为空"});
                return;
            }

            if (this.userList[_socket.userId]._zhifubaoEnd == 1) {
                _socket.emit('bindZhifubaoResult', {Result: 4, msg: "支付宝与帐号已经终生绑定"});
                return;
            }
            var self = this;

            dao.bindZhifubao(_socket.userId, _info.zhifubao, _info.name, function (result, nickName) {
                if (self.userList[_socket.userId]) {
                    if (!result) {
                        self.userList[_socket.userId]._zhifubao = _info.zhifubao;
                        self.userList[_socket.userId]._zhifubaoName = _info.name;
                        //log.info("发送" + _socket.userId + "检测ID");
                        self.userList[_socket.userId]._socket.emit("bindZhifubaoResult", {Result: 0, msg: "绑定支付宝成功"});
                    } else {
                        if (result == 1) {
                            self.userList[_socket.userId]._socket.emit("bindZhifubaoResult", {
                                Result: 4,
                                msg: "绑定支付宝已被绑定"
                            });
                        } else if (result == 2) {
                            self.userList[_socket.userId]._socket.emit("bindZhifubaoResult", {
                                Result: 5,
                                msg: "有订单正在兑换中"
                            });
                        }
                    }
                }
            });
        };


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

        //发送绑定手机验证码
        this.sendbindPhoneNo = function (_socket, _info) {
            //_info.phoneNo
            var phone = String(_info.phoneNo);

            //
            if (!_info.phoneNo || phone.length != 11) {
                _socket.emit('sendbindPhoneNoResult', {Result: 0, msg: "发送失败,手机号码错误"});
                return;
            }

            var info = {
                phone: phone,
                userId: _socket.userId
            };

            var self = this;
            //需要验证,这个号码是否已经绑定了
            //如果已经有手机号码了,不能再绑定
            dao.phoneCheck(info, function (ResultCode) {
                if (ResultCode) {
                    var info = {
                        Type: 'A2',
                        Account: String(_socket.userId),
                        PhoneNo: String(_info.phoneNo),
                        Key: '89b5b987124d2ec3'
                    }

                    //self.userList[_socket.userId].setPhoneNo(info.PhoneNo);
                    info.checkNo = String(self.userList[_socket.userId].newCheckNo());
                    self.checkNo[_socket.userId] = {phoneNo: info.PhoneNo, checkNo: info.checkNo};
                    Post.postbindPhone(info, function (rusult) {
                        if (rusult) {
                            _socket.emit('sendbindPhoneNoResult', {Result: 1, msg: "发送成功"});
                        } else {
                            _socket.emit('sendbindPhoneNoResult', {Result: 0, msg: "发送失败"});
                        }
                    });
                } else {
                    _socket.emit('sendbindPhoneNoResult', {Result: 0, msg: "此手机号码已绑定!"});
                }
            })

        };


        // 发送邮箱验证码
        this.sendEmailCode = function (_socket, toEmail) {
            // 邮箱地址校验
            if (!emailValidator(toEmail)) {
                _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_INPUT_ERROR.code, msg: ErrorCode.EMAIL_INPUT_ERROR.msg});
                return;
            }
            const verificationCode = SendEmail(toEmail,  callback =>{
                const expireKey = 'send_email_code_expire_' + toEmail;
                // 是否过期存储
                RedisUtil.set(expireKey, verificationCode).then(ret1 =>{
                    const key = 'send_email_code_' + toEmail;
                    RedisUtil.expire(key, 240).then(ret2 =>{
                        if(ret1 && ret2){
                            // 存储验证码
                            RedisUtil.set(key, verificationCode).then(result =>{
                                RedisUtil.expire(key, 180).then(r =>{
                                    if(result && r){
                                        log.info('邮箱验证码发送成功' + toEmail + 'code:' + verificationCode);
                                        _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_SUCCESS.code, msg: ErrorCode.EMAIL_CODE_SEND_SUCCESS.msg});
                                    }else{
                                        log.err('邮箱验证码发送失败' + toEmail);
                                        _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_FAILED.code, msg: ErrorCode.EMAIL_CODE_SEND_FAILED.msg});
                                    }
                                });
                            });
                        }else{
                            _socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_FAILED.code, msg: ErrorCode.EMAIL_CODE_SEND_FAILED.msg});
                        }
                    });
                });
            });
        };

        // 校验验证码
        this.register = function (_socket, email, code) {
            if(isNaN(code)){
                _socket.emit('registerResult', {code: ErrorCode.EMAIL_CODE_INPUT_ERROR.code, msg: ErrorCode.EMAIL_CODE_INPUT_ERROR.msg});
                return;
            }
            this.verifyEmailCode(email, code, callback =>{
                if(callback[0] === ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                    //判断邮箱是否注册
                    dao.emailSearch(email, exits =>{
                        if(exits){
                            _socket.emit('registerResult', {code: ErrorCode.ACCOUNT_REGISTERED_ERROR.code, msg: ErrorCode.ACCOUNT_REGISTERED_ERROR.msg});
                            return;
                        }
                        // 通过邮箱注册
                        dao.registerByEmail(_socket, email);
                    });
                }else{
                    _socket.emit('registerResult', {code: callback[0], msg: callback[1]});
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
                        } else if (verificationCode && expireCode === verificationCode) {
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

        //绑定手机
        this.bindPhone = function (_socket, _info) {

            if (!this.checkNo[_socket.userId]) {
                _socket.emit('bindPhoneResult', {Result: 0, msg: "未获取验证码"});
                return;
            }

            if (_info.phoneNo != this.checkNo[_socket.userId].phoneNo) {
                _socket.emit('bindPhoneResult', {Result: 0, msg: "手机号码错误"});
                return;
            }


            //this.checkNo[_socket.userId] = {phoneNo:info.PhoneNo,checkNo:info.checkNo};
            if (_info.checkNo == "" || _info.checkNo != this.checkNo[_socket.userId].checkNo) {
                _socket.emit('bindPhoneResult', {Result: 0, msg: "验证码错误"});
                return;
            }

            var password = String(_info.password);
            var pass = String(_info.password);
            if (!password || password.length < 6) {
                _socket.emit('bindPhoneResult', {Result: 0, msg: "密码位数不对或密码为空"});
                return;
            }


            var key_login = "89b5b9871@@@24d2ec3@*&^sexx$%^slxxx";
            var content = password + key_login;
            var md5_sign = crypto.createHash('md5');
            md5_sign.update(content);

            password = md5_sign.digest('hex');

            this.userList[_socket.userId].cleanCheckNo();

            var info = {phoneNo: _info.phoneNo, Id: _socket.userId, password: password, pass: pass};
            this.userList[_socket.userId].setPhoneNo(this.checkNo[_socket.userId].phoneNo);


            delete this.checkNo[_socket.userId];

            //数据库更新电话号码
            dao.SetPhoneNo(info, function (ResultCode) {
                if (ResultCode) {
                    _socket.emit('bindPhoneResult', {Result: 1, msg: "绑定成功"});
                } else {
                    _socket.emit('bindPhoneResult', {Result: -1, msg: "无法写入数据库"});
                }
            });

        }

        //获取未领奖列表
        this.getSendPrize = function (_userId, callback) {

            if (!this.userList[_userId]) {
                callback(0);
                return;
            }
            var self = this;
            dao.getSendPrize(_userId, function (result, rows) {
                var values = [];
                if (result) {
                    for (var i = 0; i < rows.length; i++) {
                        values.push({
                            id: rows[i].msgId,
                            propId: rows[i].winPropId,
                            propCount: rows[i].winPropCount,
                            winScore: rows[i].winScore,
                            rankidx: rows[i].rankIdx,
                            isGetPrize: rows[i].isGetPrize,
                            type: rows[i].type,
                            sendCoinUserId: rows[i].sendCoinUserId,
                            nickName: rows[i].nickName
                        });
                    }
                }
                if (self.userList[_userId]) {
                    self.userList[_userId]._prize = values;
                }

                callback(values);
            })
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

        this.addPrize = function (_info) {
            var self = this;
            dao.addPrize(_info, function (result, rows) {
                if (result) {
                    var values = [];
                    for (var i = 0; i < rows.length; i++) {
                        //查看当前ID的玩是否在线

                        //如果在线，发送通知
                        //并在添加自己领奖列表
                        if (rows[i].rankIdx) {
                            if (self.userList[rows[i].userId]) {
                                var prize = {
                                    id: rows[i].msgId,
                                    propId: rows[i].winPropId,
                                    propCount: rows[i].winPropCount,
                                    winScore: rows[i].winScore,
                                    rankidx: rows[i].rankIdx,
                                    isGetPrize: rows[i].isGetPrize,
                                    type: rows[i].type,
                                    sendCoinUserId: rows[i].sendCoinUserId,
                                    nickName: rows[i].nickName
                                };
                                self.userList[rows[i].userId]._socket.emit("addPrize", prize);
                                //判断是否已经有此条记录
                                var same = false;
                                if (self.userList[rows[i].userId] && self.userList[rows[i].userId]._prize) {
                                    for (var j = 0; j < self.userList[rows[i].userId]._prize.length; j++) {
                                        if (self.userList[rows[i].userId]._prize[j].id == prize.id) {
                                            same = true;
                                            break;
                                        }
                                    }
                                }

                                if (!same) {
                                    self.userList[rows[i].userId]._prize.push(prize);
                                }

                            }
                        }
                    }
                }
                //console.log(values);

                //self.userList[_userId]._prize = values;
            })
        };

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

        this.pisaveUser = function () {
            var self = this;

            var saveList = [];
            for (var k in this.tempuserList) {
                if (this.userList[this.tempuserList[k]._userId]) {

                } else {
                    log.err(this.tempuserList[k]._userId + "不存在");
                }

                if (this.tempuserList[k].loginEnd) {
                    saveList.push(this.tempuserList[k]);
                    delete this.tempuserList[k];
                }
            }
            if (saveList.length) {
                dao.saveUser(saveList, function (result) {
                    for (var i = 0; i < result.length; ++i) {
                        log.info("成功保存,删除用户" + result[i]._userId + " socre:" + result[i]._score + " diamond:" + result[i]._diamond);
                        delete self.userList[result[i]._userId];
                        --self.onlinePlayerCount;
                        //console.log("离线!同时在线:" + self.onlinePlayerCount + "人")
                    }
                });
            }
        };
        //定时存数据库
        this.pisaveUser2 = function () {
            var self = this;

            var saveList = [];
            for (var k in this.userList) {
                if (this.userList[k]._userId > 11000) {
                    saveList.push(this.userList[k]);
                }
            }
            if (saveList.length) {
                dao.saveUser(saveList, function (result) {

                });
            }
        };
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
        //商城商品列表
        this.getShopping_List = function (_socket) {
            shopping_dao.selectShopList((res) => {
                if (res === 0) {
                    _socket.emit("getShoppingResult", {ResultCode: 0, msg: "获取商城列表错误"});
                } else {
                    let result = {};
                    for (let i = 0; i < res.length; i++) {
                        if (result[res[i].type]) {
                            result[res[i].type].push(res[i]);
                        } else {
                            result[res[i].type] = [];
                            result[res[i].type].push(res[i]);
                        }
                    }
                    _socket.emit("getShoppingResult", {ResultCode: 1, result: result});
                }
            });
        };
        //获取用户收货信息
        this.getShopPlayerInfo = function (_socket) {
            shopping_dao.selectshouhuoInfo(_socket.userId, (res) => {
                if (res === 0) {
                    console.log("获取用户收货信息失败");
                } else {
                    _socket.emit("getShopPlayerInfoResult", {ResultCode: 1, result: res});
                }
            });
        };
        //更新用户收货信息
        this.updateShopPlayerInfo = function (_socket, _userInfo) {
            shopping_dao.newshouhuoInfo(_socket.userId, _userInfo.adress, _userInfo.userName, _userInfo.phone, (res) => {
                _socket.emit("updateShopPlayerInfoResult", {ResultCode: 1, result: res});
            });
        };
        //申请兑换
        this.requestGetShopItem = function (_socket, _info) {
            shopping_dao.selectshouhuoInfo(_socket.userId, (res) => {
                if (res == 0) {
                    _socket.emit("getShopPlayerInfoResult", {ResultCode: 0, msg: "获取用户收货信息失败"});
                } else {
                    shopping_dao.selectGoodsInfo(_info.id, (res1) => {
                        if (res1 == 0) {
                            _socket.emit("requestGetShopItemResult", {ResultCode: 0, msg: "获取商品信息失败"});
                            return;
                        }
                        let result = res1[0];
                        if (result.goodsNum < _info.needNum) {
                            _socket.emit("requestGetShopItemResult", {ResultCode: 0, msg: "商品剩余数量不足"});
                            return;
                        }
                        if (this.userList[_socket.userId].getDiamond() < result.goodsPrice * _info.needNum) {
                            _socket.emit("requestGetShopItemResult", {ResultCode: 0, msg: "印花不足"});
                            return;
                        }
                        let num = result.goodsNum - _info.needNum;
                        shopping_dao.updateGoodsInfo(_info.id, num, (res2) => {
                            if (res2 == 0) {
                                _socket.emit("requestGetShopItemResult", {ResultCode: 0, msg: "更新商品信息失败"});
                            } else {
                                let userItem = this.userList[_socket.userId];
                                userItem.adddiamond(-result.goodsPrice * _info.needNum);
                                userItem._socket.emit('sendDiamondResult', {
                                    Result: 1,
                                    diamond: -result.goodsPrice * _info.needNum,
                                    msg: "扣钻成功"
                                });

                                shopping_dao.newshouhuoRecord(_socket.userId, result.id, 1, result.goodsName, _info.needNum, result.goodsPrice, (res3) => {
                                    if (res3 == 0) {
                                        console.log("创建兑换记录失败");
                                    } else {
                                        console.log("创建兑换记录成功");
                                    }
                                });

                                _socket.emit("requestGetShopItemResult", {ResultCode: 1});
                            }
                        });
                    });
                }
            });

        };
        //获取商城兑换记录
        this.getShouhuoRecord = function (_socket) {
            shopping_dao.selectshouhuoRecord(_socket.userId, (res) => {
                if (res == 0) {
                    _socket.emit("getShouhuoRecordResult", {ResultCode: 0, msg: "未查到兑换记录"});
                } else {
                    _socket.emit("getShouhuoRecordResult", {ResultCode: 1, result: res});
                }
            });
        };
        //获取玩家任务信息
        this.getTaskInfo = function (_socket) {
            redis_dao.queryTask(_socket.userId, (res) => {
                if (res) {
                    let result = JSON.parse(res);
                    let date = new Date().getTime();
                    if (this.isCurrentWeek(result.loginTime)) {
                        if (this.isSameDay(result.loginTime, date)) {
                            _socket.emit("getTaskInfoResult", {
                                ResultCode: 1,
                                result: result,
                                coinList: activityConfig.everyCoin
                            });
                        } else {
                            redis_dao.saveTask(_socket.userId, result, (res) => {
                                if (res) {
                                    _socket.emit("getTaskInfoResult", {
                                        ResultCode: 1,
                                        result: res,
                                        coinList: activityConfig.everyCoin
                                    });
                                }
                            });
                        }
                    } else {
                        redis_dao.saveTask(_socket.userId, null, (res) => {
                            if (res) {
                                _socket.emit("getTaskInfoResult", {
                                    ResultCode: 1,
                                    result: res,
                                    coinList: activityConfig.everyCoin
                                });
                            }
                        });
                    }
                } else {
                    redis_dao.saveTask(_socket.userId, null, (res) => {
                        if (res) {
                            _socket.emit("getTaskInfoResult", {
                                ResultCode: 1,
                                result: res,
                                coinList: activityConfig.everyCoin
                            });
                        }
                    });
                }
            });
        };

        this.isSameDay = function (timeStampA, timeStampB) {
            let dateA = new Date(timeStampA);
            let dateB = new Date(timeStampB);
            return (dateA.setHours(0, 0, 0, 0) == dateB.setHours(0, 0, 0, 0));
        };

        this.isCurrentWeek = function (past) {
            const pastTime = new Date(past).getTime();
            const today = new Date(new Date().toLocaleDateString());
            let day = today.getDay();
            day = day == 0 ? 7 : day;
            const oneDayTime = 60 * 60 * 24 * 1000;
            const monday = new Date(today.getTime() - (oneDayTime * (day - 1)));
            const nextMonday = new Date(today.getTime() + (oneDayTime * (8 - day)));
            if (monday.getTime() <= pastTime && nextMonday.getTime() > pastTime) {
                return true
            } else {
                return false
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

        //报名
        this.ApplyMatch = function (_userId, roomid, _socket) {

            if (!this.userList[_userId]) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "用户不存在"});
                return;
            }


            if (!this.gameRank[roomid]) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "比赛roomid不存在"});
                return;
            }

            if (this.isMaintain()) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "维护模式,禁止报名!"});
                return;
            }

            if (this.gameRank[roomid]) {
                //console.log(this.gameRank[roomid]);
                for (var i = 0; i < this.gameRank[roomid].rank.length; i++) {
                    if (this.gameRank[roomid].rank[i].id == _userId) {
                        _socket.emit("applyMatchResult", {ResultCode: 2, msg: "已经报名了"})
                        return;
                    }
                }
            }

            //当前房间的报名的费用
            if (this.userList[_userId].getScore() < 100) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "金币不足"})
                return;
            }

            //比赛时间低于30秒禁止报名
            if (!this.gameRank[roomid].MatchLogin) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "比赛时间低于30秒禁止报名"})
                return;
            }

            if (!this.gameRank[roomid].ApplyFlag) {
                _socket.emit("applyMatchResult", {ResultCode: 0, msg: "现在不是比赛时间"})
                return;
            }

            //用户是否已经报名

            //报名成功
            var userInfo = {};
            userInfo.matchId = this.gameRank[roomid].randIdx;
            userInfo.userId = _userId;
            userInfo.score = 100;
            userInfo.lastTime = new Date();
            userInfo.roomType = roomid;
            userInfo._nickname = this.userList[_userId]._nickname;
            var self = this;
            dao.matchRandKing(userInfo, function (ResultCode) {
                self.userList[_userId]._score -= 100;
                //通知游戏服务器
                var gamesocket = ServerInfo.getScoket(roomid);
                gamesocket.emit("applyMatchResult", userInfo);
                _socket.emit("applyMatchResult", {ResultCode: 1, msg: "报名成功"})

            })

        };

        this.sendMsg = function (_userId, _info, io) {
            //喇叭数量是否够
            // if (!this.userList[_userId]._proList[2]){
            // 	this.userList[_userId]._socket.emit('sendMsgResult',{Result:0,msg:"道具数量不足"});
            // 	return;
            // }

            // //扣除喇叭
            // this.userList[_userId]._proList[2] -= 1;
            // var info = {userId:_userId,propId:2,propCount:-1}
            // dao.updateProp(info,function(result){});


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


        //是否首次兑换
        this.getfirstexchange = function (_userId, callback) {

            if (!this.userList[_userId]) {
                callback(0);
                return;
            }

            var self = this;
            dao.getfirstexchange(_userId, function (result, rows) {
                if (result) {
                    //有些问题需要解决.
                    if (self.userList[_userId]) {
                        self.userList[_userId]._firstexchange = rows.firstexchange;
                        self.userList[_userId]._zhifubao = rows.zhifubao;
                        self.userList[_userId]._zhifubaoName = rows.zhifubaoName;
                        self.userList[_userId]._zhifubaoEnd = rows.zhifubaoEnd;
                        callback(rows);
                    }
                }
            })
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
        //修改用户银行密码
        this.updateUserBankPwd = function (socket, _info) {
            if (!this.userList[socket.userId]) {
                log.info("用户不在线,无法操作");
                socket.emit('updateBankpwdResult', {ResultCode: 0, msg: "用户不在线,无法操作"});
                return false;
            }

            if (!_info.newPwd || _info.newPwd.length < 6 || _info.newPwd.length > 30) {
                log.info("密码不能小于6位并不能大于30位");
                socket.emit('updateBankpwdResult', {ResultCode: 0, msg: "密码不能小于6位并不能大于30位"});
                return false;
            }

            if (_info.pwd == _info.newPwd) {
                log.info("新密码不能与旧密码一致");
                socket.emit('updateBankpwdResult', {ResultCode: 0, msg: "新密码不能与旧密码一致"});
                return false;
            }

            dao.updateBankPwdById(_info.newPwd, socket.userId, (result) => {
                socket.emit('updateBankpwdResult', {ResultCode: 1});
            });
        };
        //修改用户银行金币
        this.updateBankScore = function (socket, _info) {
            let newBscore = this.userList[socket.userId].bankScore + _info.saveCoin;
            dao.updateBankScoreById(newBscore, socket.userId, (result) => {
                console.log("更新银行分数结果" + result);
                this.userList[socket.userId].bankScore = this.userList[socket.userId].bankScore + _info.saveCoin;
                socket.emit('updateBankScoreResult', {
                    bankScore: this.userList[socket.userId].bankScore,
                    ResultCode: 1
                });
            });
            let userInfo = {
                sendUserId: socket.userId,
                sendCoin: -_info.saveCoin,
                change_type: 99999,
                diamond: 0
            };
            if (_info.saveCoin > 0) {
                this.GameBalanceSub(userInfo, (result) => {
                    console.log(result);
                });
            } else {
                this.GameBalance(userInfo);
            }
        };
        //发送API
        this.sendApi = function () {
            for (i = 0; i < this.sendApiList.length; i++) {
                --this.sendApiList[i].sendTime;
                if (!this.sendApiList[i].sendTime) {
                    //发送API
                    //console.log("发送API" + this.sendApiList[i].userid);
                    Post.sendApi(this.sendApiList[i].userid);
                    this.sendApiList.splice(i, 1);
                }
            }
        };

        this.getLv = function (_userId, callback) {
            dao.getWinCoin(_userId, function (result, row) {
                if (result) {
                    callback({lv: row.lv, exp: row.wincoin, nextExp: activityConfig.wincoinlv[row.lv + 1].value});
                } else {
                    callback({lv: 0, exp: 0, nextExp: activityConfig.wincoinlv[1].value});
                }
            })
        };

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
                    callback("充值失败！");
                    return;
                }
                if (res === 1) {
                    data.totalRecharge += parseInt(amount);
                    const housecard = data.housecard;

                    const vipConfig = updateConfig.getVipConfig();
                    // 计算VIP等级
                    let vipLevel = 0;
                    for(let i = 0; i < vipConfig.length; i++){
                        const config = vipConfig[i];
                        const minRecharge = config.minRecharge;
                        if(data.totalRecharge >= minRecharge){
                            vipLevel = config.level;
                        }
                        console.log(config);
                    }
                    // VIP升级
                    if(vipLevel > housecard){
                        // 更新VIP等级
                        this.updateVipLevel(userId, vipLevel, housecard);
                    }
                    // 修改累计充值
                    this.updateTotalCharge(userId, data.totalRecharge, amount);
                    callback("充值成功");
                }else{
                    callback("充值失败！");
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

        this.getScoreChange = function (_socket, _info) {
            dao.selectScoreChangeLog(_info.userid, (code, res) => {
                if (code) {
                    _socket.emit('getScoreChangeResult', {Result: 1, data: res});
                } else {
                    _socket.emit('getCoinLogResult', {Result: 0, msg: "未查到该用户相关记录"});
                }
            });
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
                //添加
                // console.log("----------------------------添加lineOutSet")
                // console.log(_info.serverId)
                // console.log(this.lineOutList)
                if (parseInt(_info.serverId) != 13900) {
                    // console.log("----------------------------进来了")
                    this.lineOutList[_info.userId] = {
                        gameId: _info.gameId,
                        serverId: _info.serverId,
                        tableId: _info.tableId,
                        seatId: _info.seatId,
                        tableKey: _info.tableKey
                    }
                    // console.log(_info)
                    // dao.saveLineOut(_info.userId)
                }

                console.log(this.lineOutList[_info.userId]);
            } else {
                //移除
                // dao.deleteLineOut(_info.userId)
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

        this.sendNotice = function (io) {
            const noticeConfig = updateConfig.getNoticeConfig();
            io.sockets.emit('noticeMsg', {msg: noticeConfig.msg, date: noticeConfig.date});
        };

        this.PostCoin = function () {
            //var nowDate = new Date();
            var nowDate = new Date();
            nowDate.setMinutes(nowDate.getMinutes() - 3, nowDate.getSeconds(), 0);
            nowDate = makeDate(nowDate);
            var self = this;
            dao.getScoreOut(nowDate, function (result, row) {
                if (result) {
                    var info = {
                        out_biz_no: row.out_trade_no,
                        payee_account: row.zfb_account,
                        amount: row.coin,
                        payee_real_name: row.zfb_name,
                        Key: '89b5b987124d2ec3'
                    };
                    //sconsole.log(info)
                    Post.postExchangeCoin(info, function (post_result, remark) {
                        if (!post_result) {
                            //告知玩家,支付宝帐号有错误，并退款
                            var info = {userId: row.userId, msg: '你的支付宝有误,重新绑定后,再试!'}
                            self.sendMsgToUserBySystem(info);
                            var userInfo = {sendUserId: row.userId, sendCoin: row.score, change_type: 2};
                            self.GameBalance(userInfo);
                            remark = remark.substring(0, 50);
                            post_result = 2;
                        }
                        self.updateScoreOut(row.out_trade_no, post_result, remark, function (result) {
                            switch (result) {
                                case 0:
                                    log.info("兑奖更新成功");
                                    break;
                                case 1:
                                    log.err("兑奖更新失败,找不到订单");
                                    break;
                            }
                        });
                    });

                } else {
                    //log.info("暂未有数据");
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
