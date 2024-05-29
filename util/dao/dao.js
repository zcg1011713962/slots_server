const mysql = require('mysql2');
const log = require("../../CClass/class/loginfo").getInstand;
const mysql_config = require("../config/mysql_config");
const ErrorCode = require('../ErrorCode');
const RedisUtil = require('../redis_util');
const StringUtil = require("../string_util");
const TypeEnum = require("../enum/type");


const pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'gameaccount',
    charset: "utf8mb4"
});



exports.googleLogin = function (user, socket, callback){
    // google登录
    const sql = 'CALL LoginByGoogle(?,?,?)';
    let values = [];
    values.push(user.uid);
    values.push(user.displayName);
    values.push(user.email);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.pwdLogin = function (user, socket, callback){
    const sql = 'CALL LoginByPassword(?,?)';
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.emailLogin =  function (user, socket, callback){
    // email登录
    const sql = 'CALL LoginByEmail(?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.tokenLogin = function (user, socket, callback){
    // email登录
    const sql = 'CALL LoginByToken(?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.emailSearch = function (email, callback){
    const sql = 'CALL LoginByEmail(?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.emailBind = function (userId , email, callback){
    const sql = 'update newuseraccounts set email = ? where id = ?';
    let values = [];
    values.push(email)
    values.push(userId)

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.registerByEmail = function (socket, email, account, pwd, nickname, king,  callback){
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
            connection.release();
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
exports.registerByGoogle = function registerByGoogle(user, account, pwd, nickname,king, callback){
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('google注册' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0][0]);
                }else{
                    callback(0);
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
            connection.release();
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
exports.RegisterByGuest = function (userInfo, callback) {
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
            connection.release();
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
            connection.release();
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
            connection.release();
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



// 批量更新用户信息
exports.batchUpdateAccount = function batchUpdateAccount(userList, callback) {
    const sql = 'call BatchUpdateAccount(?)';
    const users = userList.map(user => {
        const newUser = {
            id: user._userId,
            bankScore: user.bankScore,
            bankLock: user.bankLock,
            housecard: user.vip_level,
            is_vip: user.is_vip,
            vip_score: user.vip_score,
            luckyCoin: user.luckyCoin,
            firstRecharge: user.firstRecharge,
            loginCount: user.LoginCount
        };

        // 移除字段为空的属性
        Object.keys(newUser).forEach(key => {
            if (newUser[key] === null || newUser[key] === undefined || newUser[key] === '') {
                delete newUser[key];
            }
        });

        return newUser;
    });

    let values = [];
    values.push(JSON.stringify(users));
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
exports.webGetUser = function (accountname, callback) {
    const sql = 'SELECT newuseraccounts.nickname,userinfo_imp.* FROM newuseraccounts LEFT JOIN userinfo_imp ON newuseraccounts.`Id` = userinfo_imp.`userId` WHERE Account=?';
    let values = [];

    values.push(accountname);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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


exports.searchUserById = function (userId, callback) {
    const sql = 'SELECT a.*,b.*, c.* FROM newuseraccounts a LEFT JOIN userinfo_imp b ON a.`Id` = b.`userId` LEFT JOIN userinfo c ON a.`Id` = c.`userId`  WHERE a.ID=?';
    let values = [];

    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
exports.getUserIdByIp = function (ip, callback) {
    const sql = 'SELECT Id FROM newuseraccounts WHERE loginip=?';
    let values = [];
    values.push(ip);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.getUserCoinById = function (userid, callback) {
    const sql = 'SELECT score FROM userinfo_imp WHERE userId=?';
    let values = [];
    values.push(userid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
            connection.release();
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




//更新新手标识
exports.updateNewHandFlag = function (userId, newHandFlag, callback) {
    let sql = 'update userinfo set newHandFlag= ? where userId = ?';
    let values = [];
    values.push(newHandFlag);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("更新新手标识");
                log.err(err);
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
            connection.release();
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
            connection.release();
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
            connection.release();
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
            connection.release();
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
exports.orderRecord = function (userId, orderId, productId, amount, currencyType, vipLevel, goodsType, price, group, service, mul, shopType, val, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payChannel, payType, promoteWithdrawLimit,silverCoin, callback) {
    const sql = 'INSERT INTO pay_order (orderId, userId, productId, amount, currencyType, vipLevel, goodsType, price, `group`, service, mul, shopType, `val`, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payChannel, payType, promoteWithdrawLimit,silverCoin) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?) ';

    let values = [];
    values.push(orderId);
    values.push(userId);
    values.push(productId);
    values.push(amount);
    values.push(currencyType);
    values.push(vipLevel);
    values.push(goodsType);
    values.push(price);
    values.push(group);
    values.push(service);
    values.push(mul);
    values.push(shopType);
    values.push(val);
    values.push(serverId);
    values.push(buyContinueRewardGold);
    values.push(buyContinueRewardDiamond);
    values.push(buyContinueDays);
    values.push(payChannel);
    values.push(payType);
    values.push(promoteWithdrawLimit ? promoteWithdrawLimit : 0);
    values.push(silverCoin ? silverCoin : 0);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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


// 查询未支付的指定订单
exports.searchOrder = function searchOrder(userId, orderId, callback) {
    const sql = 'SELECT id, orderId, userId, amount, currencyType, vipLevel, goodsType, price, status, `group`, service, mul, shopType, `val`, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payType, productId, silverCoin FROM pay_order where orderId = ? and userId = ? and status in(?,?)';
    let values = [];
    values.push(orderId);
    values.push(userId);
    values.push(TypeEnum.OrderStatus.create);
    values.push(TypeEnum.OrderStatus.paying);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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



// 查询已经支付的指定订单
exports.searchPayOrder = function (userId, orderId, callback) {
    const sql = 'SELECT id, orderId, userId, amount, currencyType, vipLevel, goodsType, price, status, `group`, service, mul, shopType, `val`, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payType, productId, silverCoin FROM pay_order where orderId = ? and userId = ? and status in(?,?)';
    let values = [];
    values.push(orderId);
    values.push(userId);
    values.push(TypeEnum.OrderStatus.payedNotify);
    values.push(TypeEnum.OrderStatus.payedUnNotify);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询已经支付的指定订单");
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



// 查询所有未支付订单
exports.searchAllOffLineOrder = function searchAllOffLineOrder(callback) {
    const sql = 'SELECT id, orderId, userId, amount, currencyType, vipLevel, goodsType, price, status, `group`, service, mul, shopType, `val`, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payType, productId, silverCoin FROM pay_order where status = ? or status = ?';
    let values = [];
    values.push(TypeEnum.OrderStatus.create);
    values.push(TypeEnum.OrderStatus.paying);


    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};

// 查询所有订单
exports.searchAllOrder = function (userId, payStatus, callback) {
    const sql = 'SELECT id, orderId, userId, amount, currencyType, vipLevel, goodsType, price, status, `group`, service, mul, shopType, `val`, serverId, buyContinueRewardGold, buyContinueRewardDiamond, buyContinueDays, payChannel, payType, productId,silverCoin, create_time createTime, promoteWithdrawLimit FROM pay_order where userId = ? and status = ? or status = ? order by create_time desc limit 100';
    let values = [];
    values.push(userId);
    values.push(payStatus[0]);
    values.push(payStatus[1]);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
}

// 查询下注记录
exports.searchBetRecord = function (userId, callback) {
    const sql = 'SELECT b.id, b.userId , b.gameId, b.gameName, b.betSum, b.promoteWithdrawLimit, b.create_time, b.update_time, n.headimgurl, n.nickname  FROM bet_record b left join newuseraccounts n on b.userId  = n.Id where b.userId = ? order by b.update_time desc limit 100';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询下注记录");
                console.log(err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
};


// 插入下注记录
exports.betRecord = function (userId,gameId,gameName,betSum,promoteWithdrawLimit, callback) {
    const sql = 'INSERT INTO bet_record (gameId, gameName, betSum, promoteWithdrawLimit, userId) VALUES(?, ?, ?, ?, ?)';
    let values = [];
    values.push(gameId);
    values.push(gameName);
    values.push(betSum);
    values.push(promoteWithdrawLimit);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("查询下注记录");
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


// 解锁提现页
exports.unLockWithdrawPage = function (userId, callback) {
    const sql = 'update userinfo set withdrawPageUnLock = 1  where  userId = ?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("解锁提现页");
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


// 查询提现页是否解锁
exports.searchWithdrawPageStatus = function (userId, callback) {
    const sql = 'select withdrawPageUnLock from userinfo where  userId = ?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询提现页是否解锁");
                log.err(err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows[0].withdrawPageUnLock);
                } else {
                    callback(0);
                }
            }
        });
        values = [];
    });
}



exports.searchFirstRechargeGoodsEndTime = function (userId, day,  callback) {
    pool.getConnection(function (err, connection) {
        // 先查询 userId 是否存在
        connection.query('SELECT firstRechargeGoodsEndTime FROM userinfo WHERE userId = ?', [userId], function (error, results, fields) {
            if (error) {
                connection.release();
                callback(0)
                return;
            }
            // 如果 userId 存在，则更新数据
            if (results.length > 0 && results[0].firstRechargeGoodsEndTime) {
                callback(results[0].firstRechargeGoodsEndTime)
            } else {
                const currTime = new Date().getTime();
                const endTime = currTime + day * 24 * 60 * 60 * 1000;
                // 如果 userId 不存在，则插入新数据
                connection.query('update userinfo set firstRechargeGoodsEndTime = ? where userId = ?', [endTime, userId], function (error, results, fields) {
                    connection.release();
                    if (error) {
                        callback(0)
                        return;
                    }
                    callback(endTime)
                });
            }
        });
    });
}

// 更新订单
exports.updateOrder = function updateOrder(userId, orderId, payStatus, callback) {
    const sql = 'update pay_order set `status` = ?  where orderId = ? and userId = ?';
    let values = [];
    values.push(payStatus);
    values.push(orderId);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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

exports.getVipLevel = function (userId, callback) {
    const sql = 'select housecard from newuseraccounts where Id=?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
exports.checkTotalCharge = function (userId, callback) {
    const sql = 'select totalRecharge,submittedRecharge subRecharge,housecard,score_flow from newuseraccounts where Id=?';
    let values = [];
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询累计充值" + err);
                callback(0);
            } else {
                if (rows.length === 0) {
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
exports.searchWithdrawLimit = function (userId, callback) {
    const sql = 'select withdrawLimit from userinfo_imp where userId = ?';
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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

// 查询银币数量
exports.searchSilverCoin = function (userId, callback) {
    const sql = 'select silverCoin from userinfo_imp where userId = ?';
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询银币数量");
                log.err(err);
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


// 减少银币
exports.reduceSilverCoin = function (userId, silverCoin, callback) {
    const sql = 'update userinfo_imp set silverCoin = silverCoin - ? where userId = ?';
    let values = [];
    values.push(silverCoin);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("减少银币");
                log.err(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};



// 增加银币
exports.addSilverCoin = function (userId, silverCoin, callback) {
    const sql = 'update userinfo_imp set silverCoin = silverCoin + ? where userId = ?';
    let values = [];
    values.push(silverCoin ? silverCoin : 0);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("增加银币");
                log.err(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};


// 减少银币
exports.reduceSilverCoin = function (userId, silverCoin, callback) {
    const sql = 'update userinfo_imp set silverCoin = silverCoin - ? where userId = ?';
    let values = [];
    values.push(silverCoin ? silverCoin : 0);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("减少银币");
                log.err(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};

//修改累计充值
exports.updateTotalCharge = function (userId, amount, callback) {
    const sql = 'update newuseraccounts set totalRecharge = totalRecharge + ?, weekRecharge = weekRecharge + ? where Id=?';
    let values = [];
    values.push(Number(amount));
    values.push(Number(amount));
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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


// 清空周充值
exports.clearWeekRecharge = function (callback) {
    const sql = 'update newuseraccounts set weekRecharge = 0';
    let values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("清空周充值");
                console.log(err);
                callback(0);
            } else {
                callback(1);
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
            connection.release();
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
exports.updateVipLevel = function (userId, vipLevel, callback) {
    const sql = 'update newuseraccounts set housecard=?,is_vip =? where Id=?';
    let values = [];

    values.push(vipLevel);
    values.push(vipLevel > 0 ? 1 : 0);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
            connection.release();
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
exports.updateVipScore = function (userId, vipScore, callback) {
    const sql = 'update newuseraccounts set vip_score = ? where Id=?';
    let values = [];

    values.push(vipScore);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
}



// 增加VIP积分
exports.addVipScore = function (userId, vipScore, callback) {
    const sql = 'update newuseraccounts set vip_score = vip_score + ? where Id=?';
    let values = [];

    values.push(vipScore);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("增加VIP积分");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
}


// 兑换记录
exports.exchangeRecord = function (userId, val, goodsId, goodsType, name, target_price, callback) {
    const sql = 'INSERT INTO gameaccount.exchange_record (userId, val, goodsId, goodsType, name, target_price) VALUES(?, ?, ?, ?, ?, ?);';
    let values = [];
    values.push(userId);
    values.push(val);
    values.push(goodsId);
    values.push(goodsType);
    values.push(name);
    values.push(target_price);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("兑换记录");
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
}



// 查询兑换记录
exports.searchExchangeRecord = function (userId, goodsId, callback) {
    const sql = 'select * from  gameaccount.exchange_record where userId = ? and goodsId = ?';
    let values = [];
    values.push(userId);
    values.push(goodsId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询兑换记录");
                log.err(err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}


exports.searchExchangeRecordCount = async function (pairs) {
    const promises = pairs.map(pair => {
        return new Promise((resolve, reject) => {
            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT COUNT(1) AS count FROM exchange_record WHERE userId = ? AND goodsId = ?',
                    [pair.userId, pair.goodsId],
                    (error, result) => {
                        connection.release();
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                userId: pair.userId,
                                goodsId: pair.goodsId,
                                count: result[0].count
                            });
                        }
                    }
                );
            });
        });
    });
    return await Promise.all(promises);
}


// 增加提现额度
exports.addWithdrawLimit = function addWithdrawLimit(userId, withdrawLimit, callback) {
    const sql = 'update userinfo_imp set withdrawLimit = withdrawLimit + ? where userId=?';
    let values = [];

    values.push(withdrawLimit);
    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
            connection.release();
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
exports.BankTransfer = function (userId, giveUserId, bankScore, changeType, callback) {
    const sql = 'call BankTransfer(?,?,?,?)';
    let values = [];
    values.push(Number(userId));
    values.push(Number(giveUserId));
    values.push(Number(bankScore));
    values.push(changeType);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("BankTransfer" + err);
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


// 查询用户签到
exports.searchUserSignIn = function searchUserSignIn(userId, callback) {
    const sql = 'SELECT last_sign_in_date, consecutive_days FROM activity_sign WHERE userId = ?';
    let values = [];
    values.push(userId);


    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询用户签到" + err);
                callback(0);
            } else {
                callback(rows)
            }
        });
        values = [];
    });
}

// 用户首次签到
exports.userFirstSignIn = function (userId, lastSignInDate, callback) {
    const sql = 'INSERT INTO activity_sign (userId, last_sign_in_date, consecutive_days) VALUES(?, ?, 1)';
    let values = [];
    values.push(userId);
    values.push(lastSignInDate);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('用户首次签到' + err);
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


// 用户再次签到
exports.userKeepSignIn = function (userId, lastSignInDate, days, callback) {
    const sql = 'UPDATE gameaccount.activity_sign SET last_sign_in_date = ? , consecutive_days = ? + 1 WHERE userId = ?';
    let values = [];
    values.push(lastSignInDate);
    values.push(days);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('用户再次签到' + err);
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



// 用户签到7天重置天数
exports.userResetSignIn = function (userId, lastSignInDate, callback) {
    const sql = 'UPDATE gameaccount.activity_sign SET last_sign_in_date = ?, consecutive_days = 1 WHERE userId = ?;';
    let values = [];
    values.push(lastSignInDate);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('用户签到7天重置天数' + err);
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


// 转正
exports.changleOfficial = function (userId, callback) {
    const sql = 'update newuseraccounts set official = 1 where Id = ?';
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
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
            connection.release();
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
exports.addBank = function (userId, account, name, cpf, bankType, ifsc , bankName, phone, email, callback) {
    const sql = 'call AddBankCard(?,?,?,?,?,?,?)';
    let values = [];

    values.push(userId);
    values.push(account);
    values.push(name);
    values.push(bankType ? bankType : '');
    values.push(cpf ? cpf : '');
    values.push(ifsc ? ifsc : '');
    values.push(bankName ? bankName : '');
    values.push(phone ? phone : '');
    values.push(email ? email : '');

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('addBank' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('editBank' + err);
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
exports.delBank = function (userId, cardId, callback) {
    const sql = 'DELETE FROM bankbindlist WHERE userId=? AND cardId=?';
    let values = [];
    values.push(userId);
    values.push(cardId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('delBank' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('获得用户银行卡' + err);
                callback(0);
            } else {
                callback(1, rows);
            }
        });
        values = [];
    });
}



//获得用户道具
exports.getPropByUserId = function (_userId, callback) {
    const sql = 'select * from prop_item where userid=?';
    let values = [];
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('getPropByUserId' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('getUseCoin' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('saveUserLog' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('AddGold' + err);
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

exports.AddDiamond = function (userInfo, callback) {
    const sql = 'call AddDiamond(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.adddiamond);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('AddDiamond' + err);
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
exports.AddGoldSub = function (userInfo, callback) {
    const sql = 'call AddGoldSub(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.addgold);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('AddGoldSub' + err);
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
exports.AddDiamondSub = function (userInfo, callback) {
    const sql = 'call AddDiamondSub(?,?,?)';
    let values = [];
    values.push(userInfo.userid);
    values.push(userInfo.diamond);
    values.push(userInfo.change_type);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('AddDiamondSub' + err);
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
            connection.release();
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
                        log.err('score_changeLog' + err);
                    }
                });
                values = [];
            }
        }
        connection.release();
    });
};

// 金币改变记录
exports.scoreChangeLog = function (userid, score_before, score_change, score_current, change_type, isOnline) {
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
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('scoreChangeLog' + err);
            }
            values = [];
        });
    });
};



// 银币改变记录
exports.silverCoinChangeLog = function (userid, silver_coin_before, silver_coin_change, silver_coin_current, change_type, isOnline) {
    const sql = "INSERT INTO silver_coin_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    let values = [];
    values.push(userid);
    values.push(silver_coin_before);
    values.push(silver_coin_change);
    values.push(silver_coin_current);
    values.push(change_type);
    values.push(isOnline);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('银币改变记录' + err);
            }
            values = [];
        });
    });
};

// 钻石改变记录
exports.diamondChangeLog = function (userid, diamond_before, diamond_change, diamond_current, change_type, isOnline) {
    const sql = "INSERT INTO diamond_changelog(userid,diamond_before,diamond_change,diamond_current,change_type,isOnline) VALUES(?,?,?,?,?,?)";
    let values = [];
    values.push(userid);
    values.push(diamond_before);
    values.push(diamond_change);
    values.push(diamond_current);
    values.push(change_type);
    values.push(isOnline);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('钻石改变记录' + err);
            }
            values = [];
        });
    });
};


//上下分记录
exports.insert_mark = function insert_mark(userInfo) {
    var sql = "INSERT INTO mark(userId,useCoin,winCoin,tax,gameId,serverId) VALUES(?,?,?,?,?,?)";
    var values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        for (let i = 0; i < userInfo.length; i++) {
            if (userInfo[i].userId > 15000) {
                values.push(userInfo[i].userId);
                values.push(userInfo[i].useCoin);
                values.push(userInfo[i].winCoin);
                values.push(userInfo[i].tax);
                values.push(userInfo[i].gameId);
                values.push(userInfo[i].serverId);

                connection.query({sql: sql, values: values}, function (err, rows) {
                    if (err) {
                        log.err('insert_mark' + err);
                    }
                });
                values = [];
            }
        }
        connection.release();
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
            connection.release();
            callback_c(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('getLotteryLog' + err);
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
            connection.release();
            callback_c(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('mark' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateProp' + err);
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




//更新充值数据
exports.updateRecharge = function updateRecharge(out_trade_no, callback) {
    const sql = "call updateRecharge(?)";
    let values = [];

    values.push(out_trade_no);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新充值数据' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('已领取新手礼包' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新充值数据' + err);
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
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateFirstexchange' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('保存金币记录' + err);
            } else {
                callback(1, rows.insertId);
            }
        });
        values = [];
    });
};

//查询金币记录
exports.selectcoinlog = function (userid, callback) {
    let sql = "select * from sendcoinlog where userId = ?";
    let values = [];
    values.push(userid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询金币记录' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('selectcoinlog' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateFirstexchange' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('searchAccountByDeviceCode' + err);
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


// 保存打点基础数据
exports.saveDot = function (userId, adid, gps, apptoken, gameInfo, callback) {
    pool.getConnection(function (err, connection) {
        // 先查询 userId 是否存在
        connection.query('SELECT userId FROM dot_base_data WHERE userId = ?', [userId], function (error, results, fields) {
            if (error) {
                connection.release();
                callback(0)
                return;
            }
            // 如果 userId 存在，则更新数据
            if (results.length > 0) {
                connection.query('UPDATE dot_base_data SET adid = ?, gps = ?, apptoken = ? WHERE userId = ?', [adid, gps, apptoken, userId], function (error, results, fields) {
                    connection.release();
                    if (error) {
                        callback(0)
                        return;
                    }
                    log.info('userId 存在打点数据，更新成功')
                    callback(1)
                });
            } else {
                // 如果 userId 不存在，则插入新数据
                connection.query('INSERT INTO dot_base_data (userId, adid, gps, apptoken) VALUES (?, ?, ?, ?)', [userId, adid, gps, apptoken], function (error, results, fields) {
                    connection.release();
                    if (error) {
                        callback(0)
                        return;
                    }
                    // 客户端第一次进来保存打点认为是注册，注册时候没有adid等，在这里打点
                    gameInfo.dot(userId, null, null, null, null, null , TypeEnum.DotNameEnum.register, ret =>{
                        if(ret){
                            log.info(userId + '游客注册打点成功');
                        }else{
                            log.info(userId + '游客注册打点失败');
                        }
                    })
                    log.info('userId 保存打点数据成功')
                    callback(1)
                });
            }
        });
    });
}



// 更新打点基础数据
exports.updateDot = function (userId, adid, gps, apptoken, callback) {
    const sql = "update dot_base_data set adid = ? ,gps = ?,apptoken = ? where userId = ?";
    let values = [];
    values.push(adid);
    values.push(gps);
    values.push(apptoken);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateDot' + err);
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


// 通过用户ID 查询打点基础数据
exports.searchDotByUserId = function (userId, callback) {
    const sql = "select userId, adid, gps, apptoken from dot_base_data where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('searchDotByUserId' + err);
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

exports.updateAccountByDeviceCode = function (deviceCode, account, callback) {
    const sql = "update newuseraccounts set device_code = ? where Account = ?";
    let values = [];
    values.push(deviceCode);
    values.push(account);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateAccountByDeviceCode' + err);
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
    const sql = "select firstRecharge, winScorePopFirstRecharge  from userinfo  where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('获取是否购买过首充' + err);
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




// 买过首充
exports.updateFirstRecharge = function (userId, callback) {
    const sql = "update userinfo set firstRecharge = 1 where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('买过首充' + err);
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

// 获取用户货币账户
exports.searchUserMoney = function searchUserMoney(userId, callback) {
    const sql = "select score,diamond, bankScore,luckyCoin, withdrawLimit from userinfo_imp  where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('获取用户货币账户' + err);
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
exports.lockBankScore = function lockBankScore(userId, bankScore, lockWithdrawLimit , callback) {
    const sql = "update userinfo_imp set bankScore = bankScore - ?, lockBankScore = lockBankScore + ?,  withdrawLimit = withdrawLimit - ?, lockWithdrawLimit = lockWithdrawLimit + ? where userId = ?";
    let values = [];
    values.push(bankScore);
    values.push(bankScore);
    values.push(lockWithdrawLimit);
    values.push(lockWithdrawLimit);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('锁定银行积分' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新提现订单支付状态' + err);
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
exports.unlockBankScore = function unlockBankScore(userId, bankScore, withdrawLimit , callback) {
    const sql = "update userinfo_imp set bankScore = bankScore + ?, lockBankScore = lockBankScore - ?,  withdrawLimit = withdrawLimit + ?, lockWithdrawLimit = lockWithdrawLimit - ? where userId = ?";
    let values = [];
    values.push(bankScore);
    values.push(bankScore);
    values.push(withdrawLimit);
    values.push(withdrawLimit);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('解锁银行积分' + err);
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


// 金币排行
exports.searchCoinRank = function (callback) {
    const sql = "SELECT u.userId, ut.nickname ,ut.headimgurl, u.score + u.bankScore AS totalCoin FROM userinfo_imp u JOIN newuseraccounts ut ON u.userId = ut.Id  ORDER BY totalCoin DESC";
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查金币排行' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows);
                }else{
                    callback(0);
                }
            }
        });
    });
}



// 充值排行
exports.searchRechargeRank = function (callback) {
    const sql = "select Id userId, nickname,headimgurl, weekRecharge as totalRecharge  from newuseraccounts order by totalRecharge desc";
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查充值排行' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows);
                }else{
                    callback(0);
                }
            }
        });
    });
}



