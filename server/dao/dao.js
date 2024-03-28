const mysql = require('mysql2');
const log = require("../../CClass/class/loginfo").getInstand;
const mysql_config = require("../../util/config/mysql_config");
const ErrorCode = require('../../util/ErrorCode');
const RedisUtil = require('../../util/redis_util');
const StringUtil = require("../../util/string_util");

const pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'gameaccount',
    charset: "utf8mb4"
});


exports.login = function login(user, socket, callback) {
    if(user.token) {
        // 通过缓存的token登录
        const login_token_key  = 'login_token_key:';
        RedisUtil.get(login_token_key + user.token).then(userId =>{
            if(userId){
                user.id = userId;
                tokenLogin(user, socket, callback);
            }else {
                callback(ErrorCode.LOGIN_TOKEN_NOT_FOUND.code, ErrorCode.LOGIN_TOKEN_NOT_FOUND.msg);
            }
        });
    }else if(user.userName && user.sign) {
        // 用户密码登录
        pwdLogin(user, socket, callback);
    }else if(user.uid){
        // google登录
        googleLogin(user, socket, (code, msg, data) => {
            if(code === ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code){
                // 生成账户密码
                const time = StringUtil.generateTime();
                const account = StringUtil.generateAccount('ABC', time);
                const king = StringUtil.generateKing();
                const nickname = StringUtil.generateNickName(time);
                const pwd = StringUtil.pwdEncrypt(account, king);
                // 账户不存在 进行注册
                this.registerByGoogle(user, socket, account, pwd, nickname, king, (c, m, d) =>{
                    if(c === ErrorCode.LOGIN_SUCCESS.code){
                        // 设置邀请码
                        this.setInviteCode(d.Id);
                    }else{
                        callback(c, m, d);
                    }
                });
            }else{
                callback(code, msg, data);
            }
        });
    }else if(user.email && user.code){
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('googleLogin' + err);
                callback(ErrorCode.LOGIN_ERROR.code, ErrorCode.LOGIN_ERROR.msg);
            } else {
                if (rows[0].length === 0) {
                   callback(ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code, ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.msg);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(ErrorCode.LOGIN_ACCOUNT_NOT_USING.code, ErrorCode.LOGIN_ACCOUNT_NOT_USING.msg);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows[0][0]);
                    }
                }
            }
            values = [];
        })
    });
}
function pwdLogin(user, socket, callback){
    const sql = 'CALL LoginByPassword(?,?)';
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: [user.userName, user.sign]}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('账户密码登录', err);
                callback(ErrorCode.LOGIN_ERROR.code, ErrorCode.LOGIN_ERROR.msg);
            } else {
                if (rows[0].length === 0) {
                    callback(ErrorCode.LOGIN_PWD_INFO_ERROR.code, ErrorCode.LOGIN_PWD_INFO_ERROR.msg);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(ErrorCode.LOGIN_ACCOUNT_NOT_USING.code, ErrorCode.LOGIN_ACCOUNT_NOT_USING.msg);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows[0][0]);
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: user.email}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('email login', err);
                callback(ErrorCode.LOGIN_ERROR.code, ErrorCode.LOGIN_ERROR.msg);
            } else {
                if (rows[0].length === 0) {
                    callback(ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code, ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.msg);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(ErrorCode.LOGIN_ACCOUNT_NOT_USING.code, ErrorCode.LOGIN_ACCOUNT_NOT_USING.msg);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows[0][0]);
                    }
                }
            }
        })
    });
}

// token登录
function tokenLogin(user, socket, callback){
    // email登录
    const sql = 'CALL LoginByToken(?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: user.id}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('token login', err);
                callback(ErrorCode.LOGIN_ERROR.code, ErrorCode.LOGIN_ERROR.msg);
            } else {
                if (rows[0].length === 0) {
                    callback(ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.code, ErrorCode.LOGIN_ACCOUNT_NOT_FOUND.msg);
                } else {
                    if (rows[0][0].account_using === 0) {
                        callback(ErrorCode.LOGIN_ACCOUNT_NOT_USING.code, ErrorCode.LOGIN_ACCOUNT_NOT_USING.msg);
                    } else {
                        rows[0][0].socket = socket;
                        rows[0][0].gameId = user.gameId;
                        callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows[0][0]);
                    }
                }
            }
        })
    });
}

