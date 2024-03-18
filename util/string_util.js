const crypto = require('crypto');

exports.isJson  = function isJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

exports.generateUniqueToken  = function generateUniqueToken(length = 32) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(length, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                const token = buffer.toString('hex');
                resolve(token);
            }
        });
    });
}


exports.generateAccount  = function generateAccount(daili, time) {
    return daili + time;
}


exports.generateKing  = function generateKing() {
    const keys = Math.ceil(Math.random() * 9);
    const keys2 = Math.ceil(Math.random() * 9);
    const keys3 = Math.ceil(Math.random() * 9);
    const numbb = String.fromCharCode(65 + keys);
    const numbb2 = String.fromCharCode(65 + keys2);
    const numbb3 = String.fromCharCode(65 + keys3);
    return keys + numbb + keys2 + numbb2 + keys3 + numbb3;
}

let i = "0" + 1;
exports.generateTime  = function generateTime() {
    const newDate = new Date();
    //在小于10的月份前补0
    const month = eval(newDate.getMonth() + 1) < 10 ? '0' + eval(newDate.getMonth() + 1) : eval(newDate.getMonth() + 1);
    //在小于10的日期前补0
    const day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
    //在小于10的小时前补0
    const hours = newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
    //在小于10的分钟前补0
    const minutes = newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes();
    //在小于10的秒数前补0
    const seconds = newDate.getSeconds() < 10 ? '0' + newDate.getSeconds() : newDate.getSeconds();
    //拼接时间
    const stringDate = newDate.getFullYear() + '-' + month + '-' + day + " " + hours + ":" + minutes + ":" + seconds;
    const h = stringDate.replace(/\s+/g, "");
    const m = h.replace(/\-/g, "");
    const s = m.replace(/\:/g, "") + i;
    return s;
}


exports.generateNickName  = function generateNickName(time) {
    i++;
    let stri = i;
    if (i < 10) {
        i = "0" + i;
        stri = i
    } else {
        i = i;
        stri = i;
    }
    if (i >= 99) {
        i = "0" + 1;
    }
    const Dirs = time.split('');
    return "USER" + Dirs[3] + Dirs[5] + Dirs[7] + Dirs[9] + Dirs[11] + stri;
}



exports.pwdEncrypt  = function pwdEncrypt(account, king) {
    const key_login = "89b5b987124d2ec3";
    let content = account + king + key_login;
    const md5_sign = crypto.createHash('md5');
    md5_sign.update(content);
    return md5_sign.digest('hex');
}


exports.kingEncrypt  = function encrypt(text) {
    const key_login = "89b5b987124d2ec3";
    const cipher = crypto.createCipher('aes-256-cbc', key_login);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}


