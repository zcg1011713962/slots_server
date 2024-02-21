var mysql = require('mysql');
var async = require('async');
var gameConfig = require('./../config/gameConfig');
var log = require("../../CClass/class/loginfo").getInstand;
var mysql_config = require("../../util/config/mysql_config");

var pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'gameaccount',
    charset: "utf8mb4",
});


exports.login = function login(user, socket, callback) {
    if (user.userName && user.sign) {
        // 用户密码登录
        pwdLogin(user, socket, callback);
    }else if(user.uid){
        // google登录或注册
        googleLogin(user, socket, callback);
    }else if(user.email){
        // 邮箱登录
        emailLogin(user, socket, callback);
    }
}

function googleLogin(user, socket, callback){
    // google登录
    const sql = 'CALL LoginByGoogle(?,?,?)';
    let values = [];
    values.push(user.uid);
    values.push(user.displayName);
    values.push(user.email);

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('uid login', err);
                callback(0);
            } else {
                if (rows[0].length === 0) {
                    callback(0);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(2);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(0, rows[0][0]);
                    }
                }
            }
            values = [];
        })
    });
}
function pwdLogin(user, socket, callback){
    const sql = 'CALL passwordLogin(?,?)';
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: [user.userName, user.sign]}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('pwd login', err);
                callback(0);
            } else {
                if (rows[0].length === 0) {
                    callback(1);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(2);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(0, rows[0][0]);
                    }
                }
            }
        })
    });
}

// 邮箱登录
function emailLogin(user, socket, callback){
    // email登录
    const sql = 'CALL LoginByEmail(?)';

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: user.email}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('email login', err);
                callback(0);
            } else {
                if (rows[0].length === 0) {
                    callback(0);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(2);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(0, rows[0][0]);
                    }
                }
            }
        })
    });
}

// 邮箱注册
exports.registerByEmail = function registerByEmail(socket, email){
    // email登录
    const sql = 'CALL RegisterByEmail(?)';

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: email}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('register Email' + err);
                socket.emit('registerResult', {Result: 0, msg: "注册失败"});
            } else {
                socket.emit('registerResult', {Result: 1, msg: "注册成功"});
            }
        })
    });
}

//用户注册
exports.CreateUser = function CreateUser(userInfo, callback) {
    //var sql = 'INSERT INTO useraccounts(Account,Password,nickname,score,p,phoneNo,email,sex,city,province,headimgurl) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
    var sql = 'call createUser(?,?,?,?,?,?,?,?,?,?,?,?,?)';
    var values = [];

    values.push(userInfo.accountname);
    values.push(userInfo.pwd);
    values.push(userInfo.nickname);
    values.push(userInfo.goldnum);
    values.push(userInfo.p);
    if (!userInfo.phoneNo) {
        userInfo.phoneNo = "";
    }
    values.push(userInfo.phoneNo);
    if (!userInfo.email) {
        userInfo.email = "";
    }
    values.push(userInfo.email);
    if (!userInfo.sex) {
        userInfo.sex = -1;
    }
    values.push(userInfo.sex);

    if (!userInfo.city) {
        userInfo.city = "";
    }
    values.push(userInfo.city);
    if (!userInfo.province) {
        userInfo.province = "";
    }
    values.push(userInfo.province);
    if (!userInfo.country) {
        userInfo.country = "";
    }
    values.push(userInfo.country);
    if (!userInfo.headimgurl) {
        userInfo.headimgurl = "";
    }
    values.push(userInfo.headimgurl);
    if (!userInfo.language) {
        userInfo.language = "";
    }
    values.push(userInfo.language);

    //console.log(userInfo.pwd)
    //console.log(user.password)

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("CreateUser");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        })

        values = [];

    });
}


//用户注册
exports.weixinCreateUser = function CreateUser(userInfo, callback) {

    //var sql = 'INSERT INTO useraccounts(Account,Password,nickname,score,p,phoneNo,email,sex,city,province,headimgurl) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
    var sql = 'call weixinCreateUser(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    var values = [];

    values.push(userInfo.accountname);
    values.push(userInfo.pwd);
    values.push(userInfo.nickname);
    values.push(userInfo.goldnum);
    values.push(userInfo.p);
    if (!userInfo.phoneNo) {
        userInfo.phoneNo = "";
    }
    values.push(userInfo.phoneNo);
    if (!userInfo.email) {
        userInfo.email = "";
    }
    values.push(userInfo.email);
    if (!userInfo.sex) {
        userInfo.sex = -1;
    }
    values.push(userInfo.sex);

    if (!userInfo.city) {
        userInfo.city = "";
    }
    values.push(userInfo.city);
    if (!userInfo.province) {
        userInfo.province = "";
    }
    values.push(userInfo.province);
    if (!userInfo.country) {
        userInfo.country = "";
    }
    values.push(userInfo.country);
    if (!userInfo.headimgurl) {
        userInfo.headimgurl = "";
    }
    values.push(userInfo.headimgurl);
    if (!userInfo.language) {
        userInfo.language = "";
    }
    values.push(userInfo.language);
    if (!userInfo.ChannelType) {
        userInfo.ChannelType = "";
    }
    if (!userInfo.bindUserId) {
        userInfo.bindUserId = "";
    }
    if (!userInfo.did) {
        userInfo.did = "";
    }
    if (!userInfo.ip) {
        userInfo.ip = "";
    }

    values.push(userInfo.loginCode);
    values.push(userInfo.ChannelType);
    values.push(userInfo.bindUserId);
    values.push(userInfo.did);
    values.push(userInfo.ip);

    console.log("注册:" + userInfo.pwd)
    console.log("注册:" + values)

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();

            if (err) {
                console.log("weixinCreateUser");
                console.log(err);
                callback(0);
            } else {
                console.log("weixinCreateUser" + rows);
                if (rows[0] && rows[0][0]) {
                    callback(1, rows[0][0].rcode, rows[0]);
                } else {
                    callback(1);
                }

            }
        });
        values = [];
    });
};


