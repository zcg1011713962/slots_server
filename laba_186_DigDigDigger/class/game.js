const User = require("./User");
const gameDao = require("../../util/dao/gameDao");
const arithmetic = require("./arithmetic");
const sever = require("./sever");
const schedule = require("node-schedule");
const gameConfig = require("./../config/gameConfig");
const http_bc = require("./../../util/http_broadcast");
const redis_send_and_listen = require("./../../util/redis_send_and_listen");
const {getInstand: Config} = require("../config/read_config");
const LABA = require("../../util/laba");
const analyse_result = require("../../util/lottery_analyse_result");
const lottery_record = require("../../util/lottery_record");
const CacheUtil = require("../../util/cache_util");
const dao = require('../../util/dao/dao');
const {getInstand: log} = require("../../CClass/class/loginfo");

var GameInfo = function () {

    var _gameinfo = "";

    var Game = function () {

        //初始化算法，使用第X种
        this.initAlgorithm = function (idx) {
            console.log('####init Algorithm!####');
            console.log('use [' + idx + '] Algorithm!');
            this.A = new arithmetic(idx);
        };

        this.serverId = gameConfig.serverId;
        this.gameName = gameConfig.gameName;
        this.gameId = gameConfig.gameId;

        //初始化游戏
        this.init = function () {
            console.log('####init game!####');

            //初始化算法
            this.initAlgorithm(0);
            //初始化用户列表
            this.userList = {};
            //统计
            this.winTotal = 0;
            this.lotteryCount = 0;
            this.hourWinTotal = 0;
            this.hourlotteryCount = 0;

            this.score_changeLogList = [];
            this.lotteryLogList = [];
            this.lineOutList = [];
            //维护模式
            this.maintain = false;

            this.sever = new sever();

            this.ranScore = Math.floor(Math.random() * 900000000 + 100000000);
            var rule = new schedule.RecurrenceRule();
            var times = [];
            for (var i = 0; i < 60; i++) {
                times.push(i);
            }
            rule.second = times;
            var self = this;
            schedule.scheduleJob(rule, function () {
                if (gameConfig.maintain) {
                    --gameConfig.maintainTime;
                    //console.log(gameConfig.maintainTime);;
                    if (!gameConfig.maintainTime) {
                        self.disconnectAllUser();
                    }
                }

                self.score_changeLog();
                self.lotteryLog();
                var nowDate = new Date();
                var minute = nowDate.getMinutes();
                var second = nowDate.getSeconds();

                //推送奖池给玩家
                if (second % 10 === 0) {
                    CacheUtil.pushGameJackpot(self.userList);
                }
            });
        };

        this.lotteryTimes = function (lotteryResult, winscore, nBetSum, fin_value) {
            // 服务器统计
            ++this.lotteryCount;
            ++this.hourlotteryCount;
            this.totalBet += nBetSum;
            this.totalBackBet += fin_value;
            if (lotteryResult === 1) {
                // 使用金币
                this.winTotal += (winscore - nBetSum);
            } else if (lotteryResult === 2) {
                // 使用免费次数
                this.winTotal += winscore;
            }
        }

        this.setIo = function (_io, _Csocket) {
            this.sever.setIo(_io, _Csocket);
            this._io = _io;
            this._Csocket = _Csocket;
        };


        this.Setmaintain = function () {
            gameConfig.maintain = true;
        };

        this.isMaintain = function () {
            return gameConfig.maintain;
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
        this.addUser = function (_userInfo, socket) {
            this.userList[_userInfo.userid] = new User(_userInfo, socket);
        };

        // 更新用户
        this.updateUser = function (userInfo) {
            const userId = userInfo.userId;
            if (!this.userList[userId]) {
                log.err(userId + '用户不在线')
                return;
            }
            let result = {};
            //已经断线
            if (this.userList[userId]._isLeave) {
                log.info(userId + '用户已经断线')
                result = {ResultCode: 0, userId: userId};
                this._Csocket.emit("userDisconnect", result);
                delete this.userList[userId];
                return;
            }

            this.userList[userId].update(userInfo);

            this.LoginGame(userInfo.userId, this.serverId);

            CacheUtil.getGameJackpot((gameJackpot, grandJackpot, majorJackpot, minorJackpot, miniJackpot, jackpotConfig) =>{
                try {
                    CacheUtil.getGameConfig(this.gameName, this.gameId).then(config => {
                        const icon_mul = config.icon_mul.reduce((acc, curr) => {
                            return acc.concat(curr);
                        }, []);
                        let resultObj = {
                            account: userInfo.account,
                            id: userInfo.userId,
                            nickname: userInfo.nickname,
                            score: userInfo.score,
                            priceList: icon_mul,
                            jackpot: {
                                gameJackpot: gameJackpot,
                                grand_jackpot: grandJackpot,
                                major_jackpot: majorJackpot,
                                minor_jackpot: minorJackpot,
                                mini_jackpot: miniJackpot
                            }
                        };
                        result = {resultid: '1', msg: 'login lineserver succeed!', Obj: resultObj};
                        log.info(userId + '给用户回应登录结果' + JSON.stringify(result))
                        this.userList[userId]._socket.emit('loginGameResult', result);
                    })
                }catch (e){
                    log.err('给用户回应登录结果:' + e)
                }
            })
        };

        //获得在线人数
        this.getOnlinePlayerCount = function () {
            return Object.keys(this.userList).length;
        };

        //在线所有人
        this.getOnlinePlayer = function () {
            return this.userList;
        };

        this.score_changeLog = function () {
            var self = this;
            var saveListTemp = [];
            var ItemTemp;
            var max = 0;
            if (this.score_changeLogList.length > 200) {
                max = 200;
            } else {
                max = this.score_changeLogList.length;
            }
            for (var i = 0; i < max; i++) {
                if (this.score_changeLogList.length > 0) {
                    ItemTemp = this.score_changeLogList.shift();
                    saveListTemp.push(ItemTemp);
                }
            }
            if (saveListTemp.length > 0) {
                this._Csocket.emit("score_changeLog", saveListTemp);
            }
        };

        this.lotteryLog = function () {
            var self = this;
            var saveListLotteryLogTemp = [];
            var ItemTemp;
            var max = 0;
            if (this.lotteryLogList.length > 200) {
                max = 200;
            } else {
                max = this.lotteryLogList.length;
            }
            for (var i = 0; i < max; i++) {
                if (this.lotteryLogList.length > 0) {
                    ItemTemp = this.lotteryLogList.shift();
                    saveListLotteryLogTemp.push(ItemTemp);
                }
            }
            if (saveListLotteryLogTemp.length > 0) {
                gameDao.lotteryLog(gameConfig.gameId, saveListLotteryLogTemp);
            }
        };

        //保存库存 奖池
        this.getHistory = function (_userId, _socket) {
            gameDao.getLotteryLog(_userId, function (Result) {
                if (Result) {
                    _socket.emit('historyResult', {ResultCode: 1, Result: Result});
                } else {
                    _socket.emit('historyResult', {ResultCode: 0});
                }
            });
        };

        //删除用户
        this.deleteUser = function (_socket) {
            let userId = _socket.userId;
            const self = this;
            if (userId) {
                CacheUtil.getFreeCount(userId).then(freeCount =>{
                    let gameDict = {
                        freeSymbolList: this.userList[_socket.userId].freeSymbolList,
                    };
                    //存免费次数
                    const info = {
                        userId: userId,
                        freeCount: freeCount,
                        LotteryCount: 0,
                        gameDict: JSON.stringify(gameDict)
                    };
                    gameDao.saveDigDigDiggerFree(gameConfig.gameId, info, function (result) {
                        log.info(userId + '保存免费次数' + info.freeCount);
                        self._Csocket.emit("lineOut", {
                            signCode: gameConfig.LoginServeSign,
                            state: 0,
                            gameId: gameConfig.gameId,
                            serverId: gameConfig.serverId,
                            userId: userId,
                            tableId: -1,
                            seatId: -1
                        });
                        delete self.userList[userId];
                        log.info(userId + '离开游戏,移除用户,当前游戏人数:' + self.getOnlinePlayerCount())
                        userId = null;
                    });
                })
            }
        };

        //删除用户
        this.deleteUserById = function (_userId, msg) {
            if (_userId) {
                var socketItem = this.userList[_userId]._socket;
                result = {resultid: 0, msg: msg};
                log.info(_userId + '给用户回应登录结果' + result)
                socketItem.emit('loginGameResult', result);
                delete this.userList[_userId];
            }else{
                log.err('非法的用户')
            }
        };

        //获得用户当前分数
        this.getUserscore = function (_userId) {
            if (_userId) {
                return this.userList[_userId]._score;
            }
        };

        //获得用户
        this.getUser = function (_userId) {
            if (_userId) {
                return this.userList[_userId];
            }
        };

        //用户是否在线
        this.IsPlayerOnline = function (_userId) {
            if (!_userId) {	//传输ID错误
                console.log("查询在线,参数错误");
                return -1;
            }
            if (this.userList[_userId]) {//未找到用户
                //console.log("查询在线,未找到" + _userId + "用户");
                return 1;
            } else {
                return 0;
            }
        };

        //获得用户当前分数
        this.getPlayerScore = function (_userId) {
            if (!_userId) {	//传输ID错误
                log.info('==========================查询分数,参数错误"');
                return -1;
            }
            if (this.userList[_userId]) {//未找到用户
                return this.userList[_userId].getScore();
            } else {
                log.info('=============================用户不在线');
                return -1;
            }
        };

        //GM加分
        this.addgold = function (_userId, score) {

            if (!_userId) {					//传输ID错误
                console.log("加分,未登录");
                return 0;
            }
            if (!this.userList[_userId]) {	//未找到用户
                console.log("加分,未登录");
                return 0
            } else {
                if (this.userList[_userId].addgold(score)) {
                    log.info('游戏内增加金币:' + score + '当前金币:' + this.userList[_userId].getScore())

                    var tablestring = "table" + this.userList[_userId].getTable();
                    this._io.sockets.in(tablestring).emit('addgoldResult', {
                        userId: _userId,
                        userSeatId: this.userList[_userId].getSeat(),
                        userScore: this.userList[_userId]._score
                    });
                    return 1;
                } else {
                    console.log("减分失败,大于用户分数!");
                    return 0;
                }
            }
        };


        this.batchUpdateOnLineAccount = function () {
            let saveList = [];
            for (const k in this.userList) {
                saveList.push(this.userList[k]);
            }
            if (saveList.length < 1) {
                return;
            }
            dao.batchUpdateAccount(saveList, function (users) {
                const seconds = new Date().getSeconds()
                if(users){
                    for (let i = 0; i < users.length; ++i) {
                        if(seconds % 5 === 0)  log.info("成功保存在线用户信息" + users[i].id + '金币:' + users[i].score);
                    }
                }
                saveList = [];
            });
        }

        //保存库存 奖池
        this.saveGamblingBalanceGold = function () {
            //获得库存奖池
            const dict = this.A.getGamblingBalanceGold();
            gameDao.Update_GamblingBalanceGold(dict.nGamblingBalanceGold, dict.nSysBalanceGold, function (Result) {
            })
        };

        this.updateGamblingBalanceGold = function (_info) {
            console.log(_info.dataKey);
            switch (_info.dataKey) {
                case "nGamblingWaterLevelGold":
                    this.A.nGamblingWaterLevelGold = parseInt(_info.data);
                    console.log("水位:" + this.A.nGamblingWaterLevelGold);
                    break;
                case "nGamblingBalanceGold":
                    this.A.nGamblingBalanceGold = parseInt(_info.data);
                    console.log("库存:" + this.A.nGamblingBalanceGold);
                    break;
                case "nGamblingWinPool":
                    this.A.nGamblingWinPool = parseInt(_info.data);
                    console.log("奖池:" + this.A.nGamblingWinPool);
                    break;
                case "nGamblingBigWinLevel":
                    this.A.nGamblingBigWinLevel = _info.data.split(',').map(Number);
                    console.log("大奖幸运等级:" + this.A.nGamblingBigWinLevel);
                    break;
                case "nGamblingBigWinLuck":
                    this.A.nGamblingBigWinLuck = _info.data.split(',').map(Number);
                    console.log("大奖幸运概率:" + this.A.nGamblingBigWinLuck);
                    break;
                case "expectRTP":
                    this.A.expectRTP = parseInt(_info.data);
                    console.log("RTP:" + this.A.expectRTP);
                    break;
            }
        };

        //进入游戏
        this.LoginGame = function (_userId, gametype) {
            if (!this.userList[_userId]) return;
            this.userList[_userId].loginGame(gametype);
        };


        //进入房间
        this.LoginRoom = function (_userId, roomid, _socket) {
            if (!this.userList[_userId]) return;


            if (!this.userList[_userId].getGameId()) {
                console.log("用户" + _userId + ",没有进入任何游戏,进入房间");
                return;
            }

            if (this.userList[_userId].getSeat() != -1) {
                console.log("用户" + _userId + "已经有座位");
                return;
            }

            this.userList[_userId].loginRoom(roomid);
            var LoginResult;
            var linemsg = this.getLineOutMsg(_userId);
            if (linemsg.Result) {
                console.log("断线重连接table:" + linemsg.tableId + " seatid:" + linemsg.seatId);
                LoginResult = this.sever.LoginRoombyLineOut(this.getUser(_userId), _socket, linemsg.tableId, linemsg.seatId);
                this.lineOutSet({state: 0, userId: _userId});
            } else {
                LoginResult = this.sever.LoginRoom(this.getUser(_userId), _socket);
            }
            //进入房间后，帮分配座位
            // LoginResult
            //发送场景消息给当前用户
            var tableUserList = Array();

            for (var i = 0; i < this.sever.seatMax; i++) {
                //除了自己以外
                //console.log(LoginResult.tableId);
                //console.log(this.sever.tableList);
                if (this.sever.tableList[LoginResult.tableId][i] && this.sever.tableList[LoginResult.tableId][i] != _userId) {
                    var userItem = {};
                    var userid = this.sever.tableList[LoginResult.tableId][i];

                    if (this.userList[userid]) {
                        //先确定在线才能拿到相关信息
                        userItem.userId = this.userList[userid].getUserId();
                        userItem.seatId = this.userList[userid].getSeat();
                        userItem.nickname = this.userList[userid]._nickname;
                        userItem.score = this.userList[userid]._score;
                        userItem.userType = this.userList[userid]._Robot;
                        userItem.headimgurl = this.userList[userid]._headimgurl;
                        tableUserList.push(userItem);
                    }
                }
            }
            //发送场景消息
            //检查自己下注情况,效准玩家金额
            var self = this;
            gameDao.getFreeCount(gameConfig.gameId, _userId,  (ResultCode, Result) => {
                if (!self.userList[_userId]) return;
                Result.Id = _userId
                log.info(_userId + "从数据库里获得免费次数" + Result.freeCount);

                const ResultData = {
                    TableId: LoginResult.tableId,
                    seatId: LoginResult.seatId,
                    userList: tableUserList,
                    freeCount: self.userList[_userId].getFreeCount(),
                    score_pool: 0
                };
                _socket.emit("LoginRoomResult", {ResultCode: 1, ResultData: ResultData});

                if (!linemsg.Result) {
                    var tablestring = "table" + LoginResult.tableId;

                    _socket.broadcast.to(tablestring).emit('playEnter', {
                        ResultCode: 1,
                        ResultData: {
                            userId: _userId,
                            TableId: LoginResult.tableId,
                            seatId: LoginResult.seatId,
                            nickname: self.userList[_userId]._nickname,
                            score: self.userList[_userId]._score,
                            headimgurl: self.userList[_userId]._headimgurl,
                            userType: self.userList[_userId]._Robot
                        }
                    });
                }

            })

        };
        //登录获取免费次数
        this.LoginfreeCount = function (_userId, _socket) {
            const self = this;
            gameDao.getFreeCount(gameConfig.gameId, _userId, function (ResultCode, Result) {
                if (!self.userList[_userId]) return;
                Result.Id = _userId;
                let data = {};
                try {
                    data = JSON.parse(Result.gameDict);
                    Result.freeSymbolList = data.freeSymbolList ? data.freeSymbolList : [];
                    self.userList[_userId].setFreeSymbolList(Result.freeSymbolList)
                } catch (e) {
                    Result.freeSymbolList = [];
                }
                log.info(_userId + "从数据库里获得免费次数" + Result.freeCount + "免费模式的挖矿图标" + Result.freeSymbolList);
                CacheUtil.setFreeCount(_userId, Result.freeCount)
                _socket.emit("LoginfreeCountResult", {
                    ResultCode: 1,
                    freeCount: Result.freeCount,
                    cardList: Result.freeSymbolList
                });
            })
        };


        //断线保存
        this.lineOutSet = function (_info) {
            if (_info.state == 1) {
                //添加
                this.lineOutList[_info.userId] = {tableId: _info.tableId, seatId: _info.seatId}
                //console.log(this.lineOutList[_info.userId]);
            } else {
                //移除
                this._Csocket.emit("lineOut", {
                    signCode: gameConfig.LoginServeSign,
                    state: 0,
                    gameId: gameConfig.gameId,
                    userId: _info.userId
                });
                delete this.lineOutList[_info.userId];
            }
        };

        //获得断线用户信息
        this.getLineOutMsg = function (_userId) {
            if (this.lineOutList[_userId]) {
                this.lineOutList[_userId].Result = 1;
                return this.lineOutList[_userId];
            } else {
                return {Result: 0};
            }
        };

        //清楚断线用户信息
        this.cleanLineOut = function () {
            //清理登录服务器
            console.log(this.lineOutList);
            for (var Item in this.lineOutList) {
                Item = parseInt(Item);
                var tableid = this.lineOutList[Item].tableId;
                var tablestring = "table" + tableid;
                this._io.sockets.in(tablestring).emit('PlayerOut', {
                    PlayerSeatId: this.lineOutList[Item].seatId,
                    userId: Item
                });
                this.sever.cleanLineOut(tableid, this.lineOutList[Item].seatId);
                this._Csocket.emit("lineOut", {
                    signCode: gameConfig.LoginServeSign,
                    state: 0,
                    gameId: gameConfig.gameId,
                    userId: Item
                })
            }
            this.lineOutList = {};
        };

        this.disconnectAllUser = function () {
            for (var itme in this.userList) {
                this.userList[itme]._socket.disconnect();
            }
            console.log("服务器开启维护，已经全部离线");
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



module.exports = GameInfo;

