const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let withdrawal_api = require('./class/withdrawal_api');
const bodyParser = require('body-parser');
const weixin = require('./class/weixin');
const Robotname = require('./config/RobotName');
const crypto = require('crypto');
const gm_api = require('./class/gm_api');
const ml_api = require('./class/ml_api');
const tw_api = require('./class/tw_api');
const dao = require('./dao/dao');
const log = require("../CClass/class/loginfo").getInstand;
const consolidate = require('consolidate');
const statics = require('express-static');
const sms = require("./class/sms.js");
const StringUtil = require("../util/string_util");
const gameInfo = require("./class/game").getInstand;
const ServerInfo = require('./config/ServerInfo').getInstand;
const ErrorCode = require('../util/ErrorCode');

//版本密钥和版本号
const version = "ymymymymym12121212qwertyuiop5656_";
const num = "2.0";

app.use(statics('./static/'));

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


// 充值接口
app.get('/recharge', function (req, res) {
    gameInfo.Recharge(req.query.userId, req.query.amount,function ( callback) {
        if(callback){
            res.send("recharge success");
        }else{
            res.send("recharge failed");
        }
    });
});


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

// 游客登录
app.get('/weixinLogin', function (req, res) {
    //外部接口
    weixin(req, function (act, sendStr) {
        if (act == 1) {
            res.send(sendStr);
        } else if (act == 2) {
            res.redirect(sendStr);
        }

    });
});