//修改密码
exports.SetPassword = function SetPassword(userInfo, callback) {
    var sql = 'UPDATE newuseraccounts SET Password=?,p=? WHERE Account=?';
    var values = [];
    values.push(userInfo.pwd);
    values.push(userInfo.p);
    values.push(userInfo.accountname);
    //console.log(userInfo.accountname)
    //console.log(userInfo.pwd)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("SetPassword");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//修改密码
exports.SetAccountState = function SetAccountState(userInfo, callback) {
    var sql = 'UPDATE newuseraccounts SET account_using=? WHERE Account=?';
    var values = [];
    values.push(userInfo.state);
    values.push(userInfo.accountname);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("SetAccountState");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//更新手机号码
exports.SetPhoneNo = function SetPhoneNo(userInfo, callback) {
    //var sql = 'UPDATE newuseraccounts SET phoneNo=?,Password=?,p=? WHERE Id=?';
    var sql = 'UPDATE newuseraccounts SET phoneNo=? WHERE Id=?';
    var values = [];
    values.push(userInfo.phoneNo);
    //values.push(userInfo.password);
    //values.push(userInfo.pass);
    values.push(userInfo.Id);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("SetPhoneNo");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//更新手机号码
exports.SetPhoneNo_new = function SetPhoneNo_new(userInfo, callback) {
    var sql = 'UPDATE newuseraccounts SET phoneNo=? WHERE Id=?';
    var values = [];
    values.push(userInfo.phoneNo);
    //values.push(userInfo.password);
    //values.push(userInfo.pass);
    values.push(userInfo.Id);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("SetPhoneNo");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//检查电话号码
exports.phoneCheck = function phoneCheck(userInfo, callback) {
    var sql = 'call checkPhone(?,?)';
    var values = [];
    values.push(userInfo.userId);
    values.push(userInfo.phone);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("phoneCheck");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }

            }
        });


        values = [];

    });
};


//储存指定用户
exports.saveUser = function saveUser(userList, callback) {
    var sql = 'UPDATE userinfo_imp SET score = CASE userId ';
    var string = '';
    var string3 = 'diamond = CASE userId ';
    var string2 = ' WHERE userId IN (';
    var objnull = true;

    for (var i = 0; i < userList.length; ++i) {
        objnull = false;
        string += 'WHEN ' + userList[i]._userId + ' THEN ' + userList[i]._score + ' ';
        string3 += 'WHEN ' + userList[i]._userId + ' THEN ' + userList[i]._diamond + ' ';
        string2 += userList[i]._userId;
        string2 += ','
    }

    if (objnull) {
        callback(0);
        return;
    }
    sql += string + "END,";
    sql += string3 + "END";

    string2 = string2.substring(0, string2.length - 1);
    string2 += ')';
    sql += string2;

    var values = [];
    //values.push(userInfo.pwd);
    //values.push(userInfo.accountname);
    //console.log(userInfo.accountname)
    //console.log(userInfo.pwd)
    // log.info(sql);
    //log.info(values);
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveUser" + err);
                callback([]);
            } else {
                callback(userList);
            }
        });
        values = [];
    });

};

//储存所有用户
exports.saveAll = function saveAll(userList, callback) {
    var sql = 'UPDATE userinfo_imp SET score = CASE userId ';
    var string = '';
    var string2 = 'END WHERE userId IN (';
    var string3 = 'freeCount = CASE Id ';
    var string4 = 'LoginCount = CASE Id ';
    var string5 = 'LotteryCount = CASE Id ';
    var objnull = true;
    for (var user in userList) {
        objnull = false;
        string += 'WHEN ' + userList[user]._userId + ' THEN ' + userList[user]._score + ' ';
        // string3 += 'WHEN '+ userList[user]._userId +' THEN '+ userList[user].freeCount + ' ';
        // string4 += 'WHEN '+ userList[user]._userId +' THEN '+ userList[user].LoginCount + ' ';
        // string5 += 'WHEN '+ userList[user]._userId +' THEN '+ userList[user].LotteryCount + ' ';
        string2 += userList[user]._userId;
        string2 += ','
    }

    if (objnull) {
        callback(0);
        return;
    }
    sql += string;
    // sql += string + "END,";
    // sql += string3 + "END,";
    // sql += string4 + "END,";
    // sql += string5;
    console.log("leng:" + string2.length)
    string2 = string2.substring(0, string2.length - 1);
    //console.log(string2)
    string2 += ')';

    sql += string2;

    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveAll");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });

};


//查询用户id
exports.getUserId = function getUserId(accountname, callback) {
    var sql = 'SELECT userinfo_imp.*,newuseraccounts.p FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` WHERE Account=?';
    var values = [];

    values.push(accountname);
    //console.log(user.userName)
    //console.log(user.password)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserId");
                console.log(err);
                callback(0);
            } else {
                console.log(rows);
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].userId, rows[0].score, rows[0].p, rows[0].diamond);
                }
            }
        });

        values = [];

    });
};

