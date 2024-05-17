const mysql = require('mysql2');
const async = require('async');
const mysql_config = require("./../../util/config/mysql_config");
const {getInstand: log} = require("../../CClass/class/loginfo");

const pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'la_ba'
});


//获得免费次数
exports.getFreeCount = function (gameId, userInfo, callback_c) {
    pool.getConnection(function (err, connection) {
        let values = [];
        values.push(parseInt(gameId.toString() + userInfo.toString()));
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
            if (err) {
                console.log(err);
                console.log(result);
                callback_c(0);
            } else {
                callback_c(1, result);
            }
            connection.release();
            values = [];
        });
    });
};

//保存免费次数
exports.saveFree = function (gameId, userInfo, callback) {
    const sql = "UPDATE useraccounts SET freeCount=?,LotteryCount=? WHERE Id =?";
    let values = [];
    values.push(userInfo.freeCount);
    values.push(userInfo.LotteryCount);
    values.push(parseInt(gameId.toString() + userInfo.userId.toString()));
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};



//保存免费次数
exports.saveDigDigDiggerFree = function (gameId, userInfo, callback) {
    const sql = "UPDATE useraccounts SET freeCount=?,LotteryCount=?,gameDict=? WHERE Id =?";
    let values = [];
    values.push(userInfo.freeCount);
    values.push(userInfo.LotteryCount);
    values.push(userInfo.gameDict);
    values.push(parseInt(gameId.toString() + userInfo.userId.toString()));
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


//增加免费次数
exports.addFreeCount = function (gameId, userId, freeCount, callback) {
    const sql = "UPDATE useraccounts SET freeCount= freeCount + ? WHERE Id =?";
    let values = [];
    values.push(freeCount);
    values.push(parseInt(gameId.toString() + userId.toString()));
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
}

//增加减少免费次数
exports.reduceFreeCount = function (gameId, userId, callback) {
    const sql = "UPDATE useraccounts SET freeCount = freeCount - 1 WHERE Id =?";
    let values = [];
    values.push(parseInt(gameId.toString() + userId.toString()));
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log(err);
                callback(0);
            } else {
                callback(1);
            }
        });
        values = [];
    });
};


//摇奖记录
exports.lotteryLog = function lotteryLog(gameId, userInfo, callback) {
    const sql = `INSERT INTO lotterylog_${gameId}(userid,bet,line_s,score_before,score_linescore,score_win,score_current,free_count_before,free_count_win,free_count_current,result_array,mark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`;
    const values = [];

    pool.getConnection(function (err, connection) {
        if(err){
            if(connection) connection.release();
            log.err('lotteryLog' + err);
            return;
        }
        for (let i = 0; i < userInfo.length; i++) {
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
            if (userInfo[i].free_count_before > 0 && userInfo[i].score_win === 0) {
                values.push(1);
            } else {
                values.push(0);
            }
        }
        connection.query({sql: sql, values: values}, function (err, rows) {
            try{
                connection.release();
                if (err) {
                    log.err("lotteryLog");
                    log.err(err);
                }
            }catch (e){
                if(connection) connection.release();
                log.err(e);
            }
        });
    });

};


//===========================================================================================================================================================
//获得拉霸水位和库存 奖池最新记录
exports.getGamblingGame = function getGamblingGame(callback) {
    const sql = "SELECT * FROM gambling_game_list WHERE nGameID = ?";
    const values = [];
    values.push(gameConfig.gameId);
    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
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
    });
};

//保存库存奖池
exports.Update_GamblingBalanceGold = function Update_GamblingBalanceGold(nGamblingBalanceGold, nSysBalanceGold, callback) {
    const sql = "UPDATE gambling_game_list SET nGamblingBalanceGold=?,nSysBalanceGold= ?  WHERE nGameID = ?";
    pool.getConnection(function (err, connection) {
        const values = [nGamblingBalanceGold, nSysBalanceGold, gameConfig.gameId];
        console.log("用户库存 系统库存 游戏ID");
        console.log(values);
        connection.query({sql: sql, values: values}, function (err, rows) {
            connection.release();
            if (err) {
                console.log(err);
            }
        });
    });
};