// 邮箱查询
exports.emailSearch = function emailSearch(email, callback){
    const sql = 'CALL LoginByEmail(?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: email}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('email login', err);
                callback(0);
            } else {
                if (rows[0].length === 0) {
                    callback(0);
                } else {
                    callback(1);
                }
            }
        })
    });
}

// 邮箱绑定
exports.emailBind = function emailBind(userId , email, callback){
    const sql = 'update newuseraccounts set email = ? where id = ?';
    let values = [];
    values.push(email)
    values.push(userId)

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('绑定邮箱', err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        })
    });
}

// 邮箱注册
exports.registerByEmail = function registerByEmail(socket, email, account, pwd, nickname, king,  callback){
    // email登录
    const sql = 'CALL RegisterByEmail(?,?,?,?,?)';
    let values = [];
    values.push(email)
    values.push(account)
    values.push(pwd)
    values.push(nickname)
    values.push(king)

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('register Email' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0][0]);
                }else{
                    callback(0);
                }
            }
        })
        values = [];
    });
}

// google注册
exports.registerByGoogle = function registerByGoogle(user, socket, account, pwd, nickname,king, callback){
    if(user.displayName &&  user.displayName.length < 50){
        nickname = user.displayName;
    }
    // google登录
    const sql = 'CALL RegisterByGoogle(?,?,?,?,?,?)';
    let values = [];
    values.push(user.uid);
    values.push(user.email);
    values.push(account);
    values.push(pwd);
    values.push(nickname);
    values.push(king);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('google注册' + err);
                callback(0);
            } else {
                if (rows[0].length === 0) {
                    callback(ErrorCode.LOGIN_ERROR.code, ErrorCode.LOGIN_ERROR.code);
                } else {
                    rows[0][0].socket = socket;
                    rows[0][0].gameId = user.gameId;
                    callback(ErrorCode.LOGIN_SUCCESS.code, ErrorCode.LOGIN_SUCCESS.msg, rows[0][0]);
                }
            }
            values = [];
        })
    });
}


// 设置邀请码
exports.saveInviteCode = function saveInviteCode(userId, inviteCode){
    // email登录
    const sql = 'update userinfo set invite_code = ? where userId = ?';
    const values = [];
    values.push(inviteCode);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('保存邀请码' + err);
            } else {
                console.log('保存邀请码成功' , userId, '码:' ,inviteCode);
            }
        })
    });
}



// 游客注册
exports.RegisterByGuest = function RegisterByGuest(userInfo, callback) {
    const sql = 'call RegisterByGuest(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    let values = [];

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
        userInfo.language = 0;
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

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("游客注册");
                console.log(err);
                callback(0);
            } else {
                if (rows[0] && rows[0][0]) {
                    callback(1, rows[0][0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};


//修改密码
exports.SetPassword = function SetPassword(userInfo, callback) {
    const sql = 'UPDATE newuseraccounts SET Password=?,p=? WHERE Account=?';
    let values = [];
    values.push(userInfo.pwd);
    values.push(userInfo.p);
    values.push(userInfo.accountname);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

// 注销账号
exports.logoutAccount = function logoutAccount(userId, callback) {
    const sql = 'UPDATE newuseraccounts SET account_using=0 WHERE Id=?';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("注销账号");
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
    const sql = 'UPDATE newuseraccounts SET phoneNo=? WHERE Id=?';
    let values = [];
    values.push(userInfo.phoneNo);
    values.push(userInfo.Id);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'call checkPhone(?,?)';
    let values = [];
    values.push(userInfo.userId);
    values.push(userInfo.phone);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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



// 批量更新用户信息
exports.batchUpdateAccount = function batchUpdateAccount(userList, callback) {
    const sql = 'call BatchUpdateAccount(?)';
    const users = userList.map(user =>{
        return {
            id : user._userId,
            score : user._score ? user._score : 0,
            diamond : user._diamond ? user._diamond : 0,
            bankScore : user.bankScore ? user.bankScore : 0,
            bankLock : user.bankLock,
            housecard : user.vip_level,
            is_vip : user.is_vip,
            vip_score : user.vip_score,
            luckyCoin : user.luckyCoin,
            firstRecharge : user.firstRecharge,
            loginCount: user.LoginCount
        }
    });

    let values = [];
    values.push(JSON.stringify(users));
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("batchUpdateAccount");
                console.log(err);
                callback(null);
            } else {
                callback(users);
            }
        });
        values = [];
    });
}






