const mysql = require('mysql');
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
exports.cdKeyGet = function cdKeyGet(cdKeyNum, callback){
    const sql = 'update ym_manage.cdkey set status = 1, use_time = ? where `number` = ? ';
    const values = []
    values.push(new Date());
    values.push(cdKeyNum);

    pool.getConnection(function (err, connection) {
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