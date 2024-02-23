var dao = require("./../dao/dao")
var gameInfo = require('./../class/game').getInstand;
var crypto = require('crypto');


function md53(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    return crypto.createHash("md5").update(str).digest("hex");
}

var key = "42dfcb34fb02d8cd";

var webGetUser = function(req, callback){
	var sendStr = '0';

	if (req.body.act == "webGetUser"){
		//获取用户
		if (req.body.account && req.body.time && req.body.sign)
		{
			//验证md5
			const content = req.body.act + req.body.account + req.body.time + key;
			if (md53(content) != req.body.sign){
				sendStr = '{"status":1,"msg":"参数不正确!"}'
				callback(sendStr);
				return;
			}
			gameInfo.webGetUser(req.body.account,function(result){
				if (result.code){
					sendStr = '{"status":0,"msg":"","data":{"account":"'+ req.body.account +'","ticket":'+result.ticket+',"nickname":"'+result.nickname+'","userId":"'+result.userId+'"}}'
					callback(sendStr);
					return;
				}else{
					sendStr = '{"status":1,"msg":"查询错误"}'
					callback(sendStr);
					return;
				}
			})
		}else{
			sendStr = '{"status":4,"msg":"参数不正确!"}'
			callback(sendStr);
			return;
		}
	}else if(req.body.act == "webShopBuy"){
		//验证md5
		const content = req.body.act + req.body.userId + req.body.productId + req.body.count + req.body.time + key;
		if (md53(content) != req.body.sign){
			sendStr = '{"status":1,"msg":"参数不正确!"}'
			callback(sendStr);
			return;
		}
		// 购买金币
		if(req.body.productId === 1){
			try {
				// 查询购买的金币道具的数量和价值
				gameInfo.searchShopItemValue(req.body.productId, callback => {
					if (callback) {
						const score = callback[0]['score'] * req.body.count;
						gameInfo.addUserscore(req.body.userId, score);
						console.log('用户增加积分', score);
						sendStr = '{"status":0,"msg":"购买成功"}';
					}
				});
			}catch (e) {
				sendStr = '{"status":1,"msg":"购买失败"}';
			}finally {
				callback(sendStr);
			}
		}
	}else{
		sendStr = '{"status":3,"msg":"参数不正确!"}'
		callback(sendStr);
	}
}


module.exports = webGetUser;