//查询用户id
exports.getUserId = function getUserId(accountname, callback) {
    const sql = 'SELECT userinfo_imp.*,newuseraccounts.p FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` WHERE Account=?';
    let values = [];
    values.push(accountname);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

// 查询用户id
exports.webGetUser = function webGetUser(accountname, callback) {
    const sql = 'SELECT newuseraccounts.nickname,userinfo_imp.* FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` WHERE Account=?';
    let values = [];

    values.push(accountname);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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


exports.searchUserById = function searchUserById(userId, callback) {
    const sql = 'SELECT a.*,b.*, c.* FROM newuseraccounts a LEFT JOIN userinfo_imp b ON a.`Id` = b.`userId` LEFT JOIN userinfo c ON a.`Id` = c.`userId`  WHERE a.ID=?';
    let values = [];

    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询用户信息");
                console.log(err);
                callback(0);
                return
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

// 增加领取破产补助次数
exports.addGetBustTimes = function addGetBustTimes(userId, callback) {
    const sql = 'update userinfo set bustTimes = bustTimes + 1 where userId = ?';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("增加领取破产补助次数");
                console.log(err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
}


//查询注册ip是否存在
exports.getUserIdByIp = function getUserIdByIp(ip, callback) {
    const sql = 'SELECT Id FROM newuseraccounts WHERE loginip=?';
    let values = [];
    values.push(ip);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'SELECT score FROM userinfo_imp WHERE userId=?';
    let values = [];
    values.push(userid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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


exports.checkNickName = function checkNickName(userId, callback) {
    const sql = 'select nickname from newuseraccounts where Id=?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'select nickname from newuseraccounts where Account=?';
    let values = [];

    values.push(userName);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'update newuseraccounts set nickname=? where Id=?';
    let values = [];
    values.push(nickname);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("修改昵称");
                console.log(err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};

exports.checkVip = function checkVip(userId, callback) {
    const sql = 'select is_vip from newuseraccounts where Id=?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

// 订单记录
exports.orderRecord = function orderRecord(userId, orderId, amount, currencyType, vipLevel, goodsType, price, group, service, mul, shopType,  callback) {
    const sql = 'INSERT INTO pay_order (orderId, userId, amount, currencyType, vipLevel, goodsType, price, `group`, service, mul, shopType) VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ';

    let values = [];
    values.push(orderId);
    values.push(userId);
    values.push(amount);
    values.push(currencyType);
    values.push(vipLevel);
    values.push(goodsType);
    values.push(price);
    values.push(group);
    values.push(service);
    values.push(mul);
    values.push(shopType);


    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("订单记录");
                console.log(err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};


// 查询订单
exports.searchOrder = function searchOrder(userId, orderId, callback) {
    const sql = 'SELECT id, orderId, userId, amount, currencyType, vipLevel, goodsType, price, status, `group`, service, mul, shopType FROM pay_order where status = 0 and orderId = ? and userId = ?';
    let values = [];
    values.push(orderId);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询订单");
                console.log(err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows[0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};



// 更新订单
exports.updateOrder = function updateOrder(userId, orderId, callback) {
    const sql = 'update pay_order set `status` = 1 where orderId = ? and userId = ?';
    let values = [];
    values.push(orderId);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("更新订单");
                console.log(err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};

exports.getVipLevel = function getVipLevel(userId, callback) {
    const sql = 'select housecard from newuseraccounts where Id=?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
                    callback(1, rows[0].housecard);
                }
            }
        });
        values = [];
    });
};

//查询累计充值
exports.checkTotalCharge = function checkTotalCharge(userId, callback) {
    const sql = 'select totalRecharge,housecard,score_flow from newuseraccounts where Id=?';
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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



// 查询提现额度
exports.searchWithdrawLimit = function searchWithdrawLimit(userId, callback) {
    const sql = 'select withdrawLimit from userinfo_imp where userId = ?';
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询提现额度");
                console.log(err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(1, rows[0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};


//修改累计充值
exports.updateTotalCharge = function updateTotalCharge(userId, amount, callback) {
    const sql = 'update newuseraccounts set totalRecharge = totalRecharge + ? where Id=?';
    let values = [];
    values.push(Number(amount));
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("修改累计充值");
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



// 修改语言
exports.updateLang = function updateLang(userId, language, callback) {
    const sql = 'update newuseraccounts set language= ? where Id=?';
    let values = [];
    values.push(language);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("修改语言");
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
exports.updateVipLevel = function updateVipLevel(userId, vipLevel, callback) {
    const sql = 'update newuseraccounts set housecard=?,is_vip =? where Id=?';
    let values = [];

    values.push(vipLevel);
    values.push(vipLevel > 0 ? 1 : 0);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("修改vip等级");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};

// 查询转入记录
exports.searchBankTransferIntoRecord = function searchBankTransferIntoRecord(userId, callback) {
    const sql = 'select * from gameaccount.log_bank_transfer t left join gameaccount.newuseraccounts n on t.from_userid = n.id where t.to_userid  = ?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("searchBankTransferRecord");
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
}


// 查询转出记录
exports.searchBankTransferOutRecord = function searchBankTransferOutRecord(userId, callback) {
    const sql = 'select * from gameaccount.log_bank_transfer t left join gameaccount.newuseraccounts n on t.to_userid  = n.id where t.from_userid  = ?';
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("searchBankTransferOutRecord");
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
}


// 更新VIP积分
exports.updateVipScore = function updateVipScore(userId, vipScore, callback) {
    const sql = 'update newuseraccounts set vip_score = ? where Id=?';
    let values = [];

    values.push(vipScore);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateVipScore");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};

// 增加提现额度
exports.addWithdrawLimit = function addWithdrawLimit(userId, withdrawLimit, callback) {
    const sql = 'update userinfo_imp set withdrawLimit = withdrawLimit + ? where userId=?';
    let values = [];

    values.push(withdrawLimit);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("增加提现额度");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};


// 减少提现额度
exports.reduceWithdrawLimit = function reduceWithdrawLimit(userId, amount, callback) {
    const sql = 'update userinfo_imp set withdrawLimit = withdrawLimit - ? where userId=?';
    let values = [];
    values.push(amount);
    values.push(userId);
    values.push(amount);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("减少提现额度");
                console.log(err);
                callback(0);
            } else {
                callback(1);
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

// 银行转账
exports.BankTransfer = function BankTransfer(userId, giveUserId, bankScore, changeType, callback) {
    const sql = 'call BankTransfer(?,?,?,?)';
    let values = [];
    values.push(Number(userId));
    values.push(Number(giveUserId));
    values.push(Number(bankScore));
    values.push(changeType);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("BankTransfer");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0][0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
}


// 用户签到查询
exports.searchUserSignIn = function searchUserSignIn(userId, callback) {
    const sql = 'SELECT CONVERT_TZ(last_sign_in_date, \'+00:00\', \'+08:00\') AS last_sign_in_date, consecutive_days FROM activity_sign WHERE userId = ?';
    let values = [];
    values.push(userId);


    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("searchUserSignIn");
                console.log(err);
                callback(0);
            } else {
                if (rows[0]) {
                    callback(rows[0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
}


// 签到
exports.userSignIn = function userSignIn(userId, callback) {
    const sql = 'call SignIn(?)';
    let values = [];
    values.push(userId);


    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        // 开启事务
        connection.beginTransaction(err =>{
            if(err){
                log.err('获取数据库连接失败' + err);
                callback(0);
                connection.release();
                return;
            }
            connection.query({sql: sql, values: values}, function (err, rows) {
                if (err) {
                    console.log("userSignIn");
                    console.log(err);
                    connection.release();
                    callback(0);
                } else {
                    callback(rows[0][0], connection);
                }
                values = [];
            });
        })
    });
}



// 转正
exports.changleOfficial = function changleOfficial(userId, callback) {
    const sql = 'update newuseraccounts set official = 1 where Id = ?';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("转正");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
}


// 是否存在邀请码
exports.existInviteCode = function existInviteCode(inviteCode, callback){
    const sql = 'select userId,invite_code from userinfo u where invite_code = ?';
    const values = []
    values.push(inviteCode);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('是否存在邀请码'+ err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows[0]);
                } else {
                    callback(0);
                }
            }
        })
    });
}



//添加银行卡
exports.addBank = function addBank(userId, account, name, cpf, bankType, callback) {
    const sql = 'call AddBankCard(?,?,?,?,?)';
    let values = [];

    values.push(userId);
    values.push(account);
    values.push(name);
    values.push(bankType);
    values.push(cpf);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'UPDATE bankbindlist SET account=?,name=?,bankType=? WHERE userId=? AND cardId=?';
    let values = [];
    values.push(account);
    values.push(name);
    values.push(bankType);
    values.push(userId);
    values.push(cardId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'DELETE FROM bankbindlist WHERE userId=? AND cardId=?';
    let values = [];
    values.push(userId);
    values.push(cardId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'select * from bankbindlist where userId=? ORDER BY bankType';
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("获得用户银行卡");
                console.log(err);
                callback(0);
            } else {
                callback(1, rows);
            }
        });
        values = [];
    });
};

//获得用户道具
exports.getPropByUserId = function getPropByUserId(_userId, callback) {
    const sql = 'select * from prop_item where userid=?';
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'select * from fish.usecoin where userId=?';
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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




//保存用户变化量
exports.saveUserLog = function saveUserLog(userInfo, callback) {
    const sql = 'UPDATE newuseraccounts SET score=score+? WHERE Id=?';
    let values = [];
    values.push(userInfo.addgold);
    values.push(userInfo.userid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'call AddGold(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.addgold);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'call AddDiamond(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.adddiamond);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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


//不在线修改金钱(减)
exports.AddGoldSub = function AddGoldSub(userInfo, callback) {
    var sql = 'call AddGoldSub(?,?,?)';
    var values = [];
    values.push(userInfo.userid);
    values.push(userInfo.addgold);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'call AddDiamondSub(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.diamond);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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


// 游戏上下分记录
exports.score_changeLog = function score_changeLog(userInfo) {
    const sql = "INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    let values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        for (var i = 0; i < userInfo.length; i++) {
            if (userInfo[i].userid < 500 || userInfo[i].userid > 1800) {
                values.push(userInfo[i].userid);
                values.push(userInfo[i].score_before);
                values.push(userInfo[i].score_change);
                values.push(userInfo[i].score_current);
                values.push(userInfo[i].change_type);
                values.push(userInfo[i].isOnline);

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

// 金币改变记录
exports.scoreChangeLog = function scoreChangeLog(userid, score_before, score_change, score_current, change_type, isOnline) {
    const sql = "INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    let values = [];
    values.push(userid);
    values.push(score_before);
    values.push(score_change);
    values.push(score_current);
    values.push(change_type);
    values.push(isOnline);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("score_changeLog");
                console.log(err);
            }
            values = [];
        });
    });
};

//上下分记录
exports.diamond_changeLog = function score_changeLog(userInfo) {
    var sql = "INSERT INTO diamond_changelog(userid,diamond_before,diamond_change,diamond_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    var values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
    let sql = "SELECT mark.*,newuseraccounts.Account FROM mark JOIN newuseraccounts ON mark.userId=newuseraccounts.Id WHERE balanceTime >= ? and balanceTime <= ? LIMIT ?,?";

    if (!userInfo.lineCount) {
        sql = "SELECT mark.*,newuseraccounts.Account FROM mark JOIN newuseraccounts ON mark.userId=newuseraccounts.Id WHERE balanceTime >= ? and balanceTime <= ?";
    }
    let values = [];
    values.push(userInfo.beginTime);
    values.push(userInfo.endTime);
    values.push(parseInt(userInfo.linebegin));
    values.push(parseInt(userInfo.lineCount));

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback_c(0)
            return;
        }
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
    const sql = "CALL LogLotterySearch(?,?)";
    let values = [];
    values.push(userInfo.gameid);
    values.push(userInfo.lineCount);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback_c(0);
            return;
        }
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
        });
        values = [];
    })
};

//标记
exports.mark = function mark(userInfo, callback_c) {
    const sql = "UPDATE mark SET mark = 1 WHERE id <= ?";
    let values = [];
    values.push(userInfo.pkid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback_c(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("mark");
                console.log(err);
            } else {
                callback_c(0);
            }
        });
        values = [];
    })
};


