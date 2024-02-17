let client = require('./../redis_client');

let keyName = "user";

exports.saveTask = function saveTask(userId, info, cb) {
    let date = new Date().getTime();
    let user_json = {
        "loginTime": date,
        "num": 0,
        "isLingQu": 1,
    };
    if (info) {
        user_json = info;
        user_json.loginTime = date;
        user_json.isLingQu = 1;
    }
    // 保存入库
    client.set(keyName + userId, JSON.stringify(user_json), (err) => {
        if (err) {
            console.error('保存用户数据失败');
            throw err;
        }
        console.log('数据保存成功');
        // 成功的code = 1
        cb(user_json);
    });
};

exports.queryTask = function queryTask(userId, cb) {

    client.get(keyName + userId, (err, value) => {
        if (err) {
            console.error('操作redis失败');
            throw err;
        }
        if (value) {
            console.log('返回信息是：', value);
            // 作为入参，返回给回调,这样外部调用就可以难道值了
            cb(value.toString('utf-8'));
        } else {
            cb(null);
        }
    });
};

exports.updateEveryLogin = function updateEveryLogin(userId, isLingqu, cb) {
    // 更新的本质其实还是执行redis的set
    client.get(keyName + userId, (err, value) => {
        if (value) {
            let user_json = JSON.parse(value);
            if (user_json.isLingQu != 2) {
                user_json.isLingQu = isLingqu;
                user_json.num += 1;
                // 执行set
                client.set(keyName + userId, JSON.stringify(user_json), (err) => {
                    if (err) {
                        console.error('用户数据更新失败');
                        throw err;
                    }
                    console.log('用户信息更新成功');
                    cb(user_json);
                });
            } else {
                console.error(`${userId}重复领取`);
            }
        } else {
            console.err(`${userId}无法查询到的用户信息`);
            throw new Error(`${userId}无法查询到的用户信息`);
        }
    });
};




