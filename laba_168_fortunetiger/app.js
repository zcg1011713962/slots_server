﻿var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var signCode = "slel3@lsl334xx,deka";
var Cio = require('socket.io-client');
var log = require("./../CClass/class/loginfo").getInstand;
var gameInfo = require('./class/game').getInstand;
var gameConfig = require('./config/gameConfig');
const  Urls = require("../util/config/url_config");
const Lottery = require("../util/lottery");
const CacheUtil = require("../util/cache_util");
const SampleUtil = require("../util/sample_util");

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
    log.info(gameConfig.gameName + "登录大厅回应" + JSON.stringify(msg));
    if (msg.ResultCode) {
        gameInfo.updateUser(msg.userInfo);
    } else {
        gameInfo.deleteUserById(msg.userid, msg.msg);
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
    socket.emit('connected', 'connect game server');

    //客户登录游戏
    socket.on('LoginGame', function (userInfo) {
        try {
            var data = JSON.parse(userInfo);
            userInfo = data;
        } catch (e) {
            log.warn('LoginGame-json');
        }
        if (!userInfo) {
            console.log("登录游戏,参数不正确!");
            return;
        }

        if (userInfo.sign) {
            const user = gameInfo.getUser(userInfo.userid);
            if (user) {
                log.info("用户已经在服务器了，覆盖登录,原socket:" + user._socket.id + '现socket：' + socket.id);
            }

            const msg = {
                userid: userInfo.userid,
                sign: userInfo.sign,
                gameId: gameInfo.serverId,
                serverSign: signCode,
                serverId: gameConfig.serverId
            };

            gameInfo.addUser(userInfo, socket);
            log.info(userInfo.userid + '用户登录游戏服务，游戏请求大厅服务,当前游戏人数:' + gameInfo.getOnlinePlayerCount() + '游戏socket' + Csocket)

            // 发送给大厅
            Csocket.emit('LoginGame', msg);
        }
    })

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

    // 获取游戏内金币
    socket.on('getGold', function () {
        CacheUtil.getGoldCoin(socket.userId).then(coin =>{
            socket.emit('getGoldResult', {code: 1, data: {gold: coin}})
        });
    });

    // 获取游戏内银币
    socket.on('getSilverCoin', function () {
        CacheUtil.getSilverCoin(socket.userId).then(coin =>{
            socket.emit('getSilverCoinResult', {code: 1, data: {silverCoin: coin}})
        });
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
        const nBetSum = Number(data.nBetList[0]);
        // 执行摇奖
        Lottery.doLottery(socket, nBetSum, gameInfo);
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
                Csocket.emit("userDisconnect", result);
            } else {
                userInfo._isLeave = true;
                log.warn('未更新用户数据离开');
            }
        } else {
            log.info("用户未登录离开!")
        }
    });

});

app.set('port', process.env.PORT || gameConfig.port);
const server = http.listen(app.get('port'), function () {
    log.info('start at port:' + server.address().port);
});
log.info("拉霸_" + gameConfig.gameId + "_" + gameConfig.gameName + "服务器启动");

/*
SampleUtil.init(gameConfig.gameName, gameConfig.gameId);*/