//查询用户id
exports.webGetUser = function webGetUser(accountname, callback) {
    var sql = 'SELECT newuseraccounts.nickname,userinfo_imp.* FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` WHERE Account=?';
    var values = [];

    values.push(accountname);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserId");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0]);
                }
            }
        });

        values = [];

    });
};

//查询注册ip是否存在
exports.getUserIdByIp = function getUserIdByIp(ip, callback) {
    var sql = 'SELECT Id FROM newuseraccounts WHERE loginip=?';
    var values = [];

    values.push(ip);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserIdByIp");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }

            }
        });
        values = [];
    });
};

//查询用户剩余金币
exports.getUserCoinById = function getUserCoinById(userid, callback) {
    var sql = 'SELECT score FROM userinfo_imp WHERE userId=?';
    var values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserCoinById");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].score);
                }

            }
        });
        values = [];
    });
};

//查询银行密码
exports.getBankPwdById = function getBankPwdById(userid, callback) {
    let sql = 'SELECT bankPwd FROM newuseraccounts WHERE Id=?';
    let values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserCoinById");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].bankPwd);
                }
            }
        });
        values = [];
    });
};

//更新银行密码
exports.updateBankPwdById = function updateBankPwdById(pwd, userid, callback) {
    let sql = 'update newuseraccounts set bankPwd=? where Id=?';
    let values = [];

    values.push(pwd);
    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateBankPwdById");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });
        values = [];
    });
};

//更新银行分数
exports.updateBankScoreById = function updateBankScoreById(score, userid, callback) {
    let sql = 'update newuseraccounts set bankScore=? where Id=?';
    let values = [];

    values.push(score);
    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateBankScoreById");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });
        values = [];
    });
};

exports.checkNickName = function checkNickName(userId, callback) {
    var sql = 'select nickname from newuseraccounts where Id=?';
    var values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserNickName");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].nickname);
                }
            }
        });

        values = [];

    });
};

exports.checkNickName2 = function checkNickName2(userName, callback) {
    var sql = 'select nickname from newuseraccounts where Account=?';
    var values = [];

    values.push(userName);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUserNickName");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].nickname);
                }
            }
        });

        values = [];

    });
};

//修改昵称

exports.updateNickName = function updateNickName(userId, nickname, callback) {
    var sql = 'update newuseraccounts set nickname=? where Id=?';
    var values = [];

    values.push(nickname);
    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateNickName");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];

    });
};

exports.checkVip = function checkVip(userId, callback) {
    var sql = 'select is_vip from newuseraccounts where Id=?';
    var values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("checkVip");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0].is_vip);
                }
            }
        });

        values = [];

    });
};

//查询累计充值
exports.checkTotalCharge = function checkTotalCharge(userId, callback) {
    var sql = 'select totalRecharge,housecard from newuseraccounts where Id=?';
    var values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("checkTotalCharge");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0]);
                }
            }
        });

        values = [];

    });
};

//修改累计充值
exports.updateTotalCharge = function updateTotalCharge(userId, num, callback) {
    var sql = 'update newuseraccounts set totalRecharge=? where Id=?';
    var values = [];

    values.push(num);
    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateTotalCharge");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];

    });
};

//修改vip等级
exports.updateVipLevel = function updateVipLevel(userId, num, callback) {
    var sql = 'update newuseraccounts set housecard=? where Id=?';
    var values = [];

    values.push(num);
    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateTotalCharge");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];

    });
};

//修改头像
exports.updateHeadUrl = function updateNickName(userId, url, callback) {
    var sql = 'update newuseraccounts set headimgurl=? where Id=?';
    var values = [];

    values.push(url);
    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateHeadUrl");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];

    });
};


//绑定支付宝
exports.bindZhifubao = function bindZhifubao(userId, zhifubao, name, callback) {
    var sql = 'update userinfo set zhifubao=?,zhifubaoName=? where userId=?';
    //	var sql = 'call bindZhifubao(?,?,?)'  //无过程先取消
    var values = [];

    values.push(zhifubao);
    values.push(name);
    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            callback(0);
        });

        values = [];

    });
};


//添加银行卡
exports.addBank = function addBank(userId, account, name, bankType, callback) {
    var sql = 'call addBankCard(?,?,?,?)';
    var values = [];

    values.push(userId);
    values.push(account);
    values.push(name);
    values.push(bankType);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("addBank");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};

//修改银行卡
exports.editBank = function editBank(userId, account, name, bankType, cardId, callback) {

    var sql = 'UPDATE bankbindlist SET account=?,name=?,bankType=? WHERE userId=? AND cardId=?'
    var values = [];


    values.push(account);
    values.push(name);
    values.push(bankType);
    values.push(userId);
    values.push(cardId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("editBank");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];
    });
};

//删除银行卡
exports.delBank = function delBank(userId, cardId, callback) {

    var sql = 'DELETE FROM bankbindlist WHERE userId=? AND cardId=?'
    var values = [];

    values.push(userId);
    values.push(cardId);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("delBank");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];
    });
};

