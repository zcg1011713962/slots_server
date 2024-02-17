let client = require('./../redis_client');
let gameConfig = require("./../config/gameConfig");
let keyName = "gameRTP";

exports.updateRTP = function updateRTP(rtp, lo, win, cb) {
    // 更新的本质其实还是执行redis的set
    client.get(keyName, (err, value) => {
        if (value) {
            let user_json = JSON.parse(value);
            let gameData = user_json[`game${gameConfig.port}`] || {};

            gameData.curRTP = rtp;
            gameData.lotteryTotal = lo;
            gameData.winTotal = win;
            gameData.timestamp = new Date().getTime();
            user_json[`game${gameConfig.port}`] = gameData;
            // 执行set
            client.set(keyName, JSON.stringify(user_json), (err) => {
                if (err) {
                    console.error('用户数据更新失败');
                    throw err;
                }
                // console.log('用户信息更新成功');
                cb && cb(gameData);
            });

        } else {
            console.error(`没有库信息，重新创建中`);
            let user_json = {};
            user_json[`game${gameConfig.port}`] = {
                curRTP: rtp,
                lotteryTotal: lo,
                winTotal: win,
                timestamp: new Date().getTime()
            };

            // 保存入库
            client.set(keyName, JSON.stringify(user_json), (err) => {
                if (err) {
                    console.error('保存用户数据失败');
                    throw err;
                }
                console.log('数据保存成功');
                // 成功的code = 1
                cb && cb(user_json[`game${gameConfig.port}`]);
            });
        }
    });
};

exports.getRTP = function getRTP(cb) {
    // 更新的本质其实还是执行redis的set
    client.get(keyName, (err, value) => {
        if (value) {
            let user_json = JSON.parse(value);
            let gameData = user_json[`game${gameConfig.port}`] || null;
            cb && cb(gameData);
        } else {
            cb && cb(null);
        }
    });
};

let a = {
    game16001: {
        curRTP: 50.25,
        timestamp: 231231232112323,
        lotteryTotal: 5,
        winTotal: 1
    },
    game16002: {
        curRTP: 50.25,
        timestamp: 231231232112323,
        lotteryTotal: 5,
        winTotal: 1
    },
};