// 大赢家排行
exports.searchBigWinToday = function (callback) {
    pool.getConnection(function (err, connection) {
        // 查询用户信息
        connection.query('SELECT Id AS userId, nickname, headimgurl FROM newuseraccounts', function (error, users, fields) {
            if (error){
                connection.release();
                callback(0)
                return;
            }
            // 查询最新的得分变化信息
            connection.query('SELECT userid, COALESCE(MAX(score_change), 0) AS winCoin FROM score_changelog WHERE change_type = 10 AND DATE(change_time) = CURRENT_DATE GROUP BY userid', function (error, scores, fields) {
                connection.release();
                if (error) {
                    callback(0)
                    return;
                }
                // 将用户信息和最新的得分变化信息合并
                const userScores = users.map(user => {
                    const score = scores.find(score => score.userid === user.userId);
                    return {
                        userId: user.userId,
                        nickname: user.nickname,
                        headimgurl: user.headimgurl,
                        winCoin: score ? score.winCoin : 0
                    };
                });
                // 对合并后的结果进行排序
                userScores.sort((a, b) => b.winCoin - a.winCoin);
                callback(userScores);
            });
        });
    })


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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新新手指引步数' + err);
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


// 更新银行指引步数
exports.saveBankGuideStep = function (userId, step, callback) {
    const sql = "update newuseraccounts set bankGuideStep = ? where Id = ?";
    let values = [];
    values.push(step);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新银行指引步数' + err);
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



// 查询银行指引步数
exports.searchBankGuideStep = function (userId, step, callback) {
    const sql = "select bankGuideStep from  newuseraccounts where Id = ?";
    let values = [];
    values.push(step);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询银行指引步数' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0].bankGuideStep);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}


exports.updateWinScorePopFirstRecharge = function (userId, callback) {
    const sql = "update userinfo set winScorePopFirstRecharge = 1 where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateWinScorePopFirstRecharge' + err);
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
exports.withdrawApplyRecord = function withdrawApplyRecord(userId, amount, account, bankType, name, cpf, ifsc, bankName, callbackUrl, orderId, lockBankScore, currencyType, callback) {
    const sql = "INSERT INTO withdraw_record(userId, amount, account, bankType, name, cpf, callbackUrl, orderId, lockBankScore, currencyType, ifsc, bankName) VALUES(?, ?, ?, ? , ?, ?, ?, ?, ?, ?, ?, ?)";

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
    values.push(ifsc);
    values.push(bankName);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0)
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('提现申请记录' + err);
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
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('通过订单查询提现申请记录' + err);
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



// 查询提现总额度
exports.searchTotalWithdraw = function (userId, callback) {
    const sql = "SELECT SUM(withdrawLimit) AS totalWithdrawLimit FROM ( select sum(promoteWithdrawLimit) withdrawLimit from pay_order po where userId = ? UNION ALL select sum(promoteWithdrawLimit) withdrawLimit from bet_record po where userId = ?) AS withdrawLimit";
    let values = [];
    values.push(userId);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询提现总额度' + err);
                callback(0)
                return;
            }
            if(rows && rows.length > 0 && rows[0].totalWithdrawLimit){
                callback(Number(rows[0].totalWithdrawLimit))
            }else{
                callback(0)
            }
        });
        values = [];
    });
}