//获得用户银行卡
exports.getBank = function getBank(_userId, callback) {
    var sql = 'select * from bankbindlist where userId=? ORDER BY bankType';
    var values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getPropByUserId");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows);
                }
            }
        });

        values = [];

    });
};

//获得用户道具
exports.getPropByUserId = function getPropByUserId(_userId, callback) {
    var sql = 'select * from prop_item where userid=?';
    var values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getPropByUserId");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows);
                }
            }
        });

        values = [];

    });
};


//获得鱼币消耗
exports.getUseCoin = function getUseCoin(_userId, callback) {
    var sql = 'select * from fish.usecoin where userId=?';
    var values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getUseCoin");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0]);
                }
            }
        });


        values = [];

    });
};

//获得鱼币消耗
exports.getWinCoin = function getWinCoin(_userId, callback) {
    var sql = 'select * from fish.wincoin where userId=?';
    var values = [];
    values.push(_userId);
    callback(0);
    // pool.getConnection(function (err, connection) {
    //
    //     connection.query({sql: sql, values: values}, function (err, rows) {
    //         connection.release();
    //         if (err) {
    //             console.log("getWinCoin");
    //             console.log(err);
    //             callback(0);
    //         } else {
    //             if (rows.length == 0) {
    //                 callback(0);
    //             } else {
    //                 callback(1, rows[0]);
    //             }
    //         }
    //     })
    //
    //     values = [];
    //
    // });
};


//保存用户变化量
exports.saveUserLog = function saveUserLog(userInfo, callback) {
    var sql = 'UPDATE newuseraccounts SET score=score+? WHERE Id=?';
    var values = [];
    values.push(userInfo.addgold);
    values.push(userInfo.userid);

    //console.log(userInfo.userid)
    //console.log(userInfo.addgold)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveUserLog");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//不在线修改金钱
exports.AddGold = function AddGold(userInfo, callback) {
    var sql = 'call AddGold(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.addgold);
    values.push(userInfo.change_type);

    //console.log(userInfo.userid)
    //console.log(userInfo.addgold)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("AddGold");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });

        values = [];

    });
};
//不在线修改钻石
exports.AddDiamond = function AddDiamond(userInfo, callback) {
    var sql = 'call AddDiamond(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.adddiamond);
    values.push(userInfo.change_type);

    //console.log(userInfo.userid)
    //console.log(userInfo.addgold)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("AddDiamond");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });


        values = [];

    });
};

//不在线修改礼品券
exports.EditTicket = function EditTicket(userInfo, callback) {
    var sql = 'call EditTicket(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.count);
    values.push(userInfo.change_type);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("EditTicket");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });

        values = [];

    });
};

//不在线修改金钱(减)
exports.AddGoldSub = function AddGoldSub(userInfo, callback) {
    var sql = 'call AddGoldSub(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.addgold);
    values.push(userInfo.change_type);


    //console.log(userInfo.userid)
    //console.log(userInfo.addgold)

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("AddGoldSub");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });


        values = [];

    });

};


//不在线修改钻石(减)
exports.AddDiamondSub = function AddGoldSub(userInfo, callback) {
    var sql = 'call AddDiamondSub(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.diamond);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("AddDiamondSub");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0].rcode);
                } else {
                    callback(0);
                }
            }
        });


        values = [];

    });

};


//上下分记录
exports.score_changeLog = function score_changeLog(userInfo) {
    var sql = "INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    var values = [];
    pool.getConnection(function (err, connection) {

        for (var i = 0; i < userInfo.length; i++) {
            if (userInfo[i].userid < 500 || userInfo[i].userid > 1800) {
                values.push(userInfo[i].userid);
                values.push(userInfo[i].score_before);
                values.push(userInfo[i].score_change);
                values.push(userInfo[i].score_current);
                values.push(userInfo[i].change_type);
                values.push(userInfo[i].isOnline);

                // console.log(values)

                connection.query({sql: sql, values: values}, function (err, rows) {

                    if (err) {
                        console.log("score_changeLog");
                        console.log(err);
                    }
                });

                values = [];
            }
        }
        connection.release();

    });
};

//上下分记录
exports.diamond_changeLog = function score_changeLog(userInfo) {
    var sql = "INSERT INTO diamond_changelog(userid,diamond_before,diamond_change,diamond_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    var values = [];
    pool.getConnection(function (err, connection) {

        for (var i = 0; i < userInfo.length; i++) {
            if (userInfo[i].userid < 500 || userInfo[i].userid > 1800) {
                values.push(userInfo[i].userid);
                values.push(userInfo[i].diamond_before);
                values.push(userInfo[i].diamond_change);
                values.push(userInfo[i].diamond_current);
                values.push(userInfo[i].change_type);
                values.push(userInfo[i].isOnline);

                connection.query({sql: sql, values: values}, function (err, rows) {

                    if (err) {
                        console.log("diamond_changeLog");
                        console.log(err);
                    }
                });

                values = [];
            }
        }
        connection.release();

    });
};


//上下分记录
exports.insert_mark = function insert_mark(userInfo) {
    var sql = "INSERT INTO mark(userId,useCoin,winCoin,tax,gameId,serverId) VALUES(?,?,?,?,?,?)";
    var values = [];
    pool.getConnection(function (err, connection) {

        for (var i = 0; i < userInfo.length; i++) {
            if (userInfo[i].userId > 15000) {
                values.push(userInfo[i].userId);
                values.push(userInfo[i].useCoin);
                values.push(userInfo[i].winCoin);
                values.push(userInfo[i].tax);
                values.push(userInfo[i].gameId);
                values.push(userInfo[i].serverId);

                connection.query({sql: sql, values: values}, function (err, rows) {

                    if (err) {
                        console.log("insert_mark");
                        console.log(err);
                    }
                });

                values = [];
            }
        }
        connection.release();

    });
};

