User = function(userInfo,_socket){
    this._userId = "";			//数据库ID
    this._socket = "";			//socketID
    this._account = "";			//用户帐号
    this._nickname = "";		//昵称
    this.GameId = 0;			//游戏ID
    this.sign = "";             // 密钥
    this._isLeave = true;
    this._islogin = false;     // 是否登录过
    this.freeWildTotal = 0;
    this.freeMul = 2;
    this.lastTimeRecord = {free: false, openBox: false, lastHandCard: [], actualMul: 0, expectMulSection: [], win: 0 }; // 上局记录

    this.init = function (_userInfo, _socket) {
        this._userId = _userInfo.userid;
        this.sign = _userInfo.sign;
        this._socket = _socket;
        this._islogin = false;
        //socket绑定用户id
        _socket.userId = _userInfo.userid;
        this._isLeave = false;
    };

    this.update = function (_userInfo) {
        if (parseInt(_userInfo.userId ) === parseInt(this._userId)) {
            this._account = _userInfo.account;
            this._nickname = _userInfo.nickname;
            this._islogin = true;
        }
    };

    //进入游戏
    this.loginGame = function (gametype) {
        this.GameId = gametype;
    };

    //获得游戏ID
    this.getGameId = function () {
        return this.GameId;
    };

    this.getUserId = function () {
        return this._userId;
    };

    this.Islogin = function () {
        return this._islogin;
    };

    this.getLastTimeRecord = function () {
        return this.lastTimeRecord;
    }

    this.setLastTimeRecord = function (m) {
        this.lastTimeRecord = m;
    };

    this.getFreeWildTotal = function () {
        return this.freeWildTotal;
    };

    this.setFreeWildTotal = function (data) {
        this.freeWildTotal = data;
    };

    this.getFreeMul = function () {
        return this.freeMul;
    };

    this.setFreeMul = function (data) {
        this.freeMul = data;
    };

    this.init(userInfo,_socket);
};

module.exports = User;