//更新用户道具
exports.updateProp = function updateProp(_userInfo, callback) {
    const sql = 'CALL updateProp(?,?,?,?,?)';
    let values = [];

    values.push(_userInfo.userId);
    values.push(_userInfo.propId);
    values.push(_userInfo.propCount);
    values.push(_userInfo.roomid);
    values.push(_userInfo.typeid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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





// 发邮件
exports.sendEmail = function sendEmail(info, callback) {
    const sql = 'call sendEmail(?,?,?,?,?,?,?)';
    let values = [];
    values.push(info.userId);
    values.push(info.winPropId);
    values.push(info.winPropCount);
    values.push(info.winScore);
    values.push(info.type);
    values.push(info.sendCoinUserId);
    values.push(info.nickName);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = 'UPDATE fish.getcoin SET mark=1 WHERE id=?';
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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



//创建充值数据
exports.create_recharge = function create_recharge(userInfo, callback) {
    const sql = "call createRecharge(?,?,?,?)";
    let values = [];
    values.push(userInfo.Account);
    values.push(userInfo.total_fee);
    values.push(userInfo.out_trade_no);
    values.push(userInfo.goodsid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = "call updateRecharge(?)";
    let values = [];

    values.push(out_trade_no);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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


// 已领取新手礼包
exports.setNewHandGive = function setNewHandGive(userId, callback) {
    const sql = "UPDATE userinfo SET newHandGive = 1 WHERE userId= ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("已领取新手礼包");
                console.log(err);
                callback(0);
            } else {
                if (rows) {
                    callback(1);
                } else {
                    callback(0);
                }
            }
        })
        values = [];
    });
};