//摇奖记录
exports.getRecord = function getRecord(userInfo, callback_c) {

    var sql = "SELECT mark.*,newuseraccounts.Account FROM mark JOIN newuseraccounts ON mark.userId=newuseraccounts.Id WHERE balanceTime >= ? and balanceTime <= ? LIMIT ?,?";

    if (!userInfo.lineCount) {
        sql = "SELECT mark.*,newuseraccounts.Account FROM mark JOIN newuseraccounts ON mark.userId=newuseraccounts.Id WHERE balanceTime >= ? and balanceTime <= ?";
    }

    var values = [];


    values.push(userInfo.beginTime);
    values.push(userInfo.endTime);
    values.push(parseInt(userInfo.linebegin));
    values.push(parseInt(userInfo.lineCount));

    console.log(values);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getRecord");
                console.log(err);
                callback_c(0);
            } else {
                if (rows.length) {
                    callback_c(1, rows);
                } else {
                    callback_c(2);
                }
            }
        });

        values = [];

    });
};


//摇奖记录
exports.getLotteryLog = function getLotteryLog(userInfo, callback_c) {


    var sql = "CALL selectlotterylog(?,?)";
    pool.getConnection(function (err, connection) {

        var values = [];

        values.push(userInfo.gameid);
        values.push(userInfo.lineCount);
        //console.log(connection);
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getLotteryLog");
                console.log(err);
            } else {
                if (rows.length) {
                    callback_c(1, rows[0]);
                } else {
                    callback_c(null, "未找到数据");
                }
            }
            //console.log("释放");
            //connection.release();
        });

        values = [];
    })
};

//标记
exports.mark = function mark(userInfo, callback_c) {
    //console.log(userInfo)
    //var sql = "CALL mark(?)";
    //
    var sql = "UPDATE mark SET mark = 1 WHERE id <= ?";
    pool.getConnection(function (err, connection) {

        var values = [];

        values.push(userInfo.pkid);

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("mark");
                console.log(err);
            } else {
                //callback_c(rows[0][0].rcode);
                callback_c(0);
            }
        });


        values = [];


    })
};


//更新用户道具
exports.updateProp = function updateProp(_userInfo, callback) {
    var sql = 'CALL updateProp(?,?,?,?,?)';
    var values = [];

    values.push(_userInfo.userId);
    values.push(_userInfo.propId);
    values.push(_userInfo.propCount);
    values.push(_userInfo.roomid);
    values.push(_userInfo.typeid);
    console.log(values);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateProp");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });

        values = [];
    });
};


//获取未领奖列表
exports.getSendPrize = function getSendPrize(_userId, callback) {
    var sql = 'call getSendPrize(?)';
    var values = [];

    values.push(_userId);
    callback(0);
    // pool.getConnection(function (err, connection) {
    //
    //     connection.query({sql: sql, values: values}, function (err, rows) {
    //         connection.release();
    //         if (err) {
    //             console.log("getSendPrize");
    //             console.log(err);
    //             callback(0);
    //         } else {
    //             if (rows[0].length == 0) {
    //                 callback(0);
    //             } else {
    //                 callback(1, rows[0]);
    //             }
    //         }
    //     })
    //
    //     values = [];
    //
    // });
};

//领取奖品
exports.getPrize = function getPrize(_userId, callback) {
    var sql = 'call getPrize(?)';
    var values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getPrize");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });


        values = [];

    });
};

//领取奖品
exports.sendEmail = function sendEmail(info, callback) {
    var sql = 'call sendEmail(?,?,?,?,?,?,?)';

    var values = [];
    values.push(info.userId);
    values.push(info.winPropId);
    values.push(info.winPropCount);
    values.push(info.winScore);
    values.push(info.type);
    values.push(info.sendCoinUserId);
    values.push(info.nickName);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("sendEmail");
                console.log(err);
                callback(0);
            } else {
                callback(1, rows[0][0].id);
            }
        })


        values = [];

    });
}


//领取每日奖品
exports.getDayPrize = function getDayPrize(_userId, callback) {
    var sql = 'UPDATE fish.getcoin SET mark=1 WHERE id=?';
    var values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getDayPrize");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        })


        values = [];

    });
}

//添加未领取列表
exports.addPrize = function addPrize(_info, callback) {
    var sql = 'call addPrize(?,?)';
    var values = [];

    values.push(_info.roomType);
    values.push(_info.matchId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("addPrize");
                console.log(err);
                callback(0);
            } else {
                if (rows[0].length == 0) {
                    callback(0);
                } else {
                    callback(1, rows[0]);
                }
            }
        })

        values = [];

    });
}

//获取未领奖列表
exports.getdaySendPrize = function getdaySendPrize(_userId, callback) {
    var sql = "call fish.getdayprize(?)";
    var values = [];

    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(connection){
            connection.query({sql: sql, values: values}, function (err, rows) {
                connection.release();
                if (err) {
                    console.log("getdaySendPrize");
                    console.log(err);
                    callback(0);
                } else {
                    if (rows[0].length == 0) {
                        callback(0);
                    } else {
                        callback(1, rows[0]);
                    }
                }
            })
        }else{
            callback(0);
        }
        values = [];
    });
}


