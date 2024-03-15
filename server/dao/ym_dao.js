const mysql = require('mysql2');
const log = require("../../CClass/class/loginfo").getInstand;
const mysql_config = require("../../util/config/mysql_config");


const pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'ym_manage',
    charset: "utf8mb4",
});



// 兑换码查询
exports.cdKeySearch = function cdKeySearch(cdKeyNum, callback){
    const sql = 'select * from cdkey c where `number` = ?';
    const values = []
    values.push(cdKeyNum);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('兑换码查询', err);
                callback(0);
            } else {
                if (rows.length === 0) {
                    callback(0);
                } else {
                    callback(rows[0]);
                }
            }
        })
    });
}


// 兑换卷领取
exports.cdKeyGet = function cdKeyGet(userId ,cdKeyNum, callback){
    const sql = 'update ym_manage.cdkey set status = 1, use_id = ?, use_time = ? where `number` = ? ';
    const values = []
    values.push(userId);
    values.push(new Date());
    values.push(cdKeyNum);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('兑换卷领取'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}


// 绑定邀请码
exports.bindIniteCode = function bindIniteCode(invite_uid ,invitee_uid, callback){
    const sql = 'INSERT INTO ym_manage.account_invites(invite_uid, invitee_uid, created_at) VALUES(?, ?, ?)';
    const values = []
    values.push(invite_uid);
    values.push(invitee_uid);
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('绑定邀请码'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}



// 解绑邀请码
exports.removeBindIniteCode = function removeBindIniteCode(invite_uid ,invitee_uid, callback){
    const sql = 'delete from account_invites where invite_uid = ? and invitee_uid = ?';
    const values = []
    values.push(invite_uid);
    values.push(invitee_uid);
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('解绑邀请码'+ err);
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


// 增加邀请人数
exports.addAccountInvite = function addAccountInvite(invite_uid ,invitee_uid, callback){
    const sql = 'INSERT INTO ym_manage.account_invites(invite_uid, invitee_uid, created_at) VALUES(?, ?, ?)';
    const values = []
    values.push(invite_uid);
    values.push(invitee_uid);
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('绑定邀请码'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}


// 查询发送邀请的用户
exports.searchInviteUser = function searchInviteUser(userId, callback){
    const sql = 'select invite_uid from ym_manage.account_invites where invitee_uid = ?';
    const values = []
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
                log.err('查询发送邀请的用户'+ err);
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




// 查询未领取返点记录表
exports.searchInviteSend = function searchInviteSend(userId, callback){
    const sql = 'select id,rebate_glod from agent_rebate  where invite_uid = ? and status = 0';
    const values = []
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
                log.err('查询未领取返点记录表'+ err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}




// 代理返点记录
exports.agentRebateRecord = function agentRebateRecord(invite_uid ,invitee_uid, currencyType, currencyVal ,rebateGlod, type, status, callback){
    const sql = 'INSERT INTO agent_rebat (invite_uid, invitee_uid, currency_type, currency_val,rebate_glod, created_at, `type`, `status`) VALUES( ?, ?, ?, ?,?,?,?,?)';
    const values = []
    values.push(invite_uid);
    values.push(invitee_uid);
    values.push(currencyType);
    values.push(currencyVal);
    values.push(rebateGlod);
    values.push(new Date());
    values.push(type);
    values.push(status);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('新增代理返点记录'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}


// 查询代理返点记录
exports.searchAgentRebateRecord = function searchAgentRebateRecord(invite_uid , callback){
    const sql = 'select * from agent_rebate where invite_uid = ?';
    const values = []
    values.push(invite_uid);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询代理返点记录'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}


// 更新代理返点记录状态
exports.agentUpdateRebateById = function agentGetRebateById(ids , status, callback){
    const sql = 'update agent_rebate set status = ? where id in (?)';
    const values = []
    values.push(status);
    values.push(ids);

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('更新代理返点记录状态'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}


// 代理人领取返点记录
exports.agentGetRebateRecord = function agentGetRebateRecord(userId, glodSum, callback){
    const sql = 'INSERT INTO agent_get_rebate_record (invite_uid, rebate_glod, created_at) VALUES(?, ?, ?)';
    const values = []
    values.push(userId);
    values.push(glodSum);
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('代理人领取返点记录'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}



// 查询代理人团队奖励详情
exports.inviteDetail = function inviteDetail(userId, callback){
    const sql = 'call InviteDetail(?)';
    const values = []
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
                log.err('代理人领取返点记录'+ err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows[0][0]);
                } else {
                    callback(0);
                }
            }
        })
    });
}



// 查询代理人领取返点记录
exports.searchAgentGetRebateRecord = function searchAgentGetRebateRecord(userId, callback){
    const sql = 'select * from  agent_get_rebate_record where invite_uid = ?';
    const values = []
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
                log.err('查询代理人领取返点记录'+ err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}




// 查询客服信息
exports.searchCustomerServiceInfo = function searchCustomerServiceInfo(userId, callback){
    const sql = 'select * from kefu_list';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('查询客服信息'+ err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}



// 记录反馈内容
exports.insertFeedback = function insertFeedback(userId,content, callback){
    const sql = 'INSERT INTO feedback(user_id, content, created_at)VALUES(?, ? , ?)';
    const values = []
    values.push(userId);
    values.push(content);
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql , values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('记录反馈内容'+ err);
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


// 联系我们-查询问题和答案
exports.searchIssue = function searchIssue(callback){
    const sql = 'SELECT id, title, content, created_at FROM issue';

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('联系我们-查询问题和答案'+ err);
                callback(0);
            } else {
                if (rows) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
        })
    });
}




// 查询代理当日是否邀请过人
exports.searchCurrDayInvite = function searchCurrDayInvite(userId, callback){
    const sql = 'select count(1) from account_invite_sends where uid = ? and DATE(created_at) = CURDATE();';
    const values = []
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
                log.err('查询代理当日是否邀请过人'+ err);
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



// 推广奖励表 新增奖励记录
exports.insertInviteSends = function insertInviteSends(userId, gold, callback){
    const sql = 'INSERT INTO account_invite_sends(uid, gold, created_at, updated_at) VALUES(?, ?, ?, ?);';
    const values = []
    values.push(userId);
    values.push(gold);
    values.push(new Date());
    values.push(new Date());

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('获取数据库连接失败' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                log.err('推广奖励表 新增奖励记录'+ err);
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


// 推广奖励表 增加邀请人数 累计奖励
exports.addInviteSends = function addInviteSends(userId, gold, callback){
    const sql = 'update account_invite_sends set `number` = `number` + 1, gold = gold + ? where uid = ?;';
    const values = []
    values.push(gold);
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
                log.err('推广奖励表 新增奖励记录'+ err);
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