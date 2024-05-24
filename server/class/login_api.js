const dao = require("../../util/dao/dao");
const crypto = require('crypto');
const Buffer = require("buffer").Buffer;
const StringUtil = require('../../util/string_util');
const {getInstand: gameInfo} = require("./game");
const TypeEnum = require("../../util/enum/type");
const log = require('../../CClass/class/loginfo').getInstand

const key = "42dfcb34fb02d8cd";

const registerByGuestApi = function (req, gameInfo , callback) {
	if (req.query.act == "getGuessA") {
		log.info("游客注册请求");

		const daili = req.query.daili;

		const time = StringUtil.generateTime();
		const account = StringUtil.generateAccount(daili, time);
		const king = StringUtil.generateKing();
		const nickname = StringUtil.generateNickName(time);

		let contents = req.query.act + daili + req.query.time + key;
		if (md53(contents) != req.query.sign) {
			sendStr = '{"status":1,"msg":"参数不正确!"}';
			callback(1, sendStr);
			return;
		}
		const pwd = StringUtil.pwdEncrypt(account, king)

		const userInfo = {};
		userInfo.accountname = account;
		userInfo.pwd = pwd;
		userInfo.nickname = nickname;
		userInfo.goldnum = 0;
		userInfo.p = king;
		userInfo.phoneNo = "";
		userInfo.email = "";
		userInfo.sex = "";
		userInfo.city = "";
		userInfo.province = "";
		userInfo.country = "";
		userInfo.headimgurl = RandomNumBoth(0, 9).toString();
		userInfo.language = 0;
		userInfo.loginCode = "";
		userInfo.ChannelType = daili;
		userInfo.bindUserId = "";
		userInfo.did = "";

		dao.RegisterByGuest(userInfo, function (code, data) {
			if (code) {
				const userId  = data.Id;
				// 设置邀请码
				gameInfo.setInviteCode(userId)
				log.info("游客注册成功:" + userId + "账户:" + data.Account + "金币:" + data.score + "钻石:" + data.diamond);
				callback(1, '{"status":0,"msg":"","data":{"password":"' + king + '","account":"' + account + '"}}');
				return;
			}
			log.info("游客注册失败");
			callback(1, '{"status":1,"msg":"注册失败!"}');
		});
	}
};

function RandomNumBoth(Min, Max) {
	//生成指定范围内随机整数
	var Range = Max - Min;
	var Rand = Math.random();
	var num = Min + Math.round(Rand * Range); //四舍五入
	return num;
}

function md53(data) {
	var buf = new Buffer(data);
	var str = buf.toString("binary");
	return crypto.createHash("md5").update(str).digest("hex");
}


module.exports = registerByGuestApi;