// 提现额度使用
exports.AddUsedWithdrawLimit = function (userId, usedWithdrawLimit, callback) {
    const sql = "update userinfo_imp set usedWithdrawLimit = usedWithdrawLimit + ? where userId = ?";
    let values = [];
    values.push(usedWithdrawLimit);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('已使用提现额度累加' + err);
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
}


// 归还已使用额度
exports.ReduceUsedWithdrawLimit = function (userId, usedWithdrawLimit, callback) {
    const sql = "update userinfo_imp set usedWithdrawLimit = usedWithdrawLimit - ? where userId = ?";
    let values = [];
    values.push(usedWithdrawLimit);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('归还已使用额度' + err);
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
}

// 提现失败记录
exports.withdrawFailedRecord = function (userId, glodCoin, callback) {
    const sql = "INSERT INTO gameaccount.withdraw_failed (userId, goldVal) values (?,?)";
    let values = [];
    values.push(userId);
    values.push(glodCoin);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0)
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('withdrawFailedRecord' + err);
                callback(0)
                return;
            }
            if(rows){
                const newUserId = rows.insertId;
                callback(newUserId)
            }else{
                callback(0)
            }
        });
        values = [];
    });
}




// 查询已使用提现额度
exports.searchUsedWithdrawLimit = function (userId, callback) {
    const sql = "select usedWithdrawLimit from userinfo_imp where userId = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0)
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询已使用提现额度' + err);
                callback(0)
                return;
            }
            if(rows && rows.length > 0 && rows[0].usedWithdrawLimit){
                callback(Number(rows[0].usedWithdrawLimit))
            }else{
                callback(0)
            }
        });
        values = [];
    });
}