app.get('/ml_api', function (req, res) {
    //外部接口
    ml_api.get(req, function (act, sendStr) {
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



//获取验证码
app.post('/getSmsCode', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('getSmsCode-json');
    }
    sms.send_shansuma(req.body.phone);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({code: 1}));
    response.end();
});
//校验验证码
app.post('/checkSmsCode', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('checkSmsCode-json');
    }
    let isCodeRight = sms.verify(req.body.phone, req.body.code); // 返回true/false
    let code = 0;
    if (isCodeRight) {
        code = 1;
    }
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({code: code}));
    response.end();
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
                const key_login = "89b5b987124d2ec3";
                let content = user.userName + user.password + key_login;
                if(user.userName && user.userName.includes("user_")){
                    content = key_login;
                }
                const md5_sign = crypto.createHash('md5');
                md5_sign.update(content);
                user.password = md5_sign.digest('hex');
                user.sign = user.password;
            }
            // 邮箱登录
            if(user.email && user.code){
                gameInfo.verifyEmailCode(user.email, user.code, (code, msg) =>{
                    if(code !== ErrorCode.EMAIL_CODE_VERIFY_SUCCESS.code){
                        socket.emit('loginResult', {code: code, msg: msg});
                    }else{
                        databaseCheck(user, socket);
                    }
                });
            }else{
                databaseCheck(user, socket);
            }
        } catch (e) {
            socket.emit("loginResult", {code: ErrorCode.LOGIN_ERROR.code, msg: ErrorCode.LOGIN_ERROR.msg});
            log.err('登录异常', e);
        }
    })
    
    function databaseCheck(user, socket) {
        dao.login(user, socket, (code, msg, data)=> {
            if(ErrorCode.LOGIN_SUCCESS.code === code){
                if (!data) {
                    socket.emit('loginResult', {code: ErrorCode.LOGIN_FAILED_INFO_ERROR.code, msg: ErrorCode.LOGIN_FAILED_INFO_ERROR.msg});
                    return;
                }
                //数据库有此用户
                if (gameInfo.IsPlayerOnline(data.Id)) {
                    //在线
                    log.info("用户在线,进入等待离线列队");
                    user.id = data.Id;
                    user.socket = socket;
                    user.userName = data.Account;
                    user.headimgurl = data.headimgurl;
                    //加入登录列队
                    gameInfo.addLoginList(user);
                } else {
                    // 登录成功
                    gameInfo.addUser(data, socket, function (result) {
                        if (result === 1) {   //断线从连
                            gameInfo.lineOutSet({userId: user.id})
                        }
                    });
                }
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
        }
        log.info("用户断开连接:" + socket.userId);
        // 如果用户还存在的话，删除
        var userInfo = {userId: socket.userId, nolog: true};
        gameInfo.deleteUser(userInfo);
    });

    // 有用户离开
    socket.on('userDisconnect', function (_userInfo) {
        log.info("userDisconnect:");
        log.info(_userInfo);
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

    // 注册
    socket.on("register", function (_info) {
        try {
            log.info(_info);
            const parm = StringUtil.isJson(_info) ? JSON.parse(_info) : _info;
            if(parm.type === 0){
                // 注册
                gameInfo.register(socket, parm.email, parm.code);
            }
        } catch (e) {
            log.err('sendEmailCode',  e);
        }
    });

    // 获得商城商品列表
    socket.on("getShoppingList", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getShopping_List(socket);
        }
    });

    // 购买商品
    socket.on("Shopping", function (data) {
        try {
            const d = JSON.parse(data);
            if (gameInfo.IsPlayerOnline(socket.userId)) {
                gameInfo.Shopping(socket.userId, d.productId, d.count, socket);
            }else{
                socket.emit('ShoppingResult', '{"status":1,"msg":"用户不在线"}');
            }
        }catch (e) {
            socket.emit('ShoppingResult', '{"status":1,"msg":"参数有误"}');
        }
    });


    // 获取用户信息
    socket.on("getUserInfo", function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                const user = gameInfo.getUser(userId);
                const userInfo = {
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
                };
                log.info('getUserInfo' + userInfo)
                socket.emit('UserInfoResult', {status: 1, msg: userInfo});
            }else{
                log.info('getUserInfo用户不在线')
                socket.emit('UserInfoResult', '{"status":1,"msg":"用户不在线"}');
            }
        }catch (e) {
            socket.emit('UserInfoResult', '{"status":1,"msg":"用户不在线"}');
        }
    });

    // 获取VIP配置
    socket.on("getVipConfig", function () {
        try {
            const userId = socket.userId;
            if (gameInfo.IsPlayerOnline(userId)) {
                const config = gameInfo.getVipConfig();
                socket.emit('getVipConfigResult', {code:1, msg: config});
            }
        }catch (e) {
            socket.emit('getVipConfigResult', {code:1, msg:"用户不在线"});
        }
    });


    // 游戏结算
    socket.on('GameBalance', function (_Info) {
        if (_Info.signCode == serverSign) {
            gameInfo.GameBalance(_Info);
        }
    });

    //游戏结算(俱乐部扣房卡用)
    socket.on('GameUpdateDiamond', function (_Info) {
        log.info("扣除房卡");
        log.info(_Info);
        if (_Info.signCode == serverSign) {
            gameInfo.GameUpdateDiamond(_Info);
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

    //比赛结束
    socket.on('matchEnd', function (_info) {
        gameInfo.addPrize(_info);
    });



    //赠送游戏币给他人
    socket.on("sendCoin", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendCoinjson');
        }

        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.sendCoin(socket, _info);
        }
    });
    //赠送游戏币给他人账号形式
    socket.on("sendCoin2", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendCoinjson');
        }

        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.selectUserIdAndSendCoin(socket, _info);
        }
    });

    //查询游戏币记录
    socket.on("selectCoinLog", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.selectCoinLog(socket);
        }
    });

    socket.on("selectgetCoinLog", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.selectgetCoinLog(socket);
        }
    });

    //修改游戏币记录状态
    socket.on("updateCoinLogState", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendCoinjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.updateCoinLogState(socket, _info);
        }
    });

    //获取邮件
    socket.on("getEmail", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getEmail(socket);
        }
    });

    //设置邮件已读
    socket.on("setEmailRead", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendCoinjson');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.setEmailRead(socket, _info);
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
    socket.on("updateNickName", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('updateNickName-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.updateNickName(socket, _info);
        }
    });

    //修改头像
    socket.on("updateHeadUrl", function (_info) {
        try {
            var data = JSON.parse(_info);
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

    //转正
    socket.on("changeOfficial", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('changeOfficial-json');
        }
        if (gameInfo.checkData(socket, _info)) {
            gameInfo.changeOfficial(socket, _info);
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

    //绑定支付宝
    socket.on("bindZhifubao", function (_info) {

        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('bindZhifubao-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.bindZhifubao(socket, _info);
        }
    });

    //发验证码
    socket.on("sendbindPhoneNo", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('sendbindPhoneNo-json');
        }

        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.sendbindPhoneNo(socket, _info);
        }
    });


    //绑定手机
    socket.on("bindPhone", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('bindPhone-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.bindPhone(socket, _info);
        }
    });

    //获取是否有未领取奖品
    socket.on("getPrize", function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('getPrize-json');
        }
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getPrize(socket, _info);
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


    //获得每日登录奖励
    socket.on("getEveryLogin", function () {
        if (gameInfo.IsPlayerOnline(socket.userId)) {
            gameInfo.getEveryLogin(socket);
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

    //领取新手卡
    socket.on('newPlayerExchange', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('newPlayerExchange-json');
        }
        if (!socket.userId) {
            return;
        }
        let sendData = {
            userId: socket.userId,
            code: _info.key
        };
        ml_api.cdKey(sendData, (res) => {
            console.log(res);
            if (res.code == 1) {
                socket.emit('newPlayerExchangeResult', {Result: 1, msg: "兑换成功"});
            } else {
                socket.emit('newPlayerExchangeResult', {Result: 0, msg: res.msg});
            }
        });
    });

    //修改银行密码
    socket.on('updateBankpwd', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('updateBankpwd-json');
        }
        if (!socket.userId) {
            return;
        }
        gameInfo.getUserBankPwd(socket.userId, (pwd) => {
            if (pwd != _info.pwd) {
                socket.emit('updateBankpwdResult', {Result: 0, msg: "原始密码错误"});
                return;
            } else {
                gameInfo.updateUserBankPwd(socket, _info);
            }
        });
    });

    //获取银行分数
    socket.on('getBankScore', function () {
        if (!socket.userId) {
            return;
        }
        socket.emit('getBankScoreResult', {
            bankScore: gameInfo.userList[socket.userId].bankScore
        });
    });

    //修改银行分数
    socket.on('updateBankScore', function (_info) {
        try {
            var data = JSON.parse(_info);
            _info = data;
        } catch (e) {
            log.warn('updateBankScore-json');
        }
        if (!socket.userId) {
            return;
        }
        //判断存取
        if (_info.saveCoin > 0) {
            if (gameInfo.userList[socket.userId].getScore() < _info.saveCoin) {
                socket.emit('updateBankScoreResult', {ResultCode: 0, msg: "金币不足"});
                return;
            }
            gameInfo.updateBankScore(socket, _info);
        } else {
            //密码判断
            gameInfo.getUserBankPwd(socket.userId, (pwd) => {
                if (pwd != _info.pwd) {
                    socket.emit('updateBankScoreResult', {Result: 0, msg: "银行密码错误"});
                    return;
                } else {
                    if (gameInfo.userList[socket.userId].bankScore < -_info.saveCoin) {
                        socket.emit('updateBankScoreResult', {ResultCode: 0, msg: "银行余额不足"});
                        return;
                    }
                    gameInfo.updateBankScore(socket, _info);
                }
            });
        }
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


const period = 1000;
setInterval(function () {
    //更新登录
    gameInfo.updateLogin();
    //保存用户
    gameInfo.saveUser();
    gameInfo.pisaveUser2();
    //保存log
    gameInfo.score_changeLog();
    gameInfo.diamond_changeLog();
}, period);

dao.clenaLineOut();



log.info("登录服务器 v2.0.0");
log.info("服务器启动成功!");
log.info("更新时间:2017.12.17");
