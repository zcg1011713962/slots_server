var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var signCode = "slel3@lsl334xx,deka";
var Cio = require('socket.io-client');
var log = require("./../CClass/class/loginfo").getInstand;
var gameInfo = require('./class/game').getInstand;
var gameConfig = require('./config/gameConfig');
const globalVariableModule = require("../util/global_variable_module");
const  Urls = require("../util/config/url_config");
const Lottery = require("../util/lottery");
const Config = require('./config/read_config').getInstand;
const CacheUtil = require("../util/cache_util");
const StringUtil = require("../util/string_util");


var Csocket = Cio(Urls.hall_url);
Csocket.on('disconnect', function (data) {
    console.log("登录服务器被断开")
});

Csocket.on('connected', function (msg) {console.log("与登录服务器进行连接......");
    var info = {
        serverName: "拉霸游戏_" + (gameConfig.gameId) + "_" + gameConfig.gameName,
        serverId: gameConfig.serverId,
        signCode: "slel3@lsl334xx,deka"
    };
    Csocket.emit('GameServerConnect', info)
});

Csocket.on('GameServerConnectResult', function (msg) {
    if (msg.resultCode) {
        console.log("连接成功");
    }
});


Csocket.on('LoginGameResult', function (msg) {
    if (!msg) {
        return;
    }
    log.info("登录" + gameConfig.gameName + "服务器回应:"+ JSON.stringify(msg));
    if (msg.ResultCode) {
        gameInfo.updateUser(msg.userInfo);
    } else {
        gameInfo.deleteUserById(msg.userid, msg.msg);
    }
});

Csocket.on('addgold', function (msg) {
    if (!msg) {
        return;
    }
    var result = gameInfo.addgold(msg.userid, msg.addgold);
    Csocket.emit('addgoldResult', {Result: result});

    //当前用户桌子广播
    var User = gameInfo.getUser(msg.userid);
    if (User) {
        var tablestring = "table" + User.getTable();
        io.sockets.in(tablestring).emit('userGoldUpdate', {userId: msg.userid, updateSocre: User.getScore()});
    }
});

Csocket.on('getgold', function (msg) {
    if (!msg) {
        return;
    }
    var score = gameInfo.getPlayerScore(msg.userid);
    Csocket.emit('getgoldResult', {Result: 1, score: score});
});

Csocket.on('disconnectUser', function (msg) {
    //console.log("disconnectUser" + msg.userId);
    var list = gameInfo.getOnlinePlayer();
    if (list[msg.userId]) {
        list[msg.userId]._socket.disconnect();
    } else {
        console.log("用户不存在");
        var result = {ResultCode: 0, userId: msg.userId};
        Csocket.emit("userDisconnect", result);
    }
});


Csocket.on('applyMatchResult', function (_info) {
    gameInfo.addRankUserList(_info);
});


Csocket.on('Setmaintain', function () {
    gameInfo.Setmaintain();
});

Csocket.on('updateGamblingGame', function (_info) {
    try {
        let data = JSON.parse(_info);
        _info = data;
    } catch (e) {
        log.warn('LoginGame-json');
    }
    gameInfo.updateGamblingBalanceGold(_info);
});

// 获取游戏配置
Csocket.on('bindCards', function (cards) {
    log.info('配牌' + cards);
    globalVariableModule.setGlobalVariable(cards);
});


gameInfo.setIo(io, Csocket);
io.on('connection', function (socket) {
    socket.emit('connected', 'connect game server');

    //客户登录游戏
    socket.on('LoginGame', function (GameInfo) {
        try {
            var data = JSON.parse(GameInfo);
            GameInfo = data;
        } catch (e) {
            log.warn('LoginGame-json');
        }
        if (!GameInfo) {
            console.log("登录游戏,参数不正确!");
            return;
        }
        console.log("客户登录游戏 userId:", GameInfo.userid);

        if (GameInfo.sign) {

            if (!gameInfo.getUser(GameInfo.userid)) {
                gameInfo.addUser(GameInfo, socket);
                var msg = {
                    userid: GameInfo.userid,
                    sign: GameInfo.sign,
                    gameId: gameInfo.serverId,
                    serverSign: signCode,
                    serverId: gameConfig.serverId
                };
                Csocket.emit('LoginGame', msg);
            } else {
                console.log("用户已经在服务器了，无需重复登录");
            }
        }

    });

    //然后再登录房间
    socket.on('LoginRoom', function (RoomInfo) {
        try {
            var data = JSON.parse(RoomInfo);
            RoomInfo = data;
        } catch (e) {
            log.warn('LoginRoom-json');
        }
        //如果没有房间概念，就默认为1
        //这还应该检测是否进入了游戏，如果没有需要先进入
        //console.log("进入房间")
        gameInfo.LoginRoom(socket.userId, RoomInfo.roomid, socket)
    });
    //离开房间
    socket.on('LogoutRoom', function () {
        gameInfo.LogoutRoom(socket);
    });

    //登录游戏获取免费游戏次数
    socket.on('LoginfreeCount', function () {
        gameInfo.LoginfreeCount(socket.userId, socket);
    });

    //登录游戏获取免费游戏次数
    socket.on('history', function () {
        gameInfo.getHistory(socket.userId, socket);
    });

    // 获取游戏配置
    socket.on('getConfig', function () {
        gameInfo.getConfig(socket);
    });

    //下注
    socket.on('lottery', function (lottery) {
        const data = JSON.parse(lottery);
        const nBetSum = parseInt(data.nBetList[0]);
        // 游戏奖池划分
        const jackpot_ratio = Config.jackpot_ratio;
        // 执行摇奖
        Lottery.doLottery(socket, nBetSum, jackpot_ratio, gameInfo);
    });

    // 获取游戏奖池
    socket.on('gameJackpot', function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            CacheUtil.getGameJackpot(socket);
        }
    });

    // 转发到大厅
    socket.on('clientToHall', function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if (!d || !d.protocol) throw new Error('参数错误');
            // 转发到大厅
            Csocket.userId = socket.userId;
            Csocket.emit(d.protocol, data);
        }catch (e){
            socket.emit('clientToHallResult',  {code:0,msg:"参数有误"})
        }
    });

    //离线操作
    socket.on('disconnect', function () {
        if (!socket.userId) {
            return;
        }
        //通知登录服务器，已经下线存储游戏数据
        var userInfo = gameInfo.getUser(socket.userId);
        if (userInfo) {
            if (userInfo.Islogin()) {
                gameInfo.deleteUser(socket);
                var result = {
                    ResultCode: 1,
                    userId: userInfo._userId,
                    userScore: userInfo._score,
                    gameId: gameConfig.serverId,
                    nolog: true
                };
                log.info('用户离开游戏,移除用户'+ socket.userId)
                Csocket.emit("userDisconnect", result);
                socket.userId = null;
            } else {
                userInfo._isLeave = true;
                log.warn('未更新用户数据离开');
            }
        } else {
            console.log("用户未登录离开!")
        }
    });

});


app.set('port', process.env.PORT || gameConfig.port);
var server = http.listen(app.get('port'), function () {
    log.info('start at port:' + server.address().port);
});
log.info("拉霸_" + gameConfig.gameId + "_" + gameConfig.gameName + "服务器启动");