//比赛数据
exports.matchRandKing = function matchRandKing(userInfo, callback) {
    var sql = "call fish.updateMatchRandKing(?,?,?,?,?)";
    var values = [];

    values.push(userInfo.matchId);
    values.push(userInfo.userId);
    values.push(userInfo.score);
    values.push(userInfo.lastTime);
    values.push(userInfo.roomType);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("matchRandKing");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        })


        values = [];

    });
}

//创建充值数据
exports.create_recharge = function create_recharge(userInfo, callback) {
    var sql = "call createRecharge(?,?,?,?)";
    var values = [];

    values.push(userInfo.Account);
    values.push(userInfo.total_fee);
    values.push(userInfo.out_trade_no);
    values.push(userInfo.goodsid);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("create_recharge");
                console.log(err);

                callback(0);
            } else {
                callback(rows[0][0].rcode);
            }
        })


        values = [];

    });
}

//创建充值数据SDK
exports.create_rechargeSDK = function create_rechargeSDK(userInfo, callback) {
    var sql = "call createRecharge(?,?,?,?,?)";
    var values = [];

    values.push(userInfo.userId);
    values.push(userInfo.Account);
    values.push(userInfo.total_fee);
    values.push(userInfo.out_trade_no);
    values.push(userInfo.goodsid);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("create_rechargeSDK");
                console.log(err);

                callback(0);
            } else {
                callback(rows[0][0].rcode);
            }
        })


        values = [];

    });
}

//更新充值数据
exports.updateRecharge = function updateRecharge(out_trade_no, callback) {
    var sql = "call updateRecharge(?)";
    var values = [];

    values.push(out_trade_no);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateRecharge");
                console.log(err);
                callback(0);
            } else {
                if (rows[0][0].rcode) {
                    callback(0);
                } else {
                    callback(1, rows[0][0]);
                }

            }
        })


        values = [];

    });
};

//更新充值数据
exports.checkRecharge = function checkRecharge(out_trade_no, callback) {
    var sql = "call checkRecharge(?)";
    var values = [];

    values.push(out_trade_no);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("checkRecharge");
                console.log(err);
                callback(0);
            } else {
                if (rows[0][0].rcode) {
                    callback(0);
                } else {
                    callback(1);
                }

            }
        });
        values = [];

    });
};


exports.getfirstexchange = function getfirstexchange(_userId, callback) {
    var sql = "select * from userinfo where userId = ?";
    var values = [];

    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(connection){
            connection.query({sql: sql, values: values}, function (err, rows) {
                connection.release();
                if (err) {
                    console.log("getfirstexchange");
                    console.log(err);
                    callback(0);
                } else {
                    if (rows[0]) {
                        if (rows[0].length == 0) {
                            callback(0);
                        } else {
                            callback(1, rows[0]);
                        }
                    }
                }

            });
        }else {
            callback(0);
        }
        values = [];
    });
};

exports.updateFirstexchange = function updateFirstexchange(_userId) {
    var sql = "update userinfo set firstexchange = 1 where userId = ?";
    var values = [];

    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateFirstexchange");
                console.log(err);
            }

        })

        values = [];

    });
};
//保存金币记录
exports.sendcoinlog = function sendcoinlog(info, callback) {
    var sql = "INSERT INTO sendcoinlog(userid,getcoinuserid,sendcoin,nickname,commission,state) VALUES(?,?,?,?,?,?)";
    var values = [];

    values.push(info.userid);
    values.push(info.getcoinuserid);
    values.push(info.sendcoin);
    values.push(info.nickname);
    values.push(info.commission);
    values.push(info.state);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("sendcoinlog");
                console.log(err);
            } else {
                callback(1, rows.insertId);
            }

        });

        values = [];

    });
};
//查询金币记录
exports.selectcoinlog = function selectcoinlog(userid, callback) {
    let sql = "select * from sendcoinlog where userId = ?";
    let values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectcoinlog");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0, null);
                } else {
                    callback(1, rows);
                }
            }

        });

        values = [];

    });
};
//查询收到金币记录
exports.selectgetcoinlog = function selectgetcoinlog(userid, callback) {
    let sql = "select * from sendcoinlog where getcoinuserid = ?";
    let values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectcoinlog");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0, null);
                } else {
                    callback(1, rows);
                }
            }

        });

        values = [];

    });
};
//修改金币记录状态
exports.updateCoinLogState = function updateCoinLogState(state, id, callback) {
    var sql = "update sendcoinlog set state = ? where id = ?";
    var values = [];

    values.push(state);
    values.push(id);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateFirstexchange");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }

        });

        values = [];

    });
};
//保存邮件记录
exports.saveEmail = function saveEmail(info) {
    var sql = "INSERT INTO email(isread,title,type,otherId,userid,sendid) VALUES(?,?,?,?,?,?)";
    var values = [];

    values.push(info.isread);
    values.push(info.title);
    values.push(info.type);
    values.push(info.otherId);
    values.push(info.userid);
    values.push(info.sendid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveEmail");
                console.log(err);
            }
        });

        values = [];

    });
};
//查询邮件记录
exports.selectEmail = function selectEmail(userid, callback) {
    var sql = "select email.*,sendcoinlog.nickname,sendcoinlog.getcoinuserid,sendcoinlog.sendcoin,sendcoinlog.state from email left join sendcoinlog on email.otherId = sendcoinlog.id where email.userid = ?";
    var values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectEmail");
                console.log(err);
            } else {
                if (rows[0]) {
                    callback(1, rows);
                } else {
                    callback(0);
                }
            }
        });

        values = [];

    });
};
//设置邮件为已读
exports.setEmailisRead = function setEmailisRead(id, callback) {
    var sql = "update email set isread = 1 where id = ?";
    var values = [];

    values.push(id);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("setEmailisRead");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }

        });

        values = [];

    });
};
//查询系统邮件记录
exports.selectSystemEmail = function selectSystemEmail(callback) {
    var sql = "select * from email  where type = 999";
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectEmail");
                console.log(err);
            } else {
                if (rows[0]) {
                    callback(1, rows);
                } else {
                    callback(0);
                }
            }
        });

        values = [];

    });
};
//保存转卡记录
exports.saveCardRecord = function saveCardRecord(info) {
    var sql = "INSERT INTO sendcardlog(userid,targetId,coin,cardNum) VALUES(?,?,?,?)";
    var values = [];

    values.push(info.userid);
    values.push(info.targetId);
    values.push(info.coin);
    values.push(info.cardNum);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveCardRecord");
                console.log(err);
            }
        });

        values = [];

    });
};
//查询兑换卡记录
exports.getCardRecord = function getCardRecord(userid, callback) {
    let sql = "select * from sendcardlog where targetId = ?";
    let values = [];

    values.push(userid);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectcoinlog");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0, null);
                } else {
                    callback(1, rows);
                }
            }

        });

        values = [];

    });
};

