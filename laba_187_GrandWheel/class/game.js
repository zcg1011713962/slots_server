const User = require("./User");
const gameDao = require("./../dao/gameDao");
const arithmetic = require("./arithmetic");
const sever = require("./sever");
const schedule = require("node-schedule");
const gameConfig = require("./../config/gameConfig");
const http_bc = require("./../../util/http_broadcast");
const redis_send_and_listen = require("./../../util/redis_send_and_listen");
const {getInstand: log} = require("../../CClass/class/loginfo");
const {getInstand: Config} = require("../config/read_config");
const LABA = require("../../util/laba");
const analyse_result = require("../../util/lottery_analyse_result");
const lottery_record = require("../../util/lottery_record");
//读取文件包


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

        //初始化游戏
        this.init = function () {
            console.log('####init game!####');

            //初始化算法
            this.initAlgorithm(0);
            //初始化用户列表
            this.userList = {};
            //在线人数为0
            this.onlinePlayerCount = 0;
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
                if (minute % 10 == 0 && second == 1) {
                    self.saveGamblingBalanceGold();
                    console.log("保存库存和奖池");
                    redis_send_and_listen.send_msg("OnlineUserMsg", {
                        server_id: gameConfig.serverId,
                        online_num: self.onlinePlayerCount
                    });
                }

                //推送奖池给玩家
                if (second % 20 == 0) {
                    let GamblingBalanceLevelBigWin = self.A.getGamblingBalanceLevelBigWin();
                    let nGamblingWinPool = GamblingBalanceLevelBigWin.nGamblingWinPool;
                    nGamblingWinPool = nGamblingWinPool > 0 ? nGamblingWinPool : 0;
                    let result = {
                        ResultCode: 1,
                        nGamblingWinPool: nGamblingWinPool + self.ranScore
                    };

                    for (let item in self.userList) {
                        self.userList[item]._socket.emit("pushGamblingWinPool", result);
                    }
                }
            });
        };

        this.tt = 0;
        this.lottery = function (userId, nBetSum, gameJackpot, redisIconTypeBind) {
            const dictAnalyseResult = {
                code: 2,
                nHandCards: [],  //# 结果手牌
                nWinLines: [],  //# 中奖的线数的检索
                nWinLinesDetail: [],  //# 中奖线数上中奖的牌的检索
                nWinDetail: [],  //# 每条线中多少钱
                nWinCards: [],  //# 位数与手牌数相同，中奖的为True，没中奖的为False
                getOpenBox: {
                    bFlag: false,
                    nWinOpenBox: 0
                },
                getFreeTime: {
                    bFlag: false,
                    nFreeTime: 0,
                    nIndex: 0
                },
                nBet: nBetSum, // # 下注总额
                win: 0,  //# 中奖总额
                fMultiple: 1,
                nBetTime: Number(new Date())
            };

            if (!userId) {					//传输ID错误
                console.log("未传用户ID");
                return {code: -1};
            }

            if (!this.userList[userId]) {	//未找到用户
                console.log("找不到用户");
                return {code: -1}
            }

            const lotteryResult = this.userList[userId].lottery(nBetSum);
            if (!lotteryResult) {
                log.info(userId + "分数不够");
                return {code: -2};
            }

            // 每条线下注的金额
            let len = Config.nGameLines.length;
            const nBetItem = nBetSum / len;
            const nBetList = [];
            for (let i = 0; i < len; i++) {
                nBetList.push(nBetItem)
            }
            // 行
            const line_count = Config.line_count;
            const col_count = Config.col_count;
            // 生成图案数量
            const cardsNumber = line_count * col_count;
            // 图案
            const cards = Config.cards;
            // 图案下标对应的权重值
            const weight_two_array = Config.weight_two_array;
            // 图案倍数
            const icon_mul = Config.icon_mul;
            // 免费图案
            const freeCard = Config.free_card;
            // 中普通图案出现的最少次数
            const nGameLineWinLowerLimitCardNumber = Config.line_win_lower_limit;
            // 中jackpot出现的最少次数
            const jackpotCardLowerLimit = Config.icon_jackpot_lower_limit;
            // jackpot图案
            const jackpotCard = Config.jackpot_card;
            // 万能图案
            const nGameMagicCardIndex = Config.nGameMagicCard;
            // 游戏奖池比例
            const jackpotRatio = Config.jackpot_ratio;
            // 玩家下注
            const jackpotLevelMoney = Config.jackpot_level_money;
            // 奖池挡位
            const jackpotLevelProb = Config.jackpot_level_prob;
            //
            const betJackpotLevelBet = Config.bet_jackpot_level_bet;
            //
            const betJackpotLevelIndex = Config.bet_jackpot_level_index;
            //
            const jackpotPayLevel = Config.jackpot_pay_level;
            // 配牌器开关
            const iconBindSwitch = Config.icon_bind_switch;
            // 配牌
            const iconTypeBind = redisIconTypeBind ? redisIconTypeBind : Config.icon_type_bind;
            // 免费次数[]
            const iconFreeTimes = Config.free_times;
            // 线的判断方向
            const nGameLineDirection = Config.line_direction;
            // 双向判断的情况下，如果两个方向都中奖，取大值或者取小值（True：取大值；False：取小值）
            const bGameLineRule = Config.line_rule;
            // 中奖图案角标
            const nGameLines = Config.nGameLines;
            //
            const target_rtp_start_position = 10;
            // 免费卡对应次数
            let freeTimes = 0;
            if(freeCard){
                freeTimes = iconFreeTimes[freeCard];
            }

            //用户金币
            const score_before = this.userList[userId].getScore();
            //获取免费次数
            const sourceFreeCount = this.userList[userId].getFreeCount();
            const GamblingBalanceLevelBigWin = this.A.getGamblingBalanceLevelBigWin();
            // 水位
            const nGamblingWaterLevelGold = GamblingBalanceLevelBigWin.nGamblingWaterLevelGold;
            // 大奖幸运等级
            const nGamblingBigWinLevel = GamblingBalanceLevelBigWin.nGamblingBigWinLevel;
            // 大奖幸运概率
            const nGamblingBigWinLuck = GamblingBalanceLevelBigWin.nGamblingBigWinLuck;
            // 幸运大奖
            const is_luck = false;
            // 目标RTP
            const expectRTP = GamblingBalanceLevelBigWin.expectRTP;


            // 进入奖池的钱
            const addJackpot = nBetSum * parseInt(nGamblingWaterLevelGold) / 100;
            // 进入库存的钱
            const addBalance = nBetSum - addJackpot;
            // 增加库存和奖池ll
            this.A.addGamblingBalanceGold(addBalance, addJackpot);


            let nHandCards = [];
            let win = 0;
            let winJackpot = 0;
            let fin_value = 0;
            let source_rtp = 0;
            // 生成图案，分析结果（结果不满意继续）
            while (true) {
                if(jackpotCard){
                    // 分析jackpot
                    winJackpot = LABA.JackpotAnalyse(gameJackpot, nBetSum, jackpotRatio, jackpotLevelMoney , jackpotLevelProb,betJackpotLevelBet, betJackpotLevelIndex, jackpotPayLevel);
                }
                // 生成图案
                nHandCards = LABA.createHandCards(cards, weight_two_array, col_count, line_count, cardsNumber, jackpotCard, iconBindSwitch, iconTypeBind, winJackpot);
                // 分析图案
                LABA.HandCardsAnalyse_Single_Simple(nHandCards, cards, nGameLines, icon_mul, nGameMagicCardIndex, nBetSum, cardsNumber, dictAnalyseResult);

                // 图案连线奖
                win =  dictAnalyseResult["win"];
                // 图案最终价值
                fin_value = win + winJackpot;
                // 普通奖励不能大于库存，除非是开了配牌器
                if(!iconTypeBind && GamblingBalanceLevelBigWin.nGamblingBalanceGold < win){
                    continue;
                }
                break;
            }

            // 减少库存和奖池
            const winscore = parseInt(dictAnalyseResult["win"]) + winJackpot;
            if (winscore > 0) {
                this.A.subGamblingBalanceGold(winscore, winJackpot);
            }
            // 结果处理
            const user = this.userList[userId];
            const freeCount = dictAnalyseResult["getFreeTime"]["nFreeTime"];
            const resultArray = analyse_result.build(dictAnalyseResult, gameConfig.gameName, nHandCards, userId, nBetSum, winscore, freeCount, GamblingBalanceLevelBigWin, user, gameConfig.sendMessage_mul);
            // 剩余免费次数
            const resFreeCount = user.getFreeCount();
            const score_current = user.getScore();
            // 日志记录
            lottery_record.record(this._Csocket, nGameLines.length, gameConfig.serverId, gameConfig.gameId, userId, nBetSum, winscore, score_before, score_current, freeCount, sourceFreeCount,
                resFreeCount, gameConfig.logflag, this.lotteryLogList, this.score_changeLogList, resultArray);
            // 摇奖次数统计
            this.lotteryTimes(lotteryResult, winscore, nBetSum, fin_value);
            // 打印图案排列日志
            LABA.handCardLog(nHandCards, col_count, line_count,nBetSum, winscore, winJackpot, expectRTP);
            // 返回结果
            return analyse_result.lotteryReturn(score_current, winscore, freeCount, resFreeCount, dictAnalyseResult, 0);
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
            console.log("zaixianrenshu----------------------------------", this.onlinePlayerCount);
        };

        this.updateUser = function (userInfo) {
            //console.log("update")
            if (!this.userList[userInfo._userId]) return;

            //已经断线
            if (this.userList[userInfo._userId]._isLeave) {
                var result = {ResultCode: 0, userId: userInfo._userId};
                this._Csocket.emit("userDisconnect", result);
                delete this.userList[userInfo._userId];
                return;
            }
            this.userList[userInfo._userId].update(userInfo);

            this.LoginGame(userInfo._userId, this.serverId);
            ++this.onlinePlayerCount;

            let GamblingBalanceLevelBigWin = this.A.getGamblingBalanceLevelBigWin();
            let nGamblingWinPool = GamblingBalanceLevelBigWin.nGamblingWinPool;
            nGamblingWinPool = nGamblingWinPool > 0 ? nGamblingWinPool : 0;
            let resultObj = {
                account: this.userList[userInfo._userId]._account,
                id: this.userList[userInfo._userId]._userId,
                nickname: this.userList[userInfo._userId]._nickname,
                score: this.userList[userInfo._userId]._score,
                nGamblingWinPool: nGamblingWinPool + this.ranScore
            };
            result = {resultid: '1', msg: 'login lineserver succeed!', Obj: resultObj};
            this.userList[userInfo._userId]._socket.emit('loginGameResult', result);

        };

        //获得在线人数
        this.getOnlinePlayerCount = function () {
            return this.onlinePlayerCount;
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
                //gameDao.score_changeLog(saveListTemp);
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
                gameDao.lotteryLog(saveListLotteryLogTemp);
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
            if (_socket.userId) {
                //存免费次数
                var info = {
                    userId: _socket.userId,
                    freeCount: this.userList[_socket.userId].getFreeCount(),
                    LotteryCount: this.userList[_socket.userId].getLotteryCount()
                };
                gameDao.saveFree(info, function (result) {
                    if (!result)
                        logInfo.error("存免费次数:" + _userinfo.userId + "失败!")
                });
                this._Csocket.emit("lineOut", {
                    signCode: gameConfig.LoginServeSign,
                    state: 0,
                    gameId: gameConfig.gameId,
                    serverId: gameConfig.serverId,
                    userId: _socket.userId,
                    tableId: -1,
                    seatId: -1
                });
                this.sever.LogoutRoom(this.userList[_socket.userId], _socket);
                delete this.userList[_socket.userId];
                --this.onlinePlayerCount;
            }
        };

        //删除用户
        this.deleteUserById = function (_userId, msg) {
            if (_userId) {
                var socketItem = this.userList[_userId]._socket;
                result = {resultid: 0, msg: msg};
                socketItem.emit('loginGameResult', result);
                delete this.userList[_userId];
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
                console.log("查询分数,参数错误");
                return -1;
            }
            if (this.userList[_userId]) {//未找到用户
                //console.log("查询在线,未找到" + _userId + "用户");
                return this.userList[_userId].getScore();
            } else {
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
                console.log(score);
                if (this.userList[_userId].addgold(score)) {
                    console.log(this.userList[_userId].getScore());
                    console.log("加分成功!");
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

        //保存时间段输赢状况
        this.saveSocrePool = function () {
            //获得虚拟池
            var Virtualpool = this.A.getVirtualScorePool();
            //获得实际池
            var poollist = this.A.getScorePoolList();

            //var poollistLength = this.A.getScorePoolListLength();

            var poollistId = this.A.getScoreId();

            gameDao.Update_score_pool(poollist, Virtualpool, poollistId, function (Result) {
            })
        };

        //保存库存 奖池
        this.saveGamblingBalanceGold = function () {
            //获得库存奖池
            var dict = this.A.getGamblingBalanceGold();

            gameDao.Update_GamblingBalanceGold(dict.nGamblingBalanceGold,function (Result) {
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
            //用户添加游戏ID
            //console.log(_userId)
            //console.log("用户进入游戏" + gametype);
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
            gameDao.getFreeCount(_userId, function (ResultCode, Result) {
                //console.log("**" + Result.Id);
                if (!self.userList[_userId]) return;
                Result.Id = _userId
                self.userList[_userId].updateFreeGame(Result);
                console.log("从数据库里获得免费次数" + Result.freeCount);

                var ResultData = {
                    TableId: LoginResult.tableId,
                    seatId: LoginResult.seatId,
                    userList: tableUserList,
                    freeCount: self.userList[_userId].getFreeCount(),
                    score_pool: self.A.getVirtualScorePool()
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
            var self = this;
            gameDao.getFreeCount(_userId, function (ResultCode, Result) {
                if (!self.userList[_userId]) return;
                Result.Id = _userId;
                self.userList[_userId].updateFreeGame(Result);
                console.log("从数据库里获得免费次数" + Result.freeCount);
                _socket.emit("LoginfreeCountResult", {ResultCode: 1, freeCount: Result.freeCount});
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



function list_one_count(x, list) {
    //数组中指定值出现次数
    var count = 0;
    for (var i in list) {
        if (list[i] == x) {
            count++
        }
    }
    return count;
}


module.exports = GameInfo;