// 查询提现申请记录
exports.searchWithdrawApplyRecord = function (userId, callback) {
    const sql = "SELECT id, amount, create_time, account, bankType, name, status, orderId, pay_status payStatus FROM withdraw_record WHERE userId = ?";

    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询提现申请记录' + err);
                callback(0)
                return;
            }
            if(rows && rows.length > 0){
                callback(rows)
            }else{
                callback([])
            }
        });
        values = [];
    });
};

// 保存邮件记录
exports.saveEmail = function saveEmail(title, type, to_userid, from_userid, content_id, otherId, goods_type, callback) {
    const sql = "INSERT INTO email (title_id, `type`, to_userid, from_userid, content_id, otherId, goods_type) VALUES (?, ?, ?, ?, ?, ?, ?)";

    let values = [];
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
            connection.release();
            callback(0)
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('保存邮件记录' + err);
                callback(0)
            }else{
                callback(1)
            }
        });
        values = [];
    });
};

//查询邮件记录
exports.selectEmail = function (types, toUserId, callback) {
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        getEmail(types, toUserId, connection).then((results) => {
            callback(1, results)
        }).catch((err) => {
            log.err(err)
            callback(0)
        });
    });
};

function getEmail(typeParam, toUserId, connection) {
    return new Promise((resolve, reject) => {
        const types = typeParam.split(',');
        const len = types.length;
        const promises = [];

        // 循环执行查询并处理结果
        types.forEach(type => {
            let query = '';

            switch (type) {
                case '0':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, b.transfer_bank_score rewardGoldVal, 0 rewardDiamondVal, e.isRead status, -1 rankType, -1 \`rank\`, null orderId FROM gameaccount.email e LEFT JOIN gameaccount.log_bank_transfer b ON e.to_userid = b.to_userid AND e.otherId = b.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 0 AND e.to_userid = ${toUserId}`;
                    break;
                case '1':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, b.rebate_glod rewardGoldVal, 0 rewardDiamondVal, e.isRead status, -1 rankType, -1 \`rank\`, null orderId FROM gameaccount.email e LEFT JOIN ym_manage.agent_rebate b ON e.otherId = b.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 1 AND e.to_userid = ${toUserId}`;
                    break;
                case '2':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, r.rewardGoldVal, r.rewardDiamondVal, r.status, -1 rankType, -1 \`rank\`, null orderId FROM gameaccount.email e LEFT JOIN gameaccount.first_recharge_award r ON e.otherId = r.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 2 AND e.to_userid = ${toUserId}`;
                    break;
                case '3':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, r.val rewardGoldVal, 0 rewardDiamondVal, r.status, r.type rankType, r.\`rank\`, null orderId FROM gameaccount.email e LEFT JOIN gameaccount.rank_award r ON e.otherId = r.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 3 AND e.to_userid = ${toUserId}`;
                    break;
                case '4':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, 0 rewardGoldVal, 0 rewardDiamondVal, 0 status, 0 rankType, 0 \`rank\`, r.orderId FROM gameaccount.email e LEFT JOIN gameaccount.withdraw_success r ON e.otherId = r.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 4 AND e.to_userid = ${toUserId}`;
                    break;
                case '5':
                    query = `SELECT e.id, e.isRead, e.title_id titleId, e.content_id contentId, e.type, e.createTime, e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, r.goldVal rewardGoldVal, 0 rewardDiamondVal, 0 status, 0 rankType, 0 \`rank\`, null orderId FROM gameaccount.email e LEFT JOIN gameaccount.withdraw_failed r ON e.otherId = r.id LEFT JOIN gameaccount.newuseraccounts n ON e.from_userid = n.Id WHERE e.type = 5 AND e.to_userid = ${toUserId}`;
                    break;
                default:
                    break;
            }

            promises.push(new Promise((resolve, reject) => {
                // 执行查询
                connection.query(query, (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            }));
        });

        // 等待所有查询完成后处理结果
        Promise.all(promises)
            .then(results => {
                // 合并所有查询结果
                const mergedResults = results.reduce((acc, val) => acc.concat(val), []);
                connection.release();
                resolve(mergedResults);
            })
            .catch(err => {
                connection.release();
                reject(err)
            });
    });
}


// 查询邮件类型
exports.selectEmailTypes = function selectEmailTypes(userId, callback) {
    const sql = "select DISTINCT `type` from email where to_userid = ? ";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询邮件类型' + err);
            } else {
                if (rows && rows.length > 0) {
                    const types = rows.map(obj => Number(obj.type)).join(',');
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('设置邮件为已读' + err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};

// 设置邮件为已读
exports.setEmailisAlllReadByUserId = function (userId, callback) {
    const sql = "update email set isRead = 1 where to_userid = ?";
    let values = [];

    values.push(userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('设置用户全部邮件为已读' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('删除指定邮件' + err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};

// 查询是否有未读邮件
exports.searchUnReadEmail = function (userId, callback) {
    const sql = "select * from email where isRead = 0 and to_userid = ?";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('查询是否有未读邮件' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询是否有未读邮件' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}



// 查询邮件
exports.searchUserEmailById = function (id, userId, callback) {
    const sql = "select * from email where id = ? and to_userid = ?";
    let values = [];
    values.push(id);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('查询邮件' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询邮件' + err);
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


// 查询排行榜奖励类型邮件
exports.searchEmailFirstRechargeAward = function (otherId, callback) {
    const sql = "select  r.rewardGoldVal, r.rewardDiamondVal from email e left join first_recharge_award  r on e.otherId = r.id where e.otherId = ?";
    let values = [];
    values.push(otherId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('查询排行榜奖励类型邮件' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询排行榜奖励类型邮件' + err);
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



// 更新排行榜奖励领取状态
exports.updateEmailRankAwardStatus = function (ids, callback) {
    const sql = "update rank_award set status = 1 where id in (?) ";
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('更新排行榜奖励领取状态' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: [ids]}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新排行榜奖励领取状态' + err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
    });
}


// 更新首充奖励奖励领取状态
exports.updateFirstRechargeAwardStatus = function (ids, callback) {
    const sql = "update first_recharge_award set status = 1 where id in (?) ";
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('updateFirstRechargeAwardStatus' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: [ids]}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateFirstRechargeAwardStatus' + err);
                callback(0);
            } else {
                if(rows){
                    callback(1);
                }else{
                    callback(0);
                }
            }
        });
    });
}



exports.selectEmailRankAwardByUser = function (userId, callback) {
    const sql = "select * from rank_award where status = 0 and userId = ? ";
    let values = [];
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('selectEmailRankAwardByUser' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('selectEmailRankAwardByUser' + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows);
                }else{
                    callback(0);
                }
            }
        });
        values = [];
    });
}

exports.updateEmailRankAwardStatusByUser = function (userId, type, callback) {
    const sql = "update rank_award set status = 1 where type = ? and userId = ? ";
    let values = [];
    values.push(type);
    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('updateEmailRankAwardStatusByUser' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('updateEmailRankAwardStatusByUser' + err);
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

// 查询首充持续奖励类型邮件
exports.searchEmailRankAward = function (otherId, callback) {
    const sql = "select r.`type` rankType ,r.val rewardGoldVal, r.status  from email e left join rank_award r on e.otherId = r.id where e.otherId = ?";
    let values = [];
    values.push(otherId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('查询首充持续奖励类型邮件' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询首充持续奖励类型邮件' + err);
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
                log.err('删除全部已读' + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询系统邮件记录' + err);
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


exports.sendcoinServer = function sendcoinServer(userid, sendCoin, callback) {
    var sql = 'call sendcoinServer(?,?)';
    var values = [];

    values.push(userid);
    values.push(sendCoin);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('sendcoinServer' + err);
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
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('saveLineOut' + err);
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
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('deleteLineOut' + err);
            }
        })
        values = [];
    });
}


exports.clenaLineOut = function () {
    const sql = 'DELETE FROM lineout';
    let values = [];
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('clenaLineOut' + err);
            }
        })
        values = [];
    });
}



