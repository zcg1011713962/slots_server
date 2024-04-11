User = function (userInfo, _socket) {
	this._userId = "";			//数据库ID
	this._socket = "";			//socketID
	this._account = "";			//用户帐号
	this._nickname = "";		//昵称
	this.GameId = 0;			//游戏ID
	this.sign = "";             // 密钥
	this._isLeave = true;
	this._islogin = false;     // 是否登录过

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
		if (_userInfo.userId === this._userId) {
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

	this.init(userInfo, _socket);

};

module.exports = User;