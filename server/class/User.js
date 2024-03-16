User = function(_userInfo,_socket){
	//相关属性
	this._userId = "";			//数据库ID
	this._socket = "";			//socketID
	this._account = "";			//用户帐号
	this._score = 0;			//金币
	this._diamond = 0;			//钻石
	this.is_vip = 0;			//vip
	this.vip_score = 0;			//vip积分
	this._nickname = "";		//昵称
	this._ageinLogin = false;	//重新登录标签
	this.LoginCount = 0;		//登录次数
	this.LotteryCount = 0;		//游戏次数
	this.GameId = 0;			//游戏ID
	this.RoomId = 1;			//房间ID
	this.TableId = -1;			//桌子ID
	this.SeatId = -1;			//座位ID
	this._proList = {};			//道具列表
	this._phoneNo = "";			//电话号码
	this._email = "";			//电子邮件
	this._sex = -1;				//性别
	this._city = "";			//城市
	this._province = "";		//省份
	this._country = "";			//国家
	this._headimgurl = "";		//头像地址
	this.bankPwd = "";			//银行密码
	this.bankScore = 0;			//银行分数
	this.bankLock = 0;			//银行是否被冻结
	this._chckeNo = "";
	this._prize = [];
	this._dayprize = [];
	this._Robot = false;
	this._official = false;
	this._p = "";
	this._cardList = [];
	this.deleteFlag = false;
	this.firstRecharge = 0;   // 是否购买了首充礼包
	this.dailyGet = 0;        // 是否领取了每日金币
	this.monthlyGet = 0;      // 是否领取了每月金币
	this.AddDate = 0;         // 账户创建时间(时间戳毫秒)
	this.inviteCode = 0;	  // 邀请码
	this.luckyCoin = 0; // 幸运币数量


	this.init = function(_userInfo,_socket){
		this._userId = _userInfo.Id;
		this._account = _userInfo.Account;
		this._score = _userInfo.score;
		this._nickname = _userInfo.nickname;
		this._socket = _socket;
		this._islogin = true;
		this.freeCount = _userInfo.freeCount;
		this.LoginCount = _userInfo.login_count + 1;
		this.LotteryCount = _userInfo.LotteryCount;
		this._sign = _userInfo.sign;
		//socket绑定用户id
		_socket.userId = _userInfo.Id;
		this._diamond = _userInfo.diamond;
		this.is_vip = _userInfo.is_vip;
		this.vip_score = _userInfo.vip_score;
		this.totalRecharge = _userInfo.totalRecharge;
		this.vip_level = _userInfo.housecard;
		this._proList = _userInfo.propList;

		this._phoneNo = _userInfo.phoneNo;
		this._email = _userInfo.email;
		this._sex = _userInfo.sex;
		this._city = _userInfo.city;
		this._province = _userInfo.province;
		this._country = _userInfo.country;
		this._headimgurl = _userInfo.headimgurl;
		this._Robot = _userInfo.Robot;
		this._official = _userInfo.email ? 1 : _userInfo.official;
		this._p = _userInfo.p;
		this.bankPwd = _userInfo.bankPwd;
		this.bankScore = _userInfo.bankScore;
		this.firstRecharge = _userInfo.firstRecharge;
		this.addDate = new Date(_userInfo.AddDate).getTime();
		this.bankLock = _userInfo.bankLock;
		this.luckyCoin = _userInfo.luckyCoin;
		this.inviteCode = _userInfo.invite_code;
	};


	//进入游戏
	this.loginGame = function(gametype){
		this.GameId = gametype; 
	};

	this.resetGame = function(){
		this.GameId = 0; 
	};
	
	//进入房间
	this.loginRoom = function(roomid){
		this.RoomId = roomid;
	};

	//进入桌子
	this.loginTable = function(tableid){
		this.TableId = tableid;
	};

	//获得桌子ID
	this.getTable = function(){
		return this.TableId;
	};

	//进入座位
	this.loginSeat = function(seatid){
		this.SeatId = seatid;
	};

	//获得座位ID
	this.getSeat = function(){
		return this.SeatId;
	};

	//获得游戏ID
	this.getGameId = function(){
		return this.GameId;
	};
	
	//获得房间ID
	this.getRoomId = function(){
		return this.RoomId;
	};
	
	this.getLotteryCount = function(){
		return this.LotteryCount;
	};

	this.getUserId = function(){
		return this._userId;
	};

	this.getScore = function(){
		return this._score;
	};
	this.getDiamond = function(){
		return this._diamond;
	};

	this.winscore = function(_score){
		this._score += parseInt(_score);
	};

	this.Islogin = function(){
		return this._islogin;
	};

	this.addgold = function(_score){
		if (_score > 0){
			//正数,加分
			this._score += parseInt(_score);
			return 1;
		}else{
			if (this._score >= Math.abs(_score)){
				this._score += parseInt(_score);
				return 1;
			}else{
				return 0;
			}
		}
	};
	this.adddiamond = function(_score){
		if (_score > 0){
			//正数,加分
			this._diamond += parseInt(_score);
			return 1;
		}else{
			if (this._diamond >= Math.abs(_score)){
				this._diamond += parseInt(_score);
				return 1;
			}else{
				return 0;
			}
		}
	};


	//添加游戏免费次数
	this.AddFreeCount = function(_count){
		if (_count >= 0)
			this.freeCount += _count;
		else
			console.log("添加免费次数参数不正确!");
	};

	//获得免费游戏次数
	this.getFreeCount = function(){
		return this.freeCount;
	};

	this.firstRecharge = function(val){
		this.firstRecharge = val;
	};


	this.newCheckNo = function(){
		this._chckeNo = Math.floor(Math.random()*9000) + 1000;
		return this._chckeNo;
	};

	this.setPhoneNo = function(_phoneNo){
		this._phoneNo = _phoneNo;
	};



	this.cleanCheckNo = function(){
		this._chckeNo = null;
	};


	this.init(_userInfo,_socket);

};

module.exports = User;