exports.sendcoinServer = function sendcoinServer(userid, sendCoin, callback) {
    var sql = 'call sendcoinServer(?,?)';
    var values = [];

    values.push(userid);
    values.push(sendCoin);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("sendcoinServer");
                console.log(err);
                callback(0);
            } else {
                //console.log(rows[0][0].recod)
                callback(rows[0][0].recod);
            }
        });

        values = [];

    });
};


exports.saveLineOut = function saveLineOut(userid) {
    var sql = 'INSERT INTO lineout(userId) VALUES(?)';
    var values = [];

    values.push(userid);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("saveLineOut");
                console.log(err);
            }
        })

        values = [];

    });
}

exports.deleteLineOut = function saveLineOut(userid) {
    var sql = 'DELETE FROM lineout WHERE userId = ?';
    var values = [];

    values.push(userid);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("deleteLineOut");
                console.log(err);
            }
        })

        values = [];

    });
}


exports.clenaLineOut = function clenaLineOut() {
    var sql = 'DELETE FROM lineout';
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("clenaLineOut");
                console.log(err);
            }
        })

        values = [];
    });
}

//在线游戏时，结算
exports.tempAddScore = function tempAddScore(userid, score, change_type) {
    var sql = 'call tempAddScore(?,?,?)';
    var values = [];

    values.push(userid);
    values.push(score);
    values.push(change_type);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("tempAddScore");
                console.log(err);
            }
        })

        values = [];
    });
}

//在线游戏时，结算
exports.tempAddDiamond = function tempAddScore(userid, score, change_type) {
    var sql = 'call tempAddDiamond(?,?,?)';
    var values = [];

    values.push(userid);
    values.push(score);
    values.push(change_type);


    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("tempAddScore");
                console.log(err);
            }
        })

        values = [];
    });
}

//登录时使用
exports.LoginaddTempScore = function LoginaddTempScore(userid, callback) {
    var sql = 'call LoginaddTempScore(?)';
    var values = [];

    values.push(userid);

    //console.log(values)
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("LoginaddTempScore");
                console.log(err);
            } else {

                if (rows[0].length) {
                    callback(1, rows[0]);
                } else {
                    callback(0);
                }
            }
        })

        values = [];
    });
}

//登录时使用
exports.LoginaddTempDiamond = function LoginaddTempScore(userid, callback) {
    var sql = 'call LoginaddTempDiamond(?)';
    var values = [];

    values.push(userid);

    //console.log(values)
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("LoginaddTempDiamond");
                console.log(err);
            } else {

                if (rows[0].length) {
                    callback(1, rows[0]);
                } else {
                    callback(0);
                }
            }
        })

        values = [];
    });
}

//获取分数
exports.getScore = function getScore(_userId, callback) {
    var sql = "select * from userinfo_imp where userId = ?";
    var values = [];

    values.push(_userId);
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getScore");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    if (rows[0].length == 0) {
                        callback(0);
                    } else {
                        callback(1, rows[0]);
                    }
                } else {
                    callback(0);
                }
            }

        })
        values = [];
    });
}

//增加分数
exports.addScore = function addScore(_userId, score) {
    const sql = "update userinfo_imp set score = score + ? where userId = ?";
    let values = [];
    values.push(score);
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err) {
            connection.release();
            if (err) {
                console.log("addScore");
                console.log(err);
            }
        })
        values = [];
    });
}


//创建首充
exports.firstrecharge = function firstrecharge(_userId, callback) {
    var sql = "call recharge_first(?)";
    var values = [];

    values.push(_userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("firstrecharge");
                console.log(err);
                callback(0);
            } else {
                if (rows[0].length) {
                    callback(1, rows[0][0]);
                } else {
                    callback(0);
                }
            }

        })

        values = [];

    });
}

