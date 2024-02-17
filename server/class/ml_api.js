var dao = require("./../dao/dao");
var gameInfo = require('./../class/game').getInstand;
var crypto = require('crypto');
var http = require('http');
let querystring = require("querystring");
let Buffer = require("buffer").Buffer;

function makeDate(date) {

    try {

        var newDate = new Date(date);
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
    } catch (e) {
        var stringDate = "0000-00-00 00:00:00";
    } finally {
        return stringDate;
    }

}

function md53(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    return crypto.createHash("md5").update(str).digest("hex");
}


var get_client_ip = function (req) {
    if (req && req.connection && req.socket) {
        var ip = req.headers['x-forwarded-for'] ||
            req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress || '';
        if (ip.split(',').length > 0) {
            ip = ip.split(',')[0]
        }
        if (ip.split(':').length > 0) {
            ip = ip.split(':')[3]
        }
        return ip;
    } else {
        return "127.0.0.1";
    }

};

/**
 * 创建用户
 * @param {*} username
 * @param {*} password
 * @param {*} fullname
 * @param {*} agc
 * @param {*} callback
 */
function createUser(username, password, fullname, agc, ip, callback) {

    var key_login = "89b5b987124d2ec3";
    content = username + password + key_login;

    var userInfo = {};
    userInfo.accountname = username;
    userInfo.pwd = md53(content);
    userInfo.nickname = fullname;
    userInfo.goldnum = 1000000;//临时注册完账号给1万金币
    userInfo.p = password;
    userInfo.phoneNo = "";
    userInfo.email = "";
    userInfo.sex = "";
    userInfo.city = "";
    userInfo.province = "";
    userInfo.country = "";
    userInfo.headimgurl = RandomNumBoth(1, 10).toString();
    userInfo.language = "";
    userInfo.loginCode = "";
    userInfo.ChannelType = agc;
    userInfo.ip = ip;

    //先通过帐号查询ID
    dao.getUserId(username, function (result, userid, userscore, p) {
        if (result) {
            callback(null, '{"status":3,"msg":"注册账号存在"}');
        } else {
            //直接操作数据库
            dao.weixinCreateUser(userInfo, function (Rusult, rcode, res) {
                if (Rusult) {
                    callback(Rusult, res);
                }
            });
            // dao.getUserIdByIp(userInfo.ip, (result) => {
            //     if (result) {
            //         callback(null,'{"status":9,"msg":"注册ip存在"}');
            //     } else {
            //         //直接操作数据库
            //         dao.weixinCreateUser(userInfo, function (Rusult, rcode, res) {
            //             if (Rusult) {
            //                 callback(Rusult, res);
            //             }
            //         });
            //     }
            // });
        }
    })
}

function RandomNumBoth(Min, Max) {
    //生成指定范围内随机整数
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}

function gotoDeposit(username, password, ip, callback) {
    var url = "";
    var actionname = "login";
    var signConten = ip + actionname;
    var st = md53(signConten);
    var postdata = "st=" + st + "&username=" + username + "&password=" + password + "&ip=" + ip;
    console.log("here")
    var appstore_optios = {
        hostname: url,
        port: 80,
        path: '/rest/login.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postdata.length
        }
    };

    //console.log(postdata)
    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                var product_id = 0;
                console.log(data.toString());
                var htmldata = JSON.parse(data.toString());
                var token = encodeURIComponent(htmldata.token)
                // var url_token = "http://www.ylc888.club/services/sso.php?token=" + token + "&p=mydeposit";
                // console.log(url_token)
                callback(2, "url_token")
            } catch (e) {
                sendStr = '{"status":4,"msg":"登录api!解析失败"}'
                callback(1, sendStr);
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
}


function gotoWithdrawal(username, password, ip, callback) {

    var url = "pfapi.ylc888.club";
    var actionname = "withdraw";
    console.log(ip);
    var signConten = ip + actionname;
    var st = md53(signConten);
    var postdata = "st=" + st + "&username=" + username + "&password=" + password + "&ip=" + ip;
    var appstore_optios = {
        hostname: url,
        port: 80,
        path: '/rest/ylcwithdraw.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postdata.length
        }
    };

    // console.log(postdata)
    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                var product_id = 0;
                console.log(data.toString());
                var htmldata = JSON.parse(data.toString());
                var token = encodeURIComponent(htmldata.token);
                var url_token = "http://www.ylc888.club/services/sso.php?token=" + token + "&p=mywithdrawal";
                console.log(url_token);
                callback(2, url_token)
            } catch (e) {
                sendStr = '{"status":4,"msg":"登录api!解析失败"}';
                callback(1, sendStr);
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
}