// 插入图案组合
exports.insertBatchCards = function (batchData, gameId) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO cards_' + gameId + ' (card, mul, free, jackpot, openBox) VALUES ?';
        const values = batchData.map(item => [JSON.stringify(item.nHandCards), item.mul, item.free, item.jackpot, item.openBox]);
        pool.getConnection(function (err, connection) {
            if(err){
                log.err('插入图案组合' + err);
                connection.release();
                reject(err);
                return;
            }
            connection.query({sql: sql, values: [values]}, function (err, rows) {
                connection.release();
                if (err) {
                    log.err("插入图案组合" + err);
                }
                resolve(1);
            })
        });
    })
}


exports.searchCardsGroupByMul = function (gameId, callback) {
    const sql = 'SELECT mul,GROUP_CONCAT(card SEPARATOR \'|\') AS cards FROM cards_' + gameId + ' GROUP BY mul';
    pool.getConnection(function (err, connection) {
        if(err){
            connection.release();
            log.err('查询图案组合' + err);
            callback(0);
            return;
        }
        connection.query({sql: sql, values: []}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("查询图案组合" + err);
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


exports.handCardsMuls = function (gameId, callback) {
    const sql = 'select DISTINCT mul from la_ba.cards_'+ gameId;
    pool.getConnection(function (err, connection) {
        if(err){
            connection.release();
            log.err('handCardsMuls' + err);
            return;
        }
        connection.query({sql: sql, values: []}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("handCardsMuls" + err);
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

exports.minMulCards = function (gameId, callback) {
    pool.getConnection(function (err, connection) {
        // 第一次查询，获取满足条件的最小 mul 值
        connection.query('SELECT MIN(mul) AS min_mul FROM la_ba.cards_'+ gameId +' WHERE `free` = 0 AND jackpot = 0 AND openBox = 0', function (error, results, fields) {
            if (error) {
                connection.release();
                callback(0);
                return;
            }
            // 提取最小 mul 值
            const minMul = results[0].min_mul;
            // 第二次查询，根据最小 mul 值获取对应的记录
            connection.query('SELECT * FROM la_ba.cards_'+ gameId +' WHERE `free` = 0 AND jackpot = 0 AND openBox = 0 AND mul = ?', [minMul], function (error, results, fields) {
                connection.release();
                if (error) {
                    callback(0);
                    return;
                }
                // 处理结果
                callback(results);
            });
        });
    })
}



exports.handCardsByMuls = function (gameId, muls, hitFree, hitBonus, winJackpot, callback) {
    const sql = 'select card from  la_ba.cards_'+ gameId +' where mul in (?) and `free` = ? and jackpot = ? and openBox = ?';

    let valuse = [];
    valuse.push(muls)
    valuse.push(hitFree ? 1 : 0)
    valuse.push(winJackpot > 0 ? 1 : 0)
    valuse.push(hitBonus ? 1 : 0)

    pool.getConnection(function (err, connection) {
        if(err){
            log.err('handCardsByMuls' + err);
            connection.release();
            callback(0);
            return;
        }
        connection.query({sql: sql, values: valuse}, function (err, rows) {
            connection.release();
            if (err) {
                log.err("handCardsByMuls" + err);
                callback(0);
            } else {
                if (rows && rows.length > 0) {
                    callback(rows);
                } else {
                    callback(0);
                }
            }
            valuse = [];
        })
    });
}



exports.syncHandCardsByMuls = function (gameId, muls, hitFree, hitBonus, winJackpot) {
    return new Promise((resolve, reject) => {
        const sql = 'select card from  la_ba.cards_' + gameId + ' where mul in (?) and `free` = ? and jackpot = ? and openBox = ?';

        let valuse = [];
        valuse.push(muls)
        valuse.push(hitFree ? 1 : 0)
        valuse.push(winJackpot > 0 ? 1 : 0)
        valuse.push(hitBonus ? 1 : 0)

        pool.getConnection(function (err, connection) {
            if (err) {
                log.err('handCardsByMuls' + err);
                reject(0);
                connection.release();
                return;
            }
            connection.query({sql: sql, values: valuse}, function (err, rows) {
                connection.release();
                if (err) {
                    log.err("handCardsByMuls" + err);
                    reject(0);
                } else {
                    if (rows && rows.length > 0) {
                        resolve(rows);
                    } else {
                        resolve(0);
                    }
                }
                valuse = [];
            })
        });
    })
}



