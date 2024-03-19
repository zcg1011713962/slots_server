const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let withdrawal_api = require('./class/withdrawal_api');
const bodyParser = require('body-parser');
const registerByGuestApi = require('./class/login_api');
const Robotname = require('./config/RobotName');
const crypto = require('crypto');
const gm_api = require('./class/gm_api');
const tw_api = require('./class/tw_api');
const dao = require('./dao/dao');
const log = require("../CClass/class/loginfo").getInstand;
const consolidate = require('consolidate');
const statics = require('express-static');
const StringUtil = require("../util/string_util");
const gameInfo = require("./class/game").getInstand;
const ServerInfo = require('./config/ServerInfo').getInstand;
const ErrorCode = require('../util/ErrorCode');
const CacheUtil = require('../util/cache_util');
const redis_laba_win_pool = require("../util/redis_laba_win_pool");
const laba_config = require("../util/config/laba_config");
const TypeEnum = require("../util/enum/type");



//版本密钥和版本号
const version = "ymymymymym12121212qwertyuiop5656_";
const num = "2.0";

// app.use(statics('./static/'));

//跨域问题
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


//网页模板
app.engine('html', consolidate.ejs);
app.set('views', 'template');
app.set('view engine', 'html');
app.use(bodyParser());




app.get('/outCoin', function (req, res) {
    tw_api.outCoin(req.query, function (result) {
        if (result) {
            res.send("SUCCESS");
        } else {
            res.send("FAIL");
        }
    });
});


app.post('/gmManage', function (req, res) {
    var r = null;
    for (var i in req.body) {
        r = JSON.parse(i)
    }
    let key = version + num;
    if (r.key !== key) {
        res.send({rusult: -1});
        return;
    }
    gm_api(r, function (result) {
        res.send(result);
    });
});

// 游客注册
app.get('/registerByGuest', function (req, res) {
    //外部接口
    registerByGuestApi(req, gameInfo, function (act, sendStr) {
        if (act == 1) {
            res.send(sendStr);
        } else if (act == 2) {
            res.redirect(sendStr);
        }
    });
});



//版本验证
app.post('/checkVersion', function (req, res) {
    //验证版本
    const r = req.query.key;
    let key = version + num;
    console.log("版本验证" , key)
    if (r !== key) {
        res.send({code: 0, url: "http://yidali.youmegame.cn/tg/"});
        return;
    }
    res.send({code: 1, url: "http://yidali.youmegame.cn/tg/"});
});



app.get('/bindCards', function (req, response) {
    try {
        const data = req.query;
        const sc = ServerInfo.getScoket(15168);
        sc.emit('bindCards', data.cards);
        response.send('success');
    } catch (e) {
        log.err('bindCards' + e);
        response.send('fail');
    }
    response.end();
});

// 根据设备码获取用户名信息
app.get('/devcodesearch', function (req, res) {
    //验证版本
    const deviceCode = req.query.deviceCode;
    if(!deviceCode || deviceCode.length < 1){
        return;
    }
    gameInfo.searchAccountByDeviceCode(deviceCode, row =>{
        if (row) {
            res.send({code: 1, data: row});
        }else{
            res.send({code: 1, data: {}});
        }
    });
});


var serverSign = "slel3@lsl334xx,deka";

gameInfo.setIo(io);

