const dao = require("./../dao/dao");
const crypto = require('crypto');
const key = "42dfcb34fb02d8cd";
const Buffer = require("buffer").Buffer;
let i = "0" + 1;
const guessLoginApi = function (req, gameInfo , callback) {
	if (req.query.act == "getGuessA") {
		var newDate = new Date();
		//在小于10的月份前补0
		var month = eval(newDate.getMonth() + 1) < 10 ? '0' + eval(newDate.getMonth() + 1) : eval(newDate.getMonth() + 1);
		//在小于10的日期前补0
		var day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
		//在小于10的小时前补0
		var hours = newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
		//在小于10的分钟前补0
		var minutes = newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes();
		//在小于10的秒数前补0
		var seconds = newDate.getSeconds() < 10 ? '0' + newDate.getSeconds() : newDate.getSeconds();
		//拼接时间
		var stringDate = newDate.getFullYear() + '-' + month + '-' + day + " " + hours + ":" + minutes + ":" + seconds;
		var h = stringDate.replace(/\s+/g, "");
		var m = h.replace(/\-/g, "");
		var s = m.replace(/\:/g, "") + i;


		var keys = Math.ceil(Math.random() * 9);
		var keys2 = Math.ceil(Math.random() * 9);
		var keys3 = Math.ceil(Math.random() * 9);
		var numbb = String.fromCharCode(65 + keys);
		var numbb2 = String.fromCharCode(65 + keys2);
		var numbb3 = String.fromCharCode(65 + keys3);
		var daili = req.query.daili;
		var time_name = daili + s;
		var king = keys + numbb + keys2 + numbb2 + keys3 + numbb3;

		var contents = req.query.act + req.query.daili + req.query.time + key;

		if (md53(contents) != req.query.sign) {
			sendStr = '{"status":1,"msg":"参数不正确!"}';
			callback(1, sendStr);
			return;
		}

		i++;
		var stri = i;
		if (i < 10) {
			i = "0" + i;
			stri = i
		} else {
			i = i;
			stri = i;
		}
		if (i >= 99) {
			i = "0" + 1;
		}
		var Dirs = s.split('');
		var Arr1 = Dirs[3] + Dirs[5] + Dirs[7] + Dirs[9] + Dirs[11] + stri;
		var key_login = "89b5b987124d2ec3";
		content = time_name + king + key_login;
		var md5_sign = crypto.createHash('md5');
		md5_sign.update(content);

		var userInfo = {};
		userInfo.accountname = time_name;
		userInfo.pwd = md5_sign.digest('hex');
		userInfo.nickname = "USER" + Arr1;
		userInfo.goldnum = 1800;
		userInfo.p = king;
		userInfo.phoneNo = "";
		userInfo.email = "";
		userInfo.sex = "";
		userInfo.city = "";
		userInfo.province = "";
		userInfo.country = "";
		userInfo.headimgurl = RandomNumBoth(0, 9).toString();
		userInfo.language = "";
		userInfo.loginCode = "";
		userInfo.ChannelType = req.query.daili;
		userInfo.bindUserId = "";
		userInfo.did = "";

		dao.RegisterByGuest(userInfo, function (code, data) {
			if (code) {
				const userId  = data.Id;
				// 设置邀请码
				gameInfo.setInviteCode(userId)
				console.log("游客注册成功:" + userId + "账户:" + data.Account + "金币:" + data.score + "金币:" + data.diamond);
				callback(1, '{"status":0,"msg":"","data":{"password":"' + king + '","account":"' + time_name + '"}}');
				return;
			}
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


module.exports = guessLoginApi;