var key = "42dfcb34fb02d8cd";


//var Newtime =Date.parse(new Date())/100;
var ml_api = {}
ml_api.get = function function_name(req, callback) {
    var sendStr = '0';

    if (req.query.act == "register") {
        if (req.query.accountname && req.query.nickname && req.query.pwd && req.query.time && req.query.sign) {
            var url = "";
            var ip = ""
            var actionname = "register";

            var content = req.query.act + req.query.accountname + req.query.pwd + req.query.time + key;

            if (md53(content) != req.query.sign) {
                sendStr = '{"status":1,"msg":"参数不正确!"}';
                callback(1, sendStr);
                return;
            }

            if (req.query.accountname.length < 6 || req.query.accountname.length > 16) {
                sendStr = '{"status":5,"msg":"账号长度不正确!"}';
                callback(1, sendStr);
                return;
            }

            var pattern = new RegExp("^[A-Za-z0-9]+$");
            if (!pattern.test(req.query.accountname)) {
                sendStr = '{"status":8,"msg":"账号不能有特殊符号!"}';
                callback(1, sendStr);
                return;
            }

            if (req.query.pwd.length < 6 || req.query.pwd.length > 16) {
                sendStr = '{"status":6,"msg":"密码长度不正确!"}';
                callback(1, sendStr);
                return;
            }

            if (req.query.nickname.length < 1 || req.query.nickname.length > 16) {
                sendStr = '{"status":7,"msg":"昵称长度不正确!"}';
                callback(1, sendStr);
                return;
            }

            if (!req.query.agc) {
                req.query.agc = "";
            }

            //类型
            var username = req.query.accountname;		//账号
            var password = req.query.pwd;				//密码
            var fullname = req.query.nickname;			//昵称
            var agc = req.query.agc;					//代理
            var reqIp = req.connection.remoteAddress;

            var signConten = ip + actionname;
            var md5_sign = crypto.createHash('md5');
            md5_sign.update(signConten);
            var st = md5_sign.digest('hex');
            var postdata = "st=" + st + "&username=" + username + "&password=" + password + "&fullname=" + fullname;

            var appstore_optios = {
                hostname: url,
                port: 80,
                path: '/rest/register.php',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postdata.length
                }
            };

            createUser(username, password, fullname, agc, reqIp, function (result, res) {
                if (result) {
                    sendStr = `{"status":0,"msg":"注册成功!","userid":${res[0].rcode}}`;
                    callback(1, sendStr, res);
                } else {
                    sendStr = res;
                    callback(1, sendStr);
                }
            });
            //console.log(postdata)
            // var req = http.request(appstore_optios, function (res) {
            //     var size = 0;
            //     var chunks = [];

            //     res.on('data', function (chunk) {
            //         size += chunk.length;
            //         chunks.push(chunk);
            //     });

            //     res.on('end', function () {

            //         var data = Buffer.concat(chunks, size);

            //         try {
            //             var product_id = 0;
            //             //console.log(data.toString());
            //             //var htmldata = JSON.parse(data.toString());
            //             //if (htmldata && htmldata.status == "0"){


            //             createUser(username, password, fullname, agc, reqIp, function (result, res) {
            //                 if (result) {
            //                     sendStr = `{"status":0,"msg":"注册成功!","userid":${res[0].rcode}}`;
            //                     callback(1, sendStr, res);
            //                 } else {
            //                     sendStr = res;
            //                     callback(1, sendStr);
            //                 }
            //             });
            //             //}else{
            //             //	sendStr = '{"status":'+ htmldata.status +',"msg":"'+htmldata.msg+'"}'
            //             //	callback(1,sendStr);
            //             //}

            //         } catch (e) {
            //             console.log('post BoSenWebServer error..');
            //             sendStr = '{"status":4,"msg":"注册api!解析失败"}';
            //             callback(1, sendStr);
            //         }
            //     });
            // });

            // req.write(postdata);
            // req.end();
        } else {
            sendStr = '{"status":2,"msg":"参数不全!"}';
            callback(1, sendStr);
        }

    } else if (req.query.act == "deposit") {

        var ip = get_client_ip(req);
        //类型
        var username = req.query.accountname;		//账号

        var content = req.query.act + req.query.accountname + req.query.time + key;

        if (md53(content) != req.query.sign) {
            sendStr = '{"status":1,"msg":"参数不正确!"}'
            callback(1, sendStr);
            return;
        }

        //先通过帐号查询ID
        dao.getUserId(req.query.accountname, function (result, userid, userscore, p) {
            if (result) {
                gotoDeposit(username, p, ip, callback)

            } else {
                console.log("未找到" + req.query.accountname + "帐号");
                sendStr = '{"status":1,"msg":"未找到' + req.query.accountname + '帐号"}'
                callback(1, sendStr);
            }
            //
        })
    } else if (req.query.act == "ylcwithdraw") {

        var ip = get_client_ip(req);
        //类型
        var username = req.query.accountname;		//账号
        var fullname = req.query.fullname;			//昵称
        var baCode = req.query.baCode;			//银行列表
        var baNo = req.query.baNo;					//卡号
        var amount = req.query.amount;				//提现金额

        var content = req.query.act + req.query.accountname + req.query.fullname + req.query.baCode + req.query.baNo + req.query.amount + req.query.time + key;

        if (md53(content) != req.query.sign) {
            sendStr = '{"status":1,"msg":"参数不正确!"}'
            callback(1, sendStr);
            return;
        }

        //先通过帐号查询ID
        dao.getUserId(req.query.accountname, function (result, userid, userscore, p) {
            if (result) {
                gotoWithdrawal(username, p, ip, callback)

            } else {
                console.log("未找到" + req.query.accountname + "帐号");
                sendStr = '{"status":1,"msg":"未找到' + req.query.accountname + '帐号"}'
                callback(1, sendStr);
            }
            //
        })
    } else if (req.query.act == "check_login") {
        //检查账号密码是否正确
        var user = {
            userName: req.query.accountname,
            password: req.query.pwd
        };

        //先通过帐号查询ID
        dao.getUserId(user.userName, function (result, userid, userscore, p) {
            if (result) {

                if (user.password == p) {
                    sendStr = '{"status":0,"msg":"查询成功!"}';
                    callback(1, sendStr);
                } else {
                    sendStr = '{"status":1,"msg":"查询失败!"}'
                    callback(1, sendStr);
                }


            } else {
                sendStr = '{"status":1,"msg":"查询失败!"}'
                callback(1, sendStr);

            }
            //
        })

    }
}