io.on('connection', function (socket) {
    log.info("socket comein........");
    socket.emit('connected', 'connect server');

    //服务器进行连接
    socket.on('GameServerConnect', function (info) {
        if (info.signCode == serverSign) {
            log.info(info.serverName + " | 服务器连接成功!");
            log.info("游戏Id:" + info.serverId);
            socket.emit('GameServerConnectResult', {resultCode: 1});
            if (info.serverId)
                ServerInfo.setScoket(info.serverId, socket);
        } else {
            log.info("尝试连接服务器失败,密码不对");
        }
    });

    // 登录
    socket.on('login', function (data) {
        // 维护模式
        if (gameInfo.isMaintain()) {
            log.info("维护模式,禁止登录!");
            socket.emit("loginResult", {code: ErrorCode.LOGIN_FAILED_MAINTAIN.code, msg: ErrorCode.LOGIN_FAILED_MAINTAIN.msg});
            return;
        }
        // 判断是不是同一socket登录2次**********未完成还要判断每个游戏里，是否在线？以后再去改
        if (gameInfo.isLoginAgain(socket)) {
            log.info("同一帐号连续登录!,必须退出一个游戏才能进入另一个游戏!");
            socket.emit("loginResult", {code: ErrorCode.LOGIN_FAILED_LOGINAGAIN.code, msg: ErrorCode.LOGIN_FAILED_LOGINAGAIN.msg});
            return;
        }
        log.info("登录大厅" + data);

        try {
            const user = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!data || !user){
                socket.emit("loginResult", {code: ErrorCode.LOGIN_FAILED_INFO_ERROR.code, msg: ErrorCode.LOGIN_FAILED_INFO_ERROR.msg});
                return;
            }
            // 账户密码登录
            if(user.userName && user.password){
                user.password = StringUtil.pwdEncrypt(user.userName, user.password);
                user.sign = user.password;
            }
            // 邮箱登录
            if(user.email && user.code){
                gameInfo.verifyEmailCode(user.email, user.code, (code, msg) =>{
                    if(code !== ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                        socket.emit('loginResult', {code: code, msg: msg});
                    }else{
                        initUserInfo(user, socket);
                    }
                });
            }else{
                initUserInfo(user, socket);
            }
        } catch (e) {
            socket.emit("loginResult", {code: ErrorCode.LOGIN_ERROR.code, msg: ErrorCode.LOGIN_ERROR.msg});
            log.err('登录异常', e);
        }
    })
    
    function initUserInfo(user, socket) {
        dao.login(user, socket, (code, msg, data)=> {
            if(ErrorCode.LOGIN_SUCCESS.code === code){
                if (!data) {
                    socket.emit('loginResult', {code: ErrorCode.LOGIN_FAILED_INFO_ERROR.code, msg: ErrorCode.LOGIN_FAILED_INFO_ERROR.msg});
                    return;
                }
                if (gameInfo.IsPlayerOnline(data.Id)) {
                    // 返回大厅的用户  不允许在游戏里，断开游戏
                    gameInfo.existGameDel(data.Id);
                }
                // 登录成功
                gameInfo.addUser(data, socket, function (result) {
                    if (result === 1) {   //断线从连
                        gameInfo.lineOutSet({userId: user.id})
                    }
                });
            }else{
                log.warn('登陆失败' + msg);
                socket.emit('loginResult', {code: code, msg: msg});
            }
        });
    }
    

    // 登录完成之后先进入游戏房间,来自于游戏服务器
    socket.on('LoginGame', function (_userinof) {
        let result;
        if (_userinof.serverSign === serverSign) {
            //让这个用户进入该游戏
            const encoin = ServerInfo.getServerEnterCoinByProt(_userinof.serverId);
            const userInfo = gameInfo.LoginGame(_userinof.userid, _userinof.sign, _userinof.serverId, encoin);
            result = {};
            if (userInfo._userId) {
                result = {ResultCode: 1, userInfo: userInfo};
                const info = {
                    state: 1,
                    gameId: _userinof.gameId,
                    serverId: _userinof.serverId,
                    userId: _userinof.userid,
                    tableId: -1,
                    seatId: -1,
                    vip_score: _userinof.vip_score
                };
                gameInfo.lineOutSet(info);
            } else {
                result = {ResultCode: 0, userid: _userinof.userid, msg: userInfo.msg};
            }
            socket.emit('LoginGameResult', result);
        }

    });

    //离线操作
    socket.on('disconnect', function () {
        if (socket.gm_id) {
            console.log("删除gm_socket");
            delete gameInfo.gm_socket[socket.gm_id]
            return;
        }
        //有人离线
        if (!socket.userId) {
            return
        }

        if (socket.serverGameid) {
            log.info("游戏服务器 -" + ServerInfo.getServerNameById(socket.serverGameid) + "- 已经断开连接");
        }else{
            log.info("用户断开连接:" + socket.userId);
        }

        // 如果用户还存在的话，删除
        const userInfo = {userId: socket.userId, nolog: true};
        gameInfo.deleteUser(userInfo);
    });

    // 有用户离开
    socket.on('userDisconnect', function (_userInfo) {
        log.info("userDisconnect");
        if (_userInfo.ResultCode) {
            gameInfo.setCleanGameIdByUserId(_userInfo);
            gameInfo.deleteUser(_userInfo);
        } else {
            gameInfo.deleteUserNoLoginGame(_userInfo.userId, 1);
        }
    });

    // 发送邮箱验证码
    socket.on("sendEmailCode", function (toEmail) {
        try {
            gameInfo.sendEmailCode(socket, toEmail);
        } catch (e) {
            socket.emit('sendEmailCodeResult', {code: ErrorCode.EMAIL_CODE_SEND_FAILED.code, msg: ErrorCode.EMAIL_CODE_SEND_FAILED.msg});
            log.err('sendEmailCode',  e);
        }
    });

    // 绑定邮箱
    socket.on("bindEmail", function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.email || !d.code){
                throw new Error("参数不合法");
            }
            gameInfo.bindEmail(socket, d.email, d.code);
        } catch (e) {
            socket.emit('bindEmailResult', {code: 0, msg: "绑定失败"});
            log.err('bindEmailResult',  e);
        }
    });

    // 发送跑马灯
    socket.on("sendNotifyMsg", function () {
        // 发送跑马灯
        const noticeMsg = [{
            type: TypeEnum.notifyType.normal,
            content_id: "c2000",
            extend:{

            }
        }]
        gameInfo.sendNotifyMsg(socket.userId, noticeMsg);
    });

    // 发送全服跑马灯
    socket.on("sendAllNotifyMsg", function () {
        // 发送跑马灯
        const noticeMsg = [{
            type: TypeEnum.notifyType.normal,
            content_id: "c2000",
            extend:{

            }
        }]
        gameInfo.sendAllNotifyMsg(noticeMsg);
    });

    // 注册
    socket.on("register", function (_info) {
        try {
            const parm = StringUtil.isJson(_info) ? JSON.parse(_info) : _info;
            if(parm.type === 0){
                // 注册
                gameInfo.register(socket, parm.email, parm.code);
            }
        } catch (e) {
            log.err('注册',  e);
        }
    });

    // 获得商城商品列表
    socket.on("getShoppingList", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getShoppingGoods(socket);
        }
    });

    // 购买商品
    socket.on("Shopping", function (data) {
        try {
            if(!data) throw new Error();
            const d = JSON.parse(data);
            if (gameInfo.IsPlayerOnline(socket.userId)) {
                gameInfo.Shopping(socket.userId, d.productId, d.count, socket);
            }else{
                socket.emit('ShoppingResult', {code:0,msg:"用户不在线"});
            }
        }catch (e) {
            socket.emit('ShoppingResult', {code:0,msg:"参数有误"});
        }
    });

    // 兑换礼品
    socket.on("exchangeGift", function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.cdkey) throw new Error('参数错误');
            if (gameInfo.IsPlayerOnline(socket.userId)) {
                gameInfo.exchangeGift(socket, d.cdkey);
            }else{
                socket.emit('exchangeGiftResult', {code:0,msg:"用户不在线"});
            }
        }catch (e) {
            log.err('exchangeGift' + e.message)
            socket.emit('exchangeGiftResult', {code:0,msg:"参数有误"});
        }
    });



    // 获取用户信息
    socket.on("getUserInfo", function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
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
                    gameInfo.loginUserInfo(userId, luckObject, userInfo=>{
                        socket.emit('UserInfoResult', {code: 1, data: userInfo});
                    });
                });

            }else{
                log.info('getUserInfo用户不在线')
                socket.emit('UserInfoResult', {code:0,msg:"用户不在线"});
            }
        }catch (e) {
            socket.emit('UserInfoResult', {code:0,msg:"用户不在线"});
        }
    });

    // 获取VIP配置
    socket.on("getVipConfig", function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                CacheUtil.getVipConfig().then(config =>{
                    socket.emit('getVipConfigResult', {code:1, msg: config});
                });
            }
        }catch (e) {
            socket.emit('getVipConfigResult', {code:0, msg:"用户不在线"});
        }
    });


    // vip获取每日每月金币
    socket.on("vipGetGoldDetail", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.vipGetGoldDetail(socket);
        }else{
            socket.emit('vipGetGoldDetailResult', {code:0,msg:"用户不在线"});
        }
    });

    // VIP领取金币
    socket.on("vipGetGold", function (data) {
        try {
            if(!data) throw new Error();
            log.info('vipGetGold' + data);
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if (gameInfo.IsPlayerOnline(socket.userId)) {
                gameInfo.vipGetGold(socket, d.type);
            }else{
                socket.emit('vipGetGoldResult', {code:0,msg:"用户不在线"});
            }
        }catch (e) {
            socket.emit('vipGetGoldResult', {code:0,msg:"参数有误"});
        }
    });

    // 获取银行分数 用户金币
    socket.on('getBankScore', function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('getBankScoreResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                gameInfo.getBankScore(socket);
            }
        }catch (e) {
            socket.emit('getBankScoreResult', {code:0, msg:"用户不在线"});
        }
    });


    // 筹码存储-银行取出金币
    socket.on('bankIntoHallGold', function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('bankIntoHallGoldResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                gameInfo.bankIntoHallGold(socket, d.gold);
            }
        }catch (e) {
            socket.emit('bankIntoHallGoldResult', {code:0,msg:"参数有误"});
        }
    });

    // 筹码存储-金币转入银行
    socket.on('hallGoldIntoBank', function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('bankIntoHallGoldResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                gameInfo.hallGoldIntoBank(socket, d.gold);
            }
        }catch (e) {
            socket.emit('bankIntoHallGoldResult', {code:0,msg:"参数有误"});
        }
    });

    // 银行转账
    socket.on('bankTransferOtherBank', async function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('bankTransferOtherBankResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                const ret = await CacheUtil.recordUserProtocol(userId, "bankTransferOtherBank");
                if(ret){
                    gameInfo.bankTransferOtherBank(socket, d.giveUserId, d.bankScore, (code, result) =>{
                        CacheUtil.delUserProtocol(userId, "bankTransferOtherBank")
                        if(code){
                            socket.emit('bankTransferOtherBankResult', {code:code,  data: result});
                        }else{
                            socket.emit('bankTransferOtherBankResult', {code:code,  msg: result});
                        }
                    });
                }else{
                    socket.emit('bankTransferOtherBankResult', {code:0, msg:"频繁访问"});
                }
            }
        }catch (e) {
            socket.emit('bankTransferOtherBankResult', {code:0,msg:"参数有误"});
        }
    });


    // 查询银行转入记录
    socket.on('bankTransferIntoRecord', function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.searchBankTransferIntoRecord(socket);
            }
        }catch (e) {
            socket.emit('bankTransferIntoRecordResult', {code:0,msg:"参数有误"});
        }
    });

    // 查询银行转出记录
    socket.on('bankTransferOutRecord', function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.searchBankTransferOutRecord(socket);
            }
        }catch (e) {
            socket.emit('bankTransferOutRecordResult', {code:0,msg:"参数有误"});
        }
    });

    // 设置银行密码
    socket.on('setBankPwd', function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if(d.pwd1.toString().length !== 6){
                socket.emit('setBankPwdResult', {code: 0, msg: "密码长度非法"});
                return;
            }
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('setBankPwdResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                if (d.pwd2 === d.pwd1) {
                    gameInfo.getUserBankPwd(socket.userId, (pwd) => {
                        if(pwd){
                            socket.emit('setBankPwdResult', {code: 0, msg: "存在密码请修改密码"});
                        }else{
                            gameInfo.setUserBankPwd(socket, d);
                        }
                    });
                } else {
                    socket.emit('setBankPwdResult', {code: 0, msg: "两次密码不一致"});
                }
            }
        }catch (e) {
            socket.emit('setBankPwdResult', {code:0,msg:"参数有误"});
        }
    });

    //修改银行密码
    socket.on('updateBankPwd', function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if(gameInfo.isBankLock(userId)){
                    socket.emit('updateBankPwdResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                if(d.pwd.toString().length !== 6){
                    socket.emit('updateBankPwdResult', {code: 0, msg: "密码长度非法"});
                    return;
                }
                gameInfo.getUserBankPwd(socket.userId, (pwd) => {
                    if (parseInt(pwd) !== parseInt(d.pwd)) {
                        socket.emit('updateBankPwdResult', {code: 0, msg: "原始密码错误"});
                    } else {
                        gameInfo.updateUserBankPwd(socket, d);
                    }
                });
            }
        }catch (e) {
            socket.emit('updateBankPwdResult', {code:0,msg:"参数有误"});
        }
    });

    // 校验银行密码
    socket.on('checkBankPwd', function (data) {
        try {
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                // 银行是否被锁
                if (gameInfo.isBankLock(userId)) {
                    socket.emit('checkBankPwdResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                    return;
                }
                // 错误次数判断
                CacheUtil.searchBankPwdErrorCount(userId).then(count => {
                    if (count === undefined || count < 5) {
                        // 密码校验
                        gameInfo.getUserBankPwd(socket.userId, (pwd) => {
                            if (pwd === d.pwd) {
                                socket.emit('checkBankPwdResult', {code: 1, msg: "校验成功"});
                            } else {
                                CacheUtil.addBankPwdErrorCount(userId);
                                socket.emit('checkBankPwdResult', {code: 0, msg: "校验失败"});
                            }
                        });
                    } else if (count >= 5) {
                        // 锁住银行卡
                        gameInfo.lockBank(userId);
                        socket.emit('checkBankPwdResult', {code: 0, msg: "密码输入错误5次冻结账号存取功能"});
                    }
                })
            } else {
                socket.emit('checkBankPwdResult', {code: 0, msg: "用户不在线"});
            }
        }catch (e){
            socket.emit('checkBankPwdResult', {code:0,msg:"参数有误"});
        }
    });


    // 查询签到详情页
    socket.on("getSignInDetail", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchUserSignInDetail(socket);
        }else{
            socket.emit('getSignInDetailResult', {code:0, msg:"用户不在线"});
        }
    });

    // 签到
    socket.on("signIn", async function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, "signIn");
            if (ret) {
                gameInfo.signIn(socket, ok => {
                    CacheUtil.delUserProtocol(userId, "signIn")
                    if (ok) {
                        socket.emit('signInResult', {code: 1, msg: '签到成功'});
                    } else {
                        socket.emit('signInResult', {code: 0, msg: '重复签到'});
                    }
                });
            } else {
                socket.emit('signInResult', {code: 0, msg: "频繁访问"});
            }
        } else {
            socket.emit('signInResult', {code: 0, msg: "用户不在线"});
        }
    });

    // 获取每个玩家大厅幸运币详情页
    socket.on("hallLuckyPageDetail", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                // 活动奖池
                const activityJackpot = jackpot ? jackpot * laba_config.activity_jackpot_ratio : 0;
                gameInfo.getHallLuckyPageDetail(socket, activityJackpot);
            });
        }else{
            socket.emit('hallLuckyPageDetailResult', {code:0, msg:"用户不在线"});
        }
    });

    // 领取幸运币
    socket.on("getLuckyCoin", function (data) {
        try{
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.getLuckyCoin(socket, d.type);
            }else{
                socket.emit('getLuckyCoinResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('luckyCoinDetailResult', {code:0,msg:"参数有误"});
        }
    });


    // 获取转盘详情页
    socket.on("luckyCoinDetail", function (data) {
        try{
            if(!data) throw new Error();
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                    // 活动奖池
                    const activityJackpot = jackpot ? jackpot * laba_config.activity_jackpot_ratio : 0;
                    gameInfo.getLuckyCoinDetail(socket, activityJackpot, d.val);
                });
            }else{
                socket.emit('luckyCoinDetailResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('luckyCoinDetailResult', {code:0,msg:"参数有误"});
        }
    });


    // 大厅转盘游戏
    socket.on("turntable", function (data) {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const gameMode = data ? 1 : 0; // 0 免费游戏 1收费游戏

            if(gameMode === 0){
                // 免费模式扣除幸运币
                CacheUtil.getActivityLuckyDetailByUserId(userId, luckyDetail =>{
                    CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{

                        const turntableCoin = luckyCoinConfig.turntableCoin;
                        const luckyCoin = luckyDetail.luckyCoin;
                        if(luckyCoin < turntableCoin){
                            socket.emit('turntableResult', {code:0, msg:"幸运币不足"});
                            return;
                        }
                        // 扣幸运币
                        luckyDetail.luckyCoin = Number(luckyDetail.luckyCoin) - turntableCoin;
                        log.info('用户' + userId + '转盘扣幸运币' + turntableCoin + '剩余幸运币' + luckyDetail.luckyCoin);
                        CacheUtil.updateActivityLuckyConfig(userId, luckyDetail).then(ret =>{
                            if(ret){
                                // 免费幸运币数量
                                redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                                    // 活动奖池
                                    const activityJackpot = jackpot ? jackpot * laba_config.activity_jackpot_ratio : 0;
                                    gameInfo.turntable(socket, 1, activityJackpot);
                                });
                                return;
                            }
                            socket.emit('turntableResult', {code:0, msg:"扣币失败"});
                        })
                    });
                });
            }else if(gameMode === 1){
                try{
                    const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
                    // 购买加倍转盘
                    if(!d.mul) throw new Error();
                    // 扣款成功
                    gameInfo.mulBuy(d.mul, res =>{
                        if(res){
                            redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                                // 活动奖池
                                const activityJackpot = jackpot ? jackpot * laba_config.activity_jackpot_ratio : 0;
                                gameInfo.turntable(socket, d.mul, activityJackpot);
                            });
                        }
                    });
                }catch (e) {
                    socket.emit('turntableResult', {code:0,msg:"参数有误"});
                }
            }
        }else{
            socket.emit('turntableResult', {code:0, msg:"用户不在线"});
        }
    });


    // 大厅获取游戏奖池
    socket.on('gameJackpot', function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            CacheUtil.getGameJackpot(socket);
        }
    });


    // 查看邮件
    socket.on("getEmail", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getEmail(socket);
        }
    });

    //设置邮件已读
    socket.on("setEmailRead", function (data) {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.setEmailRead(socket, data);
        }
    });

    // 邮件一键已读
    socket.on("setEmailAllRead", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.setEmailAllRead(socket);
        }
    });

    // 删除指定邮件
    socket.on("delEmailById", function (data) {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.delEmailById(socket, data.id);
        }
    });

    // 邮件一键删除
    socket.on("emailAllDel", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.emailAllDel(socket);
        }
    });


    // 新用户绑定邀请码
    socket.on("bindInviteCode", function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.inviteCode) throw new Error('参数错误');
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.bindInviteCode(socket, d.inviteCode);
            }else{
                socket.emit('bindInviteCodeResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('bindInviteCodeResult', {code:0,msg:"参数有误"});
        }
    });


    // 查询绑定推广码
    socket.on("searchInvitedCode", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchInvitedCode(socket);
        }else{
            socket.emit('searchInvitedCodeResult', {code:0, msg:"用户不在线"});
        }
    });


    // 查询我的推广信息
    socket.on("searchInvitedDetail", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchInvitedDetail(userId, result =>{
                socket.emit('searchInvitedDetailResult', {code:1, data: result});
            });
        }else{
            socket.emit('searchInvitedDetailResult', {code:0, msg:"用户不在线"});
        }
    });

    // 推广-团队-查询返点记录
    socket.on("searchAgentRebateRecord", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchAgentRebateRecord(socket);
        }else{
            socket.emit('searchAgentRebateRecordResult', {code:0, msg:"用户不在线"});
        }
    });


    // 我的推广-领取返点
    socket.on("getRebate", function () {
        console.log('getRebate', socket.userId)
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.getRebate(socket);
        }else{
            socket.emit('getRebateResult', {code:0, msg:"用户不在线"});
        }
    });


    // 推广-记录-领取记录
    socket.on("getRebateRecord", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchAgentGetRebateRecord(socket);
        }else{
            socket.emit('getRebateRecordResult', {code:0, msg:"用户不在线"});
        }
    });


    // 设置-注销账号
    socket.on("logoutAccount", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.logoutAccount(socket);
        }else{
            socket.emit('logoutAccountResult', {code:0, msg:"用户不在线"});
        }
    });


    // 设置-联系客服-查询客服信息
    socket.on("customerServiceInfo", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.customerServiceInfo(socket);
        }else{
            socket.emit('customerServiceInfoResult', {code:0, msg:"用户不在线"});
        }
    });


    // 设置-建议反馈
    socket.on("feedback", function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.txt) throw new Error('参数错误');
            if(d.txt.length > 100){
                socket.emit('feedbackResult', {code:0, msg:"长度限制100字"});
                return;
            }

            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.feedback(socket, d.txt);
            }else{
                socket.emit('feedbackResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('feedbackResult', {code:0,msg:"参数有误"});
        }
    });


    // 设置-联系我们-问题回答
    socket.on("contactUs", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.contactUs(socket);
        }else{
            socket.emit('contactUsResult', {code:0, msg:"用户不在线"});
        }
    });



    // 设置-联系我们-问题回答
    socket.on("contactUs", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.contactUs(socket);
        }else{
            socket.emit('contactUsResult', {code:0, msg:"用户不在线"});
        }
    });


    // 设置-语言
    socket.on("lang", function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || d.lang === undefined || d.lang == null) throw new Error('参数错误');
            const userId = socket.userId;
            if(!Object.values(TypeEnum.LangType).includes(d.lang)){
                socket.emit('langResult', {code:0, msg:"不存在的语言"});
                return;
            }
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.setLang(socket, d.lang);
            }else{
                socket.emit('langResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('langResult', {code:0,msg:"参数有误"});
        }
    });


    // 保存设备码
    socket.on("devcodesave", function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.deviceCode || !d.account) throw new Error('参数错误');
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.updateAccountByDeviceCode(d.deviceCode, d.account , row =>{
                    if (row) {
                        socket.emit('devcodesaveResult', {code:1, msg: "成功"});
                    }else{
                        socket.emit('devcodesaveResult', {code:0, msg: "失败"});
                    }
                });
            }else{
                socket.emit('devcodesaveResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('devcodesaveResult', {code:0,msg:"参数有误"});
        }
    });

    // 保存新手指引步数
    socket.on("saveGuideStep", function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.step ) throw new Error('参数错误');
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                gameInfo.saveGuideStep(socket, d.step);
            }else{
                socket.emit('saveGuideStepResult', {code:0, msg:"用户不在线"});
            }
        }catch (e){
            socket.emit('saveGuideStepResult', {code:0,msg:"参数有误"});
        }
    });


    // 新用户弹窗送金币
    socket.on('newHandGive', function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            CacheUtil.getNewhandProtectConfig().then(newHandConfig =>{
                if(gameInfo.userList[userId].newHandGive === 0){
                    gameInfo.userList[userId].newHandGive = 1;
                    socket.emit('newHandGiveResult', {code:1, data:{type:[TypeEnum.GoodsType.gold], val: [newHandConfig.giveGold]}});
                }
            });
        }else{
            socket.emit('newHandGiveResult', {code:0, msg:"用户不在线"});
        }
    });




    // 游戏结算
    socket.on('GameBalance', function (_Info) {
        if (_Info.signCode == serverSign) {
            gameInfo.GameBalance(_Info);
        }
    });


    //牌局断线
    socket.on('lineOut', function (_Info) {
        console.log("lineOut");
        console.log(_Info);
        if (_Info.signCode == serverSign) {
            gameInfo.lineOutSet(_Info);
        }
    });

    //获得断线
    socket.on('getLineOut', function (_Info) {
        if (_Info.signCode == serverSign) {
            gameInfo.getLineOutMsg(_Info);
        }
    });


    //领取邮件金币
    socket.on("lqCoin_email", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendCoinjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.lqCoin_email(socket, _info);
        }
    });

    //使用点卡
    socket.on("useEXcard", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('useEXcardjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.useEXcard(socket, _info);
        }
    });

    //赠送点卡
    socket.on("sendcard", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendcardjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.sendcard(socket, _info);
        }
    });

    //查询点卡记录
    socket.on("cardLog", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('cardLogjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.cardLog(socket, _info);
        }
    });

    //检测
    socket.on("checkNickName", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('checkNickName-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.checkNickName(socket, _info);
        }
    });

    //账号检测昵称
    socket.on("checkNickNameByAccount", function (_info) {

        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('checkNickNameByAccount-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.checkNickName2(socket, _info);
        }
    });

    //修改昵称
    socket.on("updateNickName", function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d) throw new Error('参数错误');
            if (gameInfo.IsPlayerOnline(socket.userId)) {
                gameInfo.updateNickName(socket, d);
            }
        } catch (e) {
            log.err('updateNickName' + e);
        }
    });

    //修改头像
    socket.on("updateHeadUrl", function (_info) {
        try {
            const data = StringUtil.isJson(_info) ? JSON.parse(_info) : _info ;
            _info = data;
        } catch (e) {
            log.warn('updateHeadUrl-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.updateHeadUrl(socket, _info);
        }
    });

    //修改密码
    socket.on("updatePassword", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('updatePassword-json');
        }
        if (gameInfo.checkDataPassword(socket, _info)) {
            gameInfo.updatePassword(socket, _info);
        }
    });


    //银行卡
    socket.on("BankInfo", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('BankInfo-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.BankInfo(socket, _info);
        }
    });

    //获取自己银行卡
    socket.on("getBank", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getBank-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getBank(socket, _info);
        }
    });




    //获得每天任务奖品
    socket.on("getDayPrize", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getDayPrize-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getDayPrize(socket, _info);
        }
    });

    //获得金币排行榜
    socket.on("getCoinRank", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getCoinRank(socket);
        }
    });
    //获得钻石排行榜
    socket.on("getDiamondRank", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getDiamondRank(socket);
        }
    });




    //游戏服务器的排行
    socket.on("setServerRank", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('setServerRank-json');
        }
        gameInfo.setServerRank(_info);
    });

    // 日志记录
    socket.on("score_changeLog", function (_info) {
        gameInfo.insertScore_change_log(_info);
    });
    // 日志记录
    socket.on("insertMark", function (_info) {
        gameInfo.insertMark(_info);
    });
    // 日志记录
    socket.on("pro_change", function (_info) {
        gameInfo.pro_change(_info);
    });

    //游戏服务器的排行
    socket.on("getServerRank", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getServerRank-json');
        }
        gameInfo.getServerRank(socket, _info);
    });

    //喇叭说话
    socket.on('sendMsg', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendMsg-json');
        }
        gameInfo.sendMsg(socket.userId, _info, io)
    });

    //私聊
    socket.on('sendMsgToUser', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendMsgToUser-json');
        }
        gameInfo.sendMsgToUser(socket, _info);
    });

    //私聊发图
    socket.on('sendImgToUser', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendImgToUser-json');
        }
        gameInfo.sendImgToUser(socket, _info);
    });

    //获取未收到私聊
    socket.on('getMsgToUser', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getMsgToUser-json');
        }
        gameInfo.getMsgToUser(socket, _info)
    });

    //更新聊天记录
    socket.on('updateCharLog', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('updateCharLog-json');
        }
        gameInfo.updateCharLog(socket, _info.idList);
    });

    //兑奖
    socket.on('scoreOut', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getMsgToUser-json');
        }
        _info.ip = socket.handshake.address;
        log.info(_info);
        if (_info.ip.split(':').length > 0) {
            var ip = _info.ip.split(':')[3];
            if (ip) {
                _info.ip = ip;
            } else {
                // _info.ip = "116.196.93.26";
            }
            gameInfo.scoreOut(socket, _info);
        }

    });

    //发送聊天给GM
    socket.on('sendMsgToGM', function (_info) {
        console.log("sendMsgToGM");
        if (!socket.userId) {
            console.log("没有用户id")
        }
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            // log.warn('sendMsgToGM-json');
        }
        gameInfo.sendMsgToGM(socket, _info);
    });


    //客服登录
    socket.on('GMLogin', function (_info) {
        console.log("GMLogin");
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            // log.warn('sendMsgToGM-json');
        }
        var code = "sjfhcnweuqiebncwe2@!5fy&";
        if (_info.code == code) {
            socket.gm_id = _info.gm_id;
            gameInfo.setGMSocket(_info.gm_id, socket)
        }
    });


    //心跳
    socket.on('heartbeat', function () {
        socket.emit('heartbeatResult');
    });

    //查用户金币数
    socket.on('getPlayerCoin', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getPlayerCoin-json');
        }
        if (!socket.userId) {
            return;
        }
        gameInfo.getUserCoin(socket, _info);
    });



    //查询游戏分数2
    socket.on('getCoinLog', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getCoinLog-json');
        }
        gameInfo.getCoinLog(socket, _info);
    });
    //用户申请提现
    socket.on("withdraw_apply", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('withdraw_apply');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            withdrawal_api(socket, _info);
        }
    });

});


app.set('port', process.env.PORT || 13000);

var server = http.listen(app.get('port'), function () {
    log.info('start at port:' + server.address().port);
});


const period = 2000;
setInterval(function () {
    // 幸运币活动刷新
    gameInfo.refreshLuckCoinActivity();
    // 批量更新用户信息
    gameInfo.batchUpdateAccount();
    // 保存log
    gameInfo.score_changeLog();
    gameInfo.diamond_changeLog();
}, period);

dao.clenaLineOut();



log.info("登录服务器 v2.0.0");
log.info("服务器启动成功!");
log.info("更新时间:2017.12.17");