//更新充值数据
exports.checkRecharge = function checkRecharge(out_trade_no, callback) {
    const sql = "call checkRecharge(?)";
    let values = [];

    values.push(out_trade_no);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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



exports.updateFirstexchange = function updateFirstexchange(_userId) {
    const sql = "update userinfo set firstexchange = 1 where userId = ?";
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = "update sendcoinlog set state = ? where id = ?";
    let values = [];
    values.push(state);
    values.push(id);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

exports.searchAccountByDeviceCode = function (deviceCode, callback) {
    const sql = "select Account,p  from newuseraccounts n where device_code = ?";
    let values = [];
    values.push(deviceCode);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("searchAccountByDeviceCode");
                console.log(err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0][0]);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}

exports.updateAccountByDeviceCode = function (deviceCode, account, callback) {
    const sql = "update newuseraccounts set device_code = ? where Account = ?";
    let values = [];
    values.push(deviceCode);
    values.push(account);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("updateAccountByDeviceCode");
                console.log(err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}

// 获取是否购买过首充
exports.searchFirstRecharge = function (userId, callback) {
    const sql = "select firstRecharge  from userinfo  where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("获取是否购买过首充");
                console.log(err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0]);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}

// 获取用户货币账户
exports.searchUserMoney = function searchUserMoney(userId, callback) {
    const sql = "select score,diamond, bankScore,luckyCoin, withdrawLimit from userinfo_imp  where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("获取用户货币账户");
                console.log(err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0]);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}