//获取金币
exports.getScore = function getScore(_userId, callback) {
    const sql = "select * from userinfo_imp where userId = ?";
    let values = [];

    values.push(_userId);
    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("获取金币" + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("增加金币" + err);
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



// 减少金币
exports.reduceAccountScore = function reduceAccountScore(_userId, score, callback) {
    const sql = "UPDATE userinfo_imp SET score = CASE WHEN score >= ? THEN score - ? ELSE score END WHERE userId = ?;";
    let values = [];
    values.push(score);
    values.push(score);
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("减少金币" + err);
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


// 增加钻石
exports.addAccountDiamond = function (_userId, diamond, callback) {
    const sql = "update userinfo_imp set diamond = diamond + ? where userId = ?";
    let values = [];
    values.push(diamond);
    values.push(_userId);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("增加钻石" + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("changeOfficial" + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("addcharLog" + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("getcharLog" + err);
                callback(0);
            } else {
                callback(1, rows);
            }
        })
        values = [];
    });
}


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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("updateCharLog" + err);
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("selectServerLog" + err);
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
                log.err("查询金币排行榜" + err);
                callback(0);
            } else {
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log("getCoinRank");
                console.log(err);
                log.err("查询钻石排行榜" + err);
                callback(0);
            } else {
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
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询邀请码" + err);
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


// 批量查询用户信息
exports.bathchSearchUserInfo = function bathchSearchUserInfo(userIds, callback) {
    const sql = 'SELECT a.*,b.*, c.* FROM newuseraccounts a LEFT JOIN userinfo_imp b ON a.`Id` = b.`userId` LEFT JOIN userinfo c ON a.`Id` = c.`userId`  WHERE a.ID in (?)';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: userIds}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("批量查询用户信息" + err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        });
    });
};



