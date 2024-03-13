const mysql = require('mysql2');
const mysql_config = require("../../util/config/mysql_config");

const pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'gameaccount',
    charset: "utf8mb4",
});

//查询用户id
exports.getUserCtrl = function getUserCtrl(userId, callback) {
    var sql = 'SELECT * FROM usermoneyctrl WHERE userId=?';
    var values = [];

    values.push(userId);

    pool.getConnection(function (err, connection) {
        if(connection){
            connection.query({sql: sql, values: values}, function (err, rows) {
                connection.release();
                if (err) {
                    console.log("getUserId");
                    console.log(err);
                    callback(0);
                } else {
                    if (rows.length === 0) {
                        callback(0);
                    } else {
                        callback(1, rows[0]);
                    }
                }
            });
        }else{
            callback(0);
        }
        values = [];
    });
};