ml_api.withdrawal = function (info, callback) {
    var url = "pfapi.ylc888.club";
    var actionname = "ylcwithdraw";
    console.log(info.ip)
    var signConten = info.ip + actionname;
    var st = md53(signConten);
    info.username = "kkk111";
    var postdata = "st=" + st + "&username=" + info.username + "&fullname=" + info.fullname + "&baCode=" + info.baCode + "&amount=" + info.amount + "&baNo=" + info.baNo;

    var content = info.act + info.accountname + req.query.time + key;

    if (md53(content) != req.query.sign) {
        sendStr = '{"status":1,"msg":"参数不正确!"}'
        callback(1, sendStr);
        return;
    }

    var username = req.query.accountname;		//账号
    var fullname = req.query.fullname;			//昵称
    var baCode = req.query.baCode;			//银行列表
    var baNo = req.query.baCode;				//卡号
    var amount = 500;							//提现金额

    var appstore_optios = {
        hostname: url,
        port: 80,
        path: '/rest/ylcwithdraw.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postdata, 'utf8')
        }
    };


    //console.log(postdata)
    var req = http.request(appstore_optios, function (res) {
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
                //var htmldata = JSON.parse(data.toString());
                //var token = encodeURIComponent(htmldata.token)
                //var url_token = "http://www.ylc888.club/services/sso.php?token=" + token + "&p=mywithdrawal";
                //console.log(htmldata)
                callback(1)
            } catch (e) {
                console.log(e);
                sendStr = '{"status":4,"msg":"登录api!解析失败"}';
                console.log('post PostMlWebServer error..');
                callback(0);
            }
        });
    });
    //console.log(postdata)
    req.write(postdata);
    req.end();
};

ml_api.cdKey = function (_info, callback) {
    var post_data = {
        code: _info.code,
        id: _info.userId,

    };//这是需要提交的数据

    var content = querystring.stringify(post_data);

    var options = {
        hostname: '8.210.159.134',
        port: 9999,  //注意端口号 可以忽略不写 写一定写对
        path: '/index.php/api/user/cdKey',
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
                let info = JSON.parse(data.toString());
                callback(info);
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

module.exports = ml_api;