//排行榜奖励记录
exports.rankAwardRecord = function (userId, type, goodsType, val, rank_start_time, rank_end_time, rank, callback) {
    const sql = 'INSERT INTO rank_award (userId, `type`, goods_type, val, rank_start_time, rank_end_time, rank) VALUES(?, ?, ?, ?, ?, ?, ?)';
    let values = [];

    values.push(userId);
    values.push(type);
    values.push(goodsType);
    values.push(val);
    values.push(new Date(rank_start_time));
    values.push(new Date(rank_end_time));
    values.push(rank);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("排行榜奖励记录" + err);
                callback(0);
            } else {
                const newUserId = rows.insertId;
                callback(newUserId);
            }
        })
        values = [];
    });
}



//首充持续奖励记录
exports.firstRechargeAwardRecord = function (userId, rewardGoldVal, rewardDiamondVal, rewardDateTimestamp, callback) {
    const sql = 'INSERT INTO first_recharge_award (userId, rewardGoldVal, rewardDiamondVal, rewardDate) VALUES(?, ?, ?, ?)';
    let values = [];

    values.push(userId);
    values.push(rewardGoldVal);
    values.push(rewardDiamondVal);
    values.push(new Date(rewardDateTimestamp));

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("首充持续奖励记录" + err);
                callback(0);
            } else {
                callback(1);
            }
        })
        values = [];
    });
}



