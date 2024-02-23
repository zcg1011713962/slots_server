var dao = require("./../dao/dao")
var gameInfo = require('./../class/game').getInstand;
var crypto = require('crypto');
var log = require("../../CClass/class/loginfo").getInstand;
var https=require('https');

var key = "42dfcb34fb02d8cd";

const appleRecharge = function (req, callback) {
	const userid = req.body.userId;
	const productId = req.body.productId;



	let userInfo = {};
	if (userInfo.sendCoin && userInfo.sendCoin > 0) {
		// gameInfo.Recharge(userid);
		callback("充值成功");
	} else {
		callback("充值失败");
	}
};


module.exports = appleRecharge;