// 锁定银行积分
exports.lockBankScore = function lockBankScore(userId, bankScore , callback) {
    const sql = "update userinfo_imp set bankScore = bankScore - ?, lockBankScore = lockBankScore + ? where userId = ?";
    let values = [];
    values.push(bankScore);
    values.push(bankScore);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("锁定银行积分");
                console.log(err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}

// 更新提现订单支付状态
exports.updateWithdrawPayStatus = function updateWithdrawPayStatus(userId, orderId, payStatus, callback) {
    const sql = "update withdraw_record set pay_status = ? where orderId = ? and userId = ? ";
    let values = [];
    values.push(payStatus);
    values.push(orderId);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("更新提现订单支付状态");
                console.log(err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}



// 解锁银行积分
exports.unlockBankScore = function unlockBankScore(userId, bankScore , callback) {
    const sql = "update userinfo_imp set bankScore = bankScore + ?, lockBankScore = lockBankScore - ? where userId = ?";
    let values = [];
    values.push(bankScore);
    values.push(bankScore);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("解锁银行积分");
                console.log(err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}


// 更新新手指引步数
exports.updateGuideStep = function (userId, step, callback) {
    const sql = "update newuseraccounts set step = ? where Id = ?";
    let values = [];
    values.push(step);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("更新新手指引步数");
                console.log(err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}


// 提现申请记录
exports.withdrawApplyRecord = function withdrawApplyRecord(userId, amount, account, bankType, name, cpf, callbackUrl, orderId, lockBankScore, currencyType, callback) {
    const sql = "INSERT INTO withdraw_record(userId, amount, account, bankType, name, cpf, callbackUrl, orderId, lockBankScore, currencyType) VALUES(?, ?, ?, ? , ?, ?, ?, ?, ?, ?)";

    let values = [];
    values.push(userId);
    values.push(amount);
    values.push(account);
    values.push(bankType);
    values.push(name);
    values.push(cpf);
    values.push(callbackUrl);
    values.push(orderId);
    values.push(lockBankScore);
    values.push(currencyType);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("提现申请记录");
                console.log(err);
                callback(0)
                return;
            }
            if(rows){
                callback(1)
            }else{
                callback(0)
            }
        });
        values = [];
    });
};


