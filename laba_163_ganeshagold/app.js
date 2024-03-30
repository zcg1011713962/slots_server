const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const signCode = "slel3@lsl334xx,deka";
const Cio = require('socket.io-client');
const log = require("../CClass/class/loginfo").getInstand;
const  Urls = require("../util/config/url_config");
const gameInfo = require('./class/game').getInstand;
const gameConfig = require('./config/gameConfig');
const Lottery = require("../util/lottery");
const CacheUtil = require("../util/cache_util");
const Config =  require("./config/read_config").getInstand;


const Csocket = Cio(Urls.hall_url);
Csocket.on('disconnect', function (data) {
    console.log("登录服务器被断开")
});

Csocket.on('connected', function (msg) {
    console.log("与登录服务器进行连接......");
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
    console.log(".登录" + gameConfig.gameName + "服务器回应" + JSON.stringify(msg))
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

Csocket.on('gameForward', function (msg) {
    if (!msg) {
        return;
    }
    const protocol = msg.protocol;
    const data = msg.data;
    const userId = msg.userId;
    if(gameInfo.userList[userId]){
        gameInfo.userList[userId]._socket.emit(protocol, data);
    }else{
        log.info('gameForward' + userId + '用户不在游戏内')
    }

});

Csocket.on('getgold', function (msg) {
    if (!msg) {
        return;
    }

    //console.log(msg);
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
    //console.log(_info);
    gameInfo.addRankUserList(_info);
    //gameInfo.fishShoot(socket,fishShootInfo);
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

gameInfo.setIo(io, Csocket);

io.on('connection', function (socket) {

    //console.log(socket + 'connected');
    socket.emit('connected', 'connect game server');


    //客户登录游戏
    socket.on('LoginGame', function (userInfo) {
        try {
            var data = JSON.parse(userInfo);
            userInfo = data;
        } catch (e) {
            log.warn('LoginGame-json');
        }
        //console.log("test1.进入房间")
        //console.log(GameInfo)
        if (!userInfo) {
            console.log("登录游戏,参数不正确!");
            return;
        }

        if (userInfo.sign) {

            if (!gameInfo.getUser(userInfo.userid)) {
                gameInfo.addUser(userInfo, socket);
                var msg = {
                    userid: userInfo.userid,
                    sign: userInfo.sign,
                    gameId: gameInfo.serverId,
                    serverSign: signCode,
                    serverId: gameConfig.serverId
                };
                Csocket.emit('LoginGame', msg);
                CacheUtil.delayPushGameJackpot(userInfo, gameInfo.userList);
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

    //下注
    socket.on('lottery', function (lottery) {
        const data = JSON.parse(lottery);
        const nBetSum = parseInt(data.nBetList[0]);
        // 执行摇奖
        Lottery.doLottery(socket, nBetSum, gameInfo);
    });


    //离线操作
    socket.on('disconnect', function () {
        if (!socket.userId) {
            return;
        }
        //通知登录服务器，已经下线存储游戏数据
        //console.log(socket.userId)
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
                //断线存储相应数据(在新的数据库里存储,消耗子弹与收获金币)
                socket.userId = null;
            } else {
                userInfo._isLeave = true;
                log.warn('未更新用户数据离开');
            }
        } else {
            console.log("用户未登录离开!")
        }
    })


});


app.set('port', process.env.PORT || gameConfig.port);

var server = http.listen(app.get('port'), function () {
    console.log('start at port:' + server.address().port);
});

console.log("拉霸_" + gameConfig.gameId + "_" + gameConfig.gameName + "服务器启动");

const period = 3000;
setInterval(function () {
    // 批量更新用户信息
    gameInfo.batchUpdateOnLineAccount();
}, period);