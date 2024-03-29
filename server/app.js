const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const registerByGuestApi = require('./class/login_api');
const Robotname = require('./config/RobotName');
const gm_api = require('./class/gm_api');
const dao = require('../util/dao/dao');
const log = require("../CClass/class/loginfo").getInstand;
const consolidate = require('consolidate');
const StringUtil = require("../util/string_util");
const gameInfo = require("./class/game").getInstand;
const ServerInfo = require('./config/ServerInfo').getInstand;
const ErrorCode = require('../util/ErrorCode');
const CacheUtil = require('../util/cache_util');
const redis_laba_win_pool = require("../util/redis_laba_win_pool");
const TypeEnum = require("../util/enum/type");
// 触发定时任务
const ScheduleJob = require("./class/schedule_job");


//版本密钥和版本号
const version = "ymymymymym12121212qwertyuiop5656_";
const num = "2.0";


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
    log.info('版本验证' + key)
    if (r !== key) {
        res.send({code: 0, url: "http://yidali.youmegame.cn/tg/"});
        return;
    }
    res.send({code: 1, url: "http://yidali.youmegame.cn/tg/"});
});

// 根据设备码获取用户名信息
app.get('/devcodesearch', function (req, res) {
    //验证版本
    const deviceCode = req.query.deviceCode;
    log.info('根据设备码获取用户名信息' + deviceCode)
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


// 获取游戏线注
app.get('/betsJackpot', function (req, res) {
    //验证版本
    const gameId = req.query.gameId;
    log.info('获取游戏线注' + gameId)
    if(gameId === undefined || isNaN(gameId)){
        return;
    }
    gameInfo.betsJackpot(gameId, row =>{
        if(row){
            res.send({code: 1, data: row});
        }else{
            res.send({code: 0, data: row});
        }
    });
});


// 保存新手指引步数
app.get('/saveGuideStep', function (req, res) {
    //验证版本
    const userId = req.query.userId ? parseInt( req.query.userId) : 0;
    const step = req.query.step;
    log.info('保存新手指引步数' + userId + 'step:' + step)

    if(step === '' || step === undefined || !gameInfo.IsPlayerOnline(userId)){
        res.send({code: ErrorCode.FAILED.code, msg: ErrorCode.FAILED.msg});
        return
    }
    gameInfo.saveGuideStep(userId, step, (code, msg) =>{
        res.send({code: code, msg: msg});
    });
});




// 获取商品列表
app.get('/goodsList', function (req, res) {
    const userId = req.query.userId;
    log.info('获取商品列表' + userId)
    if(userId === undefined || userId === ''){
        return;
    }
    gameInfo.getShoppingGoods(parseInt(userId), (code, msg, data) =>{
        if(code){
            res.send({code: code, data: data});
        }else{
            res.send({code: code, msg: msg});
        }
    });
});


// 获取限时折扣物品
app.get('/discountLimited', function (req, res) {
    const userId = req.query.userId;
    log.info('获取限时折扣物品' + userId)
    if(userId === undefined || userId === ''){
        return;
    }
    gameInfo.discountLimited(parseInt(userId), (code, msg, data) =>{
        if(code){
            res.send({code: code, data: data});
        }else{
            res.send({code: code, msg: msg});
        }
    });
});

// 购买商品
app.get('/Shopping', async function (req, res) {
    const userId = req.query.userId;
    const productId = req.query.productId;
    const count = req.query.count ? req.query.count : 1;
    const service = req.query.service ? req.query.service : 0;
    const shopType = req.query.shopType ? req.query.shopType : 0;
    log.info('购买商品' + userId + 'productId:' + productId + 'shopType:' + shopType + 'service:' + service)

    if(shopType === undefined || service === undefined || userId === undefined || userId === '' || productId === undefined || count === undefined) return;

    const ret = await CacheUtil.recordUserProtocol(userId, "Shopping")
    if (ret) {
        gameInfo.Shopping(Number(userId), Number(productId), Number(count), Number(service), Number(shopType),(code, msg, data) => {
            CacheUtil.delUserProtocol(userId, "Shopping")
            if(code){
                res.send({code: code, data: data});
            }else{
                res.send({code: code, msg: msg});
            }
        });
    }
});

// 购买商品订单回调
app.get('/shoppingCallBack', async function (req, res) {
    try {
        //验证版本
        const userId = req.query.userId ? Number(req.query.userId) : 0;
        const orderId = req.query.orderId ? req.query.orderId : null;
        log.info('购买商品订单回调' + userId + '订单' + orderId)
        if (userId === undefined || userId === '' || orderId === undefined || orderId === '') return;

        const ret = await CacheUtil.recordUserProtocol(userId, "shoppingCallBack")
        if (ret) {
            gameInfo.shoppingCallBack(userId, orderId, (code, msg, data, shopType, service) => {
                CacheUtil.delUserProtocol(userId, "shoppingCallBack")
                // 响应
                res.send({code: code, msg: msg});
                // 回调socket
                if(service === 0){ // 大厅
                    gameInfo.sendHallShopCallBack(userId, shopType, code, msg, data)
                }else if(service === 1){ // 游戏内
                    const serverId = 15129;
                    gameInfo.sendGameShopCallBack(userId, shopType, serverId, code, msg, data)
                }
            });
        } else {
            res.send({code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
        }
    }catch (e){
        log.err('shoppingCallBack' + e)
        res.send({code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
    }
});

// 提现审核通过回调地址
app.get('/withdrawCallBack', async function (req, res) {
    //验证版本
    const userId = req.query.userId ? Number(req.query.userId) : 0;
    const orderId = req.query.orderId ? req.query.orderId : null;
    log.info('提现审核通过回调地址' + userId + '订单' + orderId)
    if (userId === undefined || userId === '' || orderId === undefined || orderId === '') return;
    gameInfo.withdrawCallBack(userId, orderId, (code, msg) =>{
        if(code){
            res.send({code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
        }else{
            res.send({code: ErrorCode.FAILED.code, msg: ErrorCode.FAILED.msg});
        }
    })
});



// 判断用户是否破产
app.get('/bankrupt', function (req, res) {
    //验证版本
    const userId = req.query.userId ;
    log.info('判断用户是否破产' + userId)
    if(userId === undefined || userId === ''){
        return;
    }
    gameInfo.bankruptGrant(parseInt(userId), (code, msg, data) =>{
        if(code){
            log.info('判断用户是否破产' + userId + '数据:' +data)
            res.send({code: code, msg: msg, data: data});
        }else{
            res.send({code: ErrorCode.FAILED.code, msg: ErrorCode.FAILED.msg});
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
                        findUser(user, socket);
                    }
                });
            }else{
                findUser(user, socket);
            }
        } catch (e) {
            socket.emit("loginResult", {code: ErrorCode.LOGIN_ERROR.code, msg: ErrorCode.LOGIN_ERROR.msg});
            log.err('登录异常', e);
        }
    })
    
    function findUser(user, socket) {
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
                    vip_score: userInfo.vip_score,
                    is_vip: userInfo.is_vip,
                    bankScore: userInfo.bankScore,
                    totalRecharge: userInfo.totalRecharge
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
    socket.on("sendEmailCode", async function (toEmail) {
        if(!toEmail){
            return;
        }
        const userId = socket.userId;
        try {
            const ret = await CacheUtil.recordUserProtocol(userId, "sendEmailCode");
            if(ret){
                gameInfo.sendEmailCode(socket, toEmail, (code, msg) =>{
                    CacheUtil.delUserProtocol(userId, "sendEmailCode")
                    socket.emit('sendEmailCodeResult', {code: code, msg: msg});
                });
            }
        } catch (e) {
            log.err('sendEmailCode' +  e);
            socket.emit('sendEmailCodeResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
        }
    });

    // 绑定邮箱
    socket.on("bindEmail", function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.email || !d.code){
                return;
            }
            gameInfo.bindEmail(socket, d.email, d.code, (code, msg, data) =>{
                if(code){
                    socket.emit('bindEmailResult', {code: code, data: data});
                }else{
                    socket.emit('bindEmailResult', {code: code, msg: msg});
                }
            });
        } catch (e) {
            log.err('bindEmailResult' + e);
            socket.emit('bindEmailResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
        }
    });

    // 注册
    socket.on("register", function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.email || !d.code){
                return;
            }
            if(d.type === 0){
                gameInfo.registerByEmail(socket, d.email, d.code, (code, msg, data) =>{
                    if(code){
                        socket.emit('registerResult', {code: code, data: data});
                    }else{
                        socket.emit('registerResult', {code: code, msg: msg});
                    }
                });
            }
        } catch (e) {
            log.err('注册' +  e);
            socket.emit('registerResult', {code: 0, msg: '注册失败'});
        }
    });


    // 兑换礼品
    socket.on("exchangeGift", async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.cdkey === undefined || d.cdkey.length < 1) return;
        const userId = socket.userId;

        if (gameInfo.IsPlayerOnline(socket.userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, "exchangeGift")
            if(ret){
                gameInfo.exchangeGift(socket, d.cdkey, (code, msg, data) =>{
                    CacheUtil.delUserProtocol(userId, "exchangeGift")
                    if(code){
                        socket.emit('exchangeGiftResult', {code:code,data:data});
                    }else{
                        socket.emit('exchangeGiftResult', {code:code,msg:msg});
                    }
                });
            }
        }else{
            socket.emit('exchangeGiftResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
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
                socket.emit('UserInfoResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
            }
        }catch (e) {
            socket.emit('UserInfoResult', {code:ErrorCode.ERROR.code, msg:ErrorCode.ERROR.msg});
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
            socket.emit('getVipConfigResult', {code:ErrorCode.ERROR.code, msg:ErrorCode.ERROR.msg});
        }
    });


    // vip获取每日每月金币
    socket.on("vipGetGoldDetail", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.vipGetGoldDetail(socket);
        }else{
            socket.emit('vipGetGoldDetailResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
        }
    });

    // VIP领取金币
    socket.on("vipGetGold", async function (data) {
        log.info('vipGetGold' + data);
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.type === undefined) return;
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, "vipGetGold")
            if(ret){
                gameInfo.vipGetGold(userId, d.type, (code, msg, data) =>{
                    CacheUtil.delUserProtocol(userId, "vipGetGold")
                    if(code){
                        socket.emit('vipGetGoldResult', {code:code,data:data});
                    }else{
                        socket.emit('vipGetGoldResult', {code:code,msg:msg});
                    }
                })
            }
        }else{
            socket.emit('vipGetGoldResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
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
            socket.emit('getBankScoreResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
        }
    });


    // 筹码存储-银行取出金币
    socket.on('bankIntoHallGold', async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.gold === undefined || !d.gold) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            // 银行是否被锁
            if(gameInfo.isBankLock(userId)){
                socket.emit('bankIntoHallGoldResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                return;
            }
            const ret = await CacheUtil.recordUserProtocol(userId, 'bankIntoHallGold')
            if(ret){
                gameInfo.bankIntoHallGold(socket, d.gold, (code,msg,data) =>{
                    CacheUtil.delUserProtocol(userId, "bankIntoHallGold")
                    if(code){
                        socket.emit('bankIntoHallGoldResult', {code:code,data: data});
                    }else{
                        socket.emit('bankIntoHallGoldResult', {code:code,msg: msg});
                    }
                });
            }
        }
    });

    // 筹码存储-金币转入银行
    socket.on('hallGoldIntoBank', async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.gold === undefined || !d.gold) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            // 银行是否被锁
            if(gameInfo.isBankLock(userId)){
                socket.emit('hallGoldIntoBankResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                return;
            }
            const ret = await CacheUtil.recordUserProtocol(userId, 'hallGoldIntoBank')
            if(ret){
                gameInfo.hallGoldIntoBank(socket, d.gold, (code, msg, data) =>{
                    CacheUtil.delUserProtocol(userId, "hallGoldIntoBank")
                    if(code){
                        socket.emit('hallGoldIntoBankResult', {code:code,data: data});
                    }else{
                        socket.emit('hallGoldIntoBankResult', {code:code,msg: msg});
                    }
                });
            }
        }
    });

    // 银行转账
    socket.on('bankTransferOtherBank', async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || !d.giveUserId || !d.bankScore) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            // 银行是否被锁
            if(gameInfo.isBankLock(userId)){
                socket.emit('bankTransferOtherBankResult', {code: 0, msg: "您的账号暂时无法交易，请联系客服"});
                return;
            }
            const ret = await CacheUtil.recordUserProtocol(userId, "bankTransferOtherBank");
            if(ret){
                gameInfo.bankTransferOtherBank(socket, d.giveUserId, d.bankScore, (code, msg, data) =>{
                    CacheUtil.delUserProtocol(userId, "bankTransferOtherBank")
                    if(code){
                        socket.emit('bankTransferOtherBankResult', {code:code, data: data});
                    }else{
                        socket.emit('bankTransferOtherBankResult', {code:code, msg: msg});
                    }
                });
            }
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
            socket.emit('bankTransferIntoRecordResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
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
            socket.emit('bankTransferOutRecordResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
        }
    });


    // 提现页
    socket.on('withdrawPage', async function () {
        const userId = socket.userId;
        const ret = await CacheUtil.recordUserProtocol(userId, "withdrawPage");
        if (ret) {
            gameInfo.getWithdrawPage(userId, (code, msg, data) => {
                CacheUtil.delUserProtocol(userId, "withdrawPage")
                if (code) {
                    socket.emit('withdrawPageResult', {code: code, data: data});
                } else {
                    socket.emit('withdrawPageResult', {code: code, msg: msg});
                }
            });
        }
    })


    // 绑定银行卡
    socket.on('bindBankCard', function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || !d.cpf || !d.account || !d.name || !d.bankType) return;

        const userId = socket.userId;
        if(gameInfo.IsPlayerOnline(userId)){
            gameInfo.bindBankCard(userId, d.account, d.bankType, d.name, d.cpf , (code, msg) => {
                if (code) {
                    socket.emit('bindBankCardResult', {code: code, msg: msg});
                } else {
                    socket.emit('bindBankCardResult', {code: code, msg: msg});
                }
            });
        }else {
            socket.emit('bindBankCardResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    })

    // 发起提现申请
    socket.on('withdraw', async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || !d.account || !d.pwd || !d.amount || !d.currencyType) return;
        const userId = socket.userId;
        const ret = await CacheUtil.recordUserProtocol(userId, "withdraw");
        if (ret) {
            gameInfo.withdrawApply(userId, d.pwd, d.amount, d.account, d.currencyType, (code, msg, data) => {
                CacheUtil.delUserProtocol(userId, "withdraw")
                if(code){
                    socket.emit('withdrawResult', {code: code, msg: msg, data: data});
                }else{
                    socket.emit('withdrawResult', {code: code, msg: msg});
                }

            });
        }
    })

    // 提现记录查询
    socket.on('withdrawRecord', function () {
        const userId = socket.userId;
        gameInfo.withdrawRecord(userId, (code, msg, data) => {
            if(code){
                socket.emit('withdrawRecordResult', {code: code, data: data});
            }else{
                socket.emit('withdrawRecordResult', {code: code, msg: msg});
            }
        });
    })


    // 设置银行密码
    socket.on('setBankPwd', function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d.pwd1 || !d.pwd2) return;

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
    });

    // 修改银行密码
    socket.on('updateBankPwd', function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.pwd) return;

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
                        socket.emit('updateBankPwdResult', {code: 0, msg: "原密码错误"});
                    } else {
                        gameInfo.updateUserBankPwd(socket, d);
                    }
                });
            }
        }catch (e) {
            socket.emit('updateBankPwdResult', {code:ErrorCode.ERROR.code, msg:ErrorCode.ERROR.msg});
        }
    });

    // 校验银行密码
    socket.on('checkBankPwd', function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || !d.pwd) return;

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
                                socket.emit('checkBankPwdResult', {code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
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
                socket.emit('checkBankPwdResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
            }
        }catch (e){
            socket.emit('checkBankPwdResult', {code:ErrorCode.ERROR.code, msg:ErrorCode.ERROR.msg});
        }
    });


    // 查询签到详情页
    socket.on("getSignInDetail", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.searchUserSignInDetail(socket, (code, msg, data) =>{
                if(code){
                    socket.emit('getSignInDetailResult', {code:code, data: data});
                }else{
                    socket.emit('getSignInDetailResult', {code:code, msg: msg});
                }
            });
        }else{
            socket.emit('getSignInDetailResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    });

    // 签到
    socket.on("signIn", async function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, "signIn");
            console.log('用户进行签到', userId, '-' , ret)
            if (ret) {
                gameInfo.signIn(socket, ok => {
                    CacheUtil.delUserProtocol(userId, "signIn")
                    if (ok) {
                        socket.emit('signInResult', {code: ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
                    } else {
                        log.info('签到失败' + userId)
                        socket.emit('signInResult', {code: ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
                    }
                });
            }
        } else {
            log.info('签到失败用户离线' + userId)
            socket.emit('signInResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    });

    // 获取每个玩家大厅幸运币详情页
    socket.on("hallLuckyPageDetail", function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            gameInfo.getHallLuckyPageDetail(socket);
        }else{
            socket.emit('hallLuckyPageDetailResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    });

    // 领取幸运币
    socket.on("getLuckyCoin", async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.type === undefined) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, "getLuckyCoin");
            if(ret){
                gameInfo.getLuckyCoin(socket, d.type, (code, msg, data) =>{
                    CacheUtil.delUserProtocol(userId, "getLuckyCoin")
                    if(code){
                        socket.emit('getLuckyCoinResult', {code:code, msg: msg, data : data});
                    }else{
                        socket.emit('getLuckyCoinResult', {code:code, msg: msg});
                    }
                });
            }
        }else{
            socket.emit('getLuckyCoinResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    });


    // 获取转盘详情页
    socket.on("luckyCoinDetail", function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.val === undefined) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
                // 活动奖池
                gameInfo.getLuckyCoinDetail(socket, d.val);
            });
        }else{
            socket.emit('luckyCoinDetailResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
        }
    });


    // 大厅转盘游戏免费模式
    socket.on("turntable", async function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, 'turntable')
            if(ret){
                // 免费模式扣除幸运币
                CacheUtil.getActivityLuckyDetailByUserId(userId, luckyDetail =>{
                    CacheUtil.getLuckyCoinConfig().then(luckyCoinConfig =>{
                        const turntableCoin = luckyCoinConfig.turntableCoin;
                        const luckyCoin = luckyDetail.luckyCoin;
                        if(luckyCoin < turntableCoin){
                            CacheUtil.delUserProtocol(userId, 'turntable')
                            socket.emit('turntableResult', {code:0, msg:"幸运币不足"});
                            return;
                        }
                        // 扣幸运币
                        luckyDetail.luckyCoin = Number(luckyDetail.luckyCoin) - turntableCoin;
                        log.info('用户' + userId + '转盘扣幸运币' + turntableCoin + '剩余幸运币' + luckyDetail.luckyCoin);
                        CacheUtil.updateActivityLuckyConfig(userId, luckyDetail).then(ret =>{
                            if(ret){
                                // 免费幸运币数量
                                redis_laba_win_pool.get_redis_win_pool().then(async function (jackpot) {
                                    gameInfo.turntable(userId, 1, (code, msg, data) =>{
                                        CacheUtil.delUserProtocol(userId, 'turntable')
                                        if(code){
                                            socket.emit('turntableResult', {code:code, data: data});
                                        }else{
                                            socket.emit('turntableResult', {code:code, msg: msg});
                                        }
                                    });

                                });
                                return;
                            }else{
                                CacheUtil.delUserProtocol(userId, 'turntable')
                            }
                            socket.emit('turntableResult', {code:ErrorCode.ERROR.code, msg: ErrorCode.ERROR.msg});
                        })
                    });
                });
            }
        }else{
            socket.emit('turntableResult', {code: ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
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


    // 绑定邀请码
    socket.on("bindInviteCode", async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || !d.inviteCode || d.inviteCode.length < 1) return;

        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, 'bindInviteCode')
            if(ret){
                gameInfo.bindInviteCode(socket, d.inviteCode, (code, msg) =>{
                    CacheUtil.delUserProtocol(userId, 'bindInviteCode')
                    socket.emit('bindInviteCodeResult', {code:code, msg: msg});
                });
            }
        }else{
            socket.emit('bindInviteCodeResult', {code:ErrorCode.USER_OFFLINE.code, msg: ErrorCode.USER_OFFLINE.msg});
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
    socket.on("getRebate", async function () {
        console.log('getRebate', socket.userId)
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, 'getRebate')
            if(ret){
                gameInfo.getRebate(socket, (code, msg) =>{
                    CacheUtil.delUserProtocol(userId, 'getRebate')
                    socket.emit('getRebateResult', {code:code, msg: msg});
                });
            }
        }else{
            socket.emit('getRebateResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
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
    socket.on("feedback", async function (data) {
        try{
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if(!d || d.txt === undefined || d.txt === '') return;
            if(d.txt.length > 100){
                socket.emit('feedbackResult', {code:0, msg:"长度限制100字"});
                return;
            }

            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                const ret = await CacheUtil.recordUserProtocol(userId, 'feedback')
                if(ret){
                    gameInfo.feedback(socket, d.txt, (code, msg) =>{
                        CacheUtil.delUserProtocol(userId, 'feedback')
                        socket.emit('feedbackResult', {code: code, msg: msg});
                    });
                }
            }else{
                socket.emit('feedbackResult', {code:ErrorCode.USER_OFFLINE.code, msg:ErrorCode.USER_OFFLINE.msg});
            }
        }catch (e){
            socket.emit('feedbackResult', {code:ErrorCode.ERROR.code, msg:ErrorCode.ERROR.msg});
        }
    });


    // 设置-联系我们-问题回答
    socket.on("contactUs", async function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret =  await CacheUtil.recordUserProtocol(userId, 'contactUs')
            if(ret){
                gameInfo.contactUs(socket, (code, data) =>{
                    CacheUtil.delUserProtocol(userId, 'contactUs')
                    socket.emit('contactUsResult', {code:code, data: data});
                });
            }
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
            if(!d || !d.deviceCode || !d.account) return;

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

   /* // 保存新手指引步数
    socket.on("saveGuideStep", async function (data) {
        const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
        if(!d || d.step === '' || !d.step) return;
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, 'saveGuideStep')
            if(ret){
                gameInfo.saveGuideStep(socket, d.step, (code, msg) =>{
                    CacheUtil.delUserProtocol(userId, 'saveGuideStep')
                    socket.emit('saveGuideStepResult', {code:code, msg: msg});
                });
            }
        }else{
            socket.emit('saveGuideStepResult', {code:0, msg:"用户不在线"});
        }
    });*/


    // 新用户送金币
    socket.on('newHandGive', async function () {
        const userId = socket.userId;
        if (gameInfo.IsPlayerOnline(userId)) {
            const ret = await CacheUtil.recordUserProtocol(userId, 'newHandGive')
            if(ret){
                gameInfo.getNewhandProtectGlod(userId, giveGold =>{
                    CacheUtil.delUserProtocol(userId, 'newHandGive')
                    if(giveGold){
                        socket.emit('newHandGiveResult', {code:1, data:{type:[TypeEnum.GoodsType.gold], val: [giveGold]}});
                    }else{
                        socket.emit('newHandGiveResult', {code:1, data:{type:[TypeEnum.GoodsType.gold], val: [0]}});
                    }
                });
            }
        }else{
            socket.emit('newHandGiveResult', {code:0, msg:"用户不在线"});
        }
    });


    // 查询大厅活动页配置
    socket.on("activityPage", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getActivityConfigPage(socket);
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

});


app.set('port', process.env.PORT || 13000);

const server = http.listen(app.get('port'), function () {
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
