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