// 通过订单查询提现申请记录
exports.searchWithdrawRecordByOrdeId = function searchWithdrawRecordByOrdeId(userId, orderId, callback) {
    const sql = "SELECT id, amount, create_time, account, bankType, name, status, orderId, pay_status payStatus,lockBankScore FROM withdraw_record WHERE userId = ? and orderId = ?";

    let values = [];
    values.push(userId);
    values.push(orderId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("通过订单查询提现申请记录");
                console.log(err);
                callback(0)
                return;
            }
            if(rows && rows.length > 0){
                callback(1, rows[0])
            }else{
                callback(0)
            }
        });
        values = [];
    });
};

// 查询提现申请记录
exports.searchWithdrawApplyRecord = function searchWithdrawApplyRecord(userId, callback) {
    const sql = "SELECT id, amount, create_time, account, bankType, name, status, orderId, pay_status payStatus FROM withdraw_record WHERE userId = ?";

    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询提现申请记录");
                console.log(err);
                callback(0)
                return;
            }
            if(rows && rows.length > 0){
                callback(1, rows)
            }else{
                callback(0)
            }
        });
        values = [];
    });
};

// 保存邮件记录
exports.saveEmail = function saveEmail(title, type, to_userid, from_userid, content_id, otherId, goods_type) {
    const sql = "INSERT INTO email (title_id, `type`, to_userid, from_userid, content_id, otherId, goods_type) VALUES (?, ?, ?, ?, ?, ?, ?)";

    var values = [];
    values.push(title);
    values.push(type);
    values.push(to_userid);
    values.push(from_userid);
    values.push(content_id);
    values.push(otherId);
    values.push(goods_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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

//查询转账邮件记录
exports.selectEmail = function selectEmail(types, userId, callback) {
    const sql = "call GetEmail(?,?)";
    let values = [];
    values.push(types);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询转账邮件记录");
                console.log(err);
            } else {
                if (rows && rows.length > 0) {
                    callback(1, rows[0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};


// 查询邮件类型
exports.selectEmailTypes = function selectEmailTypes(userId, callback) {
    const sql = "select `type` from email where to_userid = ? ";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询邮件类型");
                console.log(err);
            } else {
                if (rows && rows.length > 0) {
                    const types = rows.map(obj => obj.type).join(',');
                    callback(1, types);
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
    const sql = "update email set isRead = 1 where id = ?";
    let values = [];
    values.push(id);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("设置邮件为已读");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }

        });
        values = [];
    });
};

// 设置邮件为已读
exports.setEmailisAlllReadByUserId = function setEmailisAlllReadByUserId(userId, callback) {
    const sql = "update email set isRead = 1 where to_userid = ?";
    let values = [];

    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("设置用户全部邮件为已读");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }

        });
        values = [];
    });
};

