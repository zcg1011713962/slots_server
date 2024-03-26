var mysql = require('mysql2');
var async = require('async');
var gameConfig = require("./../config/gameConfig");
var mysql_config = require("./../../util/config/mysql_config");

var pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'la_ba'
});


//获得免费次数
exports.getFreeCount = function getFreeCount(userInfo, callback_c) {

    pool.getConnection(function (err, connection) {

        var values = [];
        values.push(parseInt(gameConfig.gameId.toString() + userInfo.toString()));

        async.waterfall([
            function (callback) {
                var sql = "select * from useraccounts where Id=?";
                connection.query({sql: sql, values: values}, function (err, rows) {
                    //values = [];
                    if (err) {
                        console.log(err);
                        callback(err);
                        //callback(0);
                    } else {
                        callback(null, rows);
                    }
                })

            },
            function (arg1, callback) {
                if (!arg1.length) {
                    var sql = "INSERT INTO useraccounts(Id) VALUES(?)";
                    connection.query({sql: sql, values: values}, function (err, rows) {
                        values = [];
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {
                            var Result = {Id: userInfo._userId, freeCount: 0, LotteryCount: 0};
                            //console.log("插入");
                            callback(null, Result);
                        }
                    })
                } else {
                    callback(null, arg1[0]);
                }

            }
        ], function (err, result) {
            // result now equals 'done'
            //console.log(result)
            if (err) {
                console.log(err);
                console.log(result);
                callback_c(0);
            } else {
                callback_c(1, result);
            }
            //console.log("1end");

            connection.release();
            values = [];
        });
    });
};

//保存免费次数
exports.saveFree = function saveFree(userInfo, callback) {

    var sql = "UPDATE useraccounts SET freeCount=?,LotteryCount=? WHERE Id =?";
    var values = [];

    values.push(userInfo.freeCount);
    values.push(userInfo.LotteryCount);
    values.push(parseInt(gameConfig.gameId.toString() + userInfo.userId.toString()));
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            if (err) {
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });

        connection.release();
        values = [];

    });
};


//摇奖记录
exports.lotteryLog = function lotteryLog(userInfo, callback) {
    var sql = `INSERT INTO lotterylog_${gameConfig.gameId}(userid,bet,line_s,score_before,score_linescore,score_win,score_current,free_count_before,free_count_win,free_count_current,result_array,mark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`;
    var values = [];

    pool.getConnection(function (err, connection) {
        for (var i = 0; i < userInfo.length; i++) {
            values.push(userInfo[i].userid);
            values.push(userInfo[i].bet);
            values.push(userInfo[i].lines);
            values.push(userInfo[i].score_before);
            values.push(userInfo[i].score_linescore);
            values.push(userInfo[i].score_win);
            values.push(userInfo[i].score_current);
            values.push(userInfo[i].free_count_before);
            values.push(userInfo[i].free_count_win);
            values.push(userInfo[i].free_count_current);
            values.push(userInfo[i].result_array);

            if (userInfo[i].free_count_before > 0 && userInfo[i].score_win == 0) {
                values.push(1);
            } else {
                values.push(0);
            }

            connection.query({sql: sql, values: values}, function (err, rows) {
                if (err) {
                    console.log("lotteryLog");
                    console.log(err);
                }
            });
            values = [];
        }


        connection.release();
        values = [];

    });

};

//奖池记录
exports.Update_score_pool = function Update_score_pool(poollist, Virtualpool, poollistId, callback) {
    var sql = "UPDATE score_pool SET score_pool=? WHERE id = ?";

    pool.getConnection(function (err, connection) {
        for (var i = 0; i <= poollistId.length; ++i) {
            var values = [];
            if (i != poollistId.length) {
                values.push(poollist[i]);
                values.push(poollistId[i]);
            } else {
                values.push(Virtualpool);
                values.push(0);
            }

            console.log(values);

            connection.query({sql: sql, values: values}, function (err, rows) {
                if (err) {
                    console.log(err);
                }

            })

        }
        //callback();
        connection.release();

    });
};

//获得奖池最新记录
exports.getScore_pools = function getScore_pools(callback) {
    var sql = "SELECT * FROM score_pool";
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql}, function (err, rows) {
            if (err) {
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(rows);
                }
            }
        });
        connection.release();

    });
};


//===========================================================================================================================================================
//获得拉霸水位和库存 奖池最新记录
exports.getGamblingGame = function getGamblingGame(callback) {

    var sql = "SELECT * FROM gambling_game_list WHERE nGameID = ?";
    var values = [];
    values.push(gameConfig.gameId);
    pool.getConnection(function (err, connection) {

        connection.query({sql: sql, values: values}, function (err, rows) {
            if (err) {
                console.log(err);
                callback(0);
            } else {
                if (rows.length == 0) {
                    callback(0);
                } else {
                    callback(rows);
                }
            }
        });
        connection.release();

    });
};

//保存库存奖池
exports.Update_GamblingBalanceGold = function Update_GamblingBalanceGold(nGamblingBalanceGold, nSysBalanceGold, callback) {
    var sql = "UPDATE gambling_game_list SET nGamblingBalanceGold=?,nSysBalanceGold= ?  WHERE nGameID = ?";

    pool.getConnection(function (err, connection) {
        const values = [nGamblingBalanceGold, nSysBalanceGold, gameConfig.gameId];
        console.log("库存 id");
        console.log(values);
        connection.query({sql: sql, values: values}, function (err, rows) {
            if (err) {
                console.log(err);
            }
        });

        connection.release();

    });
};



