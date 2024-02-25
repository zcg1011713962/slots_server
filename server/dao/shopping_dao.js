let mysql = require('mysql');
let mysql_config = require("../../util/config/mysql_config");

let pool = mysql.createPool({
    connectionLimit: 10000,
    host: mysql_config.host,
    user: mysql_config.user,
    password: mysql_config.password,
    port: mysql_config.port,
    database: 'game_shopping'
});

//查询商品列表
exports.selectShopList = function selectShopList(callback) {
    let sql = "SELECT * FROM shop_item where deleted = 0";
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


//插入新的商品信息
exports.insertNewGoods = function insertNewGoods(_info, callback) {
    let sql = "REPLACE INTO shop_item(id,goodsName,goodsType,goodsDescribe,goodsUrl,goodsNum,goodsPrice) VALUES(?,?,?,?,?,?,?)";
    let values = [];
    values.push(_info.id);
    values.push(_info.goodsName);
    values.push(_info.goodsType);
    values.push(_info.goodsDescribe);
    values.push(_info.goodsUrl);
    values.push(_info.goodsNum);
    values.push(_info.goodsPrice);

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
    });
};

//删除商品信息
exports.delGoods = function delGoods(_info, callback) {
    let sql = "DELETE FROM shop_item WHERE id = ?";
    let values = [];
    values.push(_info.id);

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

    });
};

//查询商品信息
exports.selectGoodsInfo = function selectGoodsInfo(id, callback) {
    let sql = "SELECT * FROM shop_item WHERE id = ?";
    let values = [];
    values.push(id);
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

//更新商品信息
exports.updateGoodsInfo = function updateGoodsInfo(id, goodsNum, callback) {
    let sql = "UPDATE shop_item SET goodsNum=? WHERE Id =?";
    let values = [];
    values.push(goodsNum);
    values.push(id);
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

    });
};

//查询收货信息
exports.selectshouhuoInfo = function selectshouhuoInfo(userId, callback) {
    let sql = "SELECT * FROM player_info WHERE playerId = ?";
    let values = [];
    values.push(userId);
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

//插入收货信息
exports.newshouhuoInfo = function newshouhuoInfo(userId, address, userName, phone, callback) {
    let sql = "REPLACE INTO player_info(playerId,address,playerName,phone) VALUES(?,?,?,?)";
    let values = [];
    values.push(userId);
    values.push(address);
    values.push(userName);
    values.push(phone);

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

//插入发货记录
exports.newshouhuoRecord = function newshouhuoRecord(playerId, goodsId, type, goodsName, exchangeNum, goodsPrice, callback) {
    let sql = "INSERT INTO shop_exchange_record(playerId,goodsId,type,goodsName,exchangeNum,goodsPrice) VALUES(?,?,?,?,?,?)";
    let values = [];
    values.push(playerId);
    values.push(goodsId);
    values.push(type);
    values.push(goodsName);
    values.push(exchangeNum);
    values.push(goodsPrice);

    pool.getConnection(function (err, connection) {
        connection.query({sql: sql, values: values}, function (err, rows) {
            if (err) {
                console.log(err);
                callback(0);
            } else {
                if (err) {
                    console.log(err);
                    callback(0);
                } else {
                    callback(1);
                }
            }
        });
        connection.release();

    });
};

//查询发货记录
exports.selectshouhuoRecord = function selectshouhuoRecord(userId, callback) {
    let sql = "SELECT * FROM shop_exchange_record WHERE playerId = ?";
    let values = [];
    values.push(userId);
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