// 查询当日应发的首充持续奖励
exports.searchfirstRechargeAwardRecord = function (callback) {
    const sql = 'select * from gameaccount.`first_recharge_award` where rewardDate = ? and status = 0';
    let values = [];
    const currentDate = new Date();
    const currentDateTimestamp = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    values.push(new Date(currentDateTimestamp));

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询当日应发的首充持续奖励" + err);
                callback(0);
            } else {
               if(rows && rows.length > 0){
                   callback(rows);
               }else{
                   callback(0);
               }
            }
        })
        values = [];
    });
}


exports.searchfirstRechargeAwardRecordByUser = function (userId, callback) {
    const sql = 'select * from gameaccount.`first_recharge_award` where userId = ? and status = 0 and rewardDate < ?';
    let values = [];
    values.push(userId);
    values.push(new Date().getTime());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("searchfirstRechargeAwardRecordByUser" + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows);
                }else{
                    callback(0);
                }
            }
        })
        values = [];
    });
}




exports.searchCountryConf = function (callback) {
    const sql = 'select * from gameaccount.`country_conf` where isUsed = 1 order by update_time desc limit 1';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("searchCountryConf" + err);
                callback(0);
            } else {
                if(rows && rows.length > 0){
                    callback(rows[0]);
                }else{
                    callback(0);
                }
            }
        })
    });
}


