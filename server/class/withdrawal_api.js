let dao = require("./../dao/dao");
let gameInfo = require('./../class/game').getInstand;
let http = require('http');
let https = require('https');
let querystring = require("querystring");
let Buffer = require("buffer").Buffer;
let log = require("../../CClass/class/loginfo").getInstand;

var withdrawal_api = function (_socket, _info) {

    let userInfo = {
        sendUserId: _socket.userId,
        sendCoin: -_info.coin,
        change_type: 4,
        diamond: 0
    };
    //判断玩家分数够不够
    if (gameInfo.userList[_socket.userId].getScore() >= _info.coin) {
        dao.getBank(_socket.userId, function (Result, row) {
            console.log(Result);
            if (Result) {
                this.postData(row[0], _info.coin, (code) => {
                    if (code === 0) {
                        _socket.emit('withdraw_applyResult', {ResultCode: 1});//提现申请失败
                    } else {
                        gameInfo.GameBalanceSub(userInfo, (result) => {
                            console.log(result);
                        });
                        _socket.emit('withdraw_applyResult', {ResultCode: 0});
                    }
                });
            } else {
                //未找到银行卡
                _socket.emit('withdraw_applyResult', {ResultCode: 2});
            }
        });
    } else {
        //当前余额不足
        _socket.emit('withdraw_applyResult', {ResultCode: 3});
    }

    this.postData = function (_info, _money, cb) {
        var post_data = {
            bank_number: _info.account,
            name: _info.name,
            open: _info.bankType,
            money: _money,
            id: _info.userId,

        };//这是需要提交的数据

        var content = querystring.stringify(post_data);
        // var postdata = "bank_number=" + _info.account + "&name=" + _info.name + "&open=" + _info.bankType + "&money=" + _money + "&id=" + _info.userId;

        var options = {
            hostname: 'yidaliadmin.youmegame.cn',
            port: 80,  //注意端口号 可以忽略不写 写一定写对
            path: '/index.php/api/user/exchange',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': content.length,
            }
        };

        var req = http.request(options, function (res) {
            // res.setEncoding('utf8');
            var size = 0;
            var chunks = [];

            res.on('data', function (chunk) {
                size += chunk.length;
                chunks.push(chunk);
            });

            res.on('end', function () {
                var data = Buffer.concat(chunks, size);
                try {
                    console.log(data.toString());
                    let info = JSON.parse(data.toString());
                    cb(info.code);
                } catch (e) {
                    console.log(e);
                }
            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(content);

        req.end();
    };

};

module.exports = withdrawal_api;