// 删除指定邮件
exports.delEmailById = function delEmailById(id, callback) {
    const sql = "delete from email where id = ?";
    let values = [];
    values.push(id);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("删除指定邮件");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }

        });
        values = [];
    });
};

// 删除全部已读邮件
exports.delEmailisAlllReadByUserId = function delEmailisAlllReadByUserId(userId, callback) {
    const sql = "delete from email  where isRead = 1 and to_userid = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("删除全部已读");
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
    const sql = "select * from email  where type = 999";
    let values = [];

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询系统邮件记录");
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
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("sendcoinServer");
                console.log(err);
                callback(0);
            } else {
                callback(rows[0][0].recod);
            }
        });
        values = [];
    });
};


exports.saveLineOut = function saveLineOut(userid) {
    const sql = 'INSERT INTO lineout(userId) VALUES(?)';
    let values = [];
    values.push(userid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
    const sql = 'DELETE FROM lineout';
    let values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
    const sql = "select * from userinfo_imp where userId = ?";
    let values = [];

    values.push(_userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
            values = [];
        })
    });
}

// 增加金币
exports.addAccountScore = function addAccountScore(_userId, score, callback) {
    const sql = "update userinfo_imp set score = score + ? where userId = ?";
    let values = [];
    values.push(score);
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("增加金币");
                console.log(err);
                callback(0);
            }else{
                if(rows){
                    callback(1);
                }else {
                    callback(0);
                }
            }
            values = []
        })
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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




//更新充值数据
exports.updateScoreOut = function updateScoreOut(out_trade_no, flag, remark, callback) {
    var sql = "call updateScoreOut(?,?,?)";
    var values = [];

    values.push(out_trade_no);
    values.push(flag);
    values.push(remark);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
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



// 查询邀请码
exports.searchInvitedCode = function searchInvitedCode(userId, callback) {
    const sql = 'select invite_code  from userinfo u where u.userId = ?';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询邀请码");
                console.log(err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows[0]);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};