//更新首充
exports.updateFirstrecharge = function updateFirstrecharge(_userId, _goodsid, callback) {
    var sql = "call update_recharge_first(?,?)";
    var values = [];

    values.push(_userId);
    values.push(_goodsid);
    console.log(_userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateFirstrecharge");
                console.log(err);
                callback(0);
            } else {
                if (rows[0].length) {
                    callback(1, rows[0][0]);
                } else {
                    callback(0);
                }
            }

        })

        values = [];

    });
}


//转正
exports.changeOfficial = function changeOfficial(_info, callback) {
    var sql = "call changeOfficial(?,?,?,?)";
    var values = [];

    values.push(_info.userId);
    values.push(_info.newAccount);
    values.push(_info.password);
    values.push(_info.p);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("changeOfficial");
                console.log(err);
                callback(0);
            } else {
                var result = {};
                if (rows[0][0].rcode == 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        })

        values = [];

    });
}


//添加聊天记录
exports.addcharLog = function addcharLog(_info, callback) {
    var sql = 'INSERT INTO chatLog(userId,toUserId,nickname,msg,isSendEnd,img) VALUES(?,?,?,?,?,?)';
    var values = [];

    values.push(_info.userId);
    values.push(_info.toUserId);
    values.push(_info.nickname);
    values.push(_info.msg);
    values.push(_info.isSendEnd);
    if (!_info.img) {
        _info.img = "";
    }
    values.push(_info.img);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("addcharLog");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        })
        values = [];
    });
}


//获得未收取聊天记录
exports.getcharLog = function getcharLog(userId, callback) {
    var sql = 'select id,userId,nickname,toUserId,msg,addDate from chatLog where toUserId=? and isSendEnd = 0';
    var values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getcharLog");
                console.log(err);
                callback(0);
            } else {
                callback(1, rows);
            }
        })
        values = [];
    });
}


//添加提现记录
exports.socreOut = function socreOut(_info, callback) {
    var sql = 'INSERT INTO scoreout(userId,score,cardType,cardId,out_trade_no,tax,coin) VALUES(?,?,?,?,?,?,?)';
    var values = [];

    values.push(_info.sendUserId);
    values.push(_info.sendCoin);
    values.push(_info.cardType);
    values.push(_info.cardId);
    values.push(_info.out_trade_no);
    values.push(_info.tax);
    values.push(_info.coin);

    if (_info.zfb_account && _info.zfb_name) {
        sql = 'INSERT INTO scoreout(userId,score,cardType,cardId,out_trade_no,tax,coin,zfb_account,zfb_name) VALUES(?,?,?,?,?,?,?,?,?)';
        values.push(_info.zfb_account);
        values.push(_info.zfb_name);
    }

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("scoreout");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        })
        values = [];
    });
}


//更新充值数据
exports.updateScoreOut = function updateScoreOut(out_trade_no, flag, remark, callback) {
    var sql = "call updateScoreOut(?,?,?)";
    var values = [];

    values.push(out_trade_no);
    values.push(flag);
    values.push(remark);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateScoreOut");
                console.log(err);
                callback(0);
            } else {
                if (rows[0][0].rcode) {
                    callback(1);
                } else {
                    callback(0, rows[0][0]);
                }

            }
        })
        values = [];
    });
}

//获取兑换数据
exports.getScoreOut = function getScoreOut(date, callback) {
    var sql = "SELECT * FROM scoreout WHERE state = 0 AND cardType = 0 AND addDate < '" + date + "' LIMIT 1";
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getScoreOut");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(1, rows[0]);
                } else {
                    callback(0);
                }

            }
        });
        values = [];
    });
};


//更新聊天记录
exports.updateCharLog = function updateCharLog(userId, idList, callback) {
    var string = "";

    for (var i = 0; i < idList.length; ++i) {
        if (i + 1 == idList.length) {
            string += idList[i];
        } else {
            string += idList[i] + ',';
        }
    }
    var sql = 'UPDATE chatlog SET isSendEnd = 1 WHERE toUserId= ? AND id in(' + string + ')';
    var values = [];
    //console.log(sql);
    values.push(userId);

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateCharLog");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });

        values = [];

    });
};

exports.selectServerLog = function selectServerLog(callback) {
    var sql = 'select * from server_log';
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("selectServerLog");
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(1, rows);
                }
            }
        });

        values = [];

    });
};

//查询金币排行榜
exports.getCoinRank = function getCoinRank(callback) {
    var sql = 'SELECT userinfo_imp.*,newuseraccounts.nickname,newuseraccounts.headimgurl,newuseraccounts.housecard FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` ORDER BY userinfo_imp.score desc limit 50';
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getCoinRank");
                console.log(err);
                callback(0);
            } else {
                // console.log(rows);
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(rows);
                }
            }
        });

        values = [];

    });
};

//查询钻石排行榜
exports.getDiamondRank = function getDiamondRank(callback) {
    var sql = 'SELECT userinfo_imp.*,newuseraccounts.nickname,newuseraccounts.headimgurl FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` ORDER BY userinfo_imp.diamond desc limit 50';
    var values = [];

    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getCoinRank");
                console.log(err);
                callback(0);
            } else {
                // console.log(rows);
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(rows);
                }
            }
        });

        values = [];

    });
};