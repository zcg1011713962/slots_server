const crypto = require('crypto');


exports.generateOrderId = function generateOrderId() {
    const timestamp = Date.now().toString();
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${randomDigits}`;
}


exports.findElementCount  =function countOccurrences(arr, searchElement) {
    return arr.reduce((acc, curr) => {
        return curr === searchElement ? acc + 1 : acc;
    }, 0);
}

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


exports.generateGameResult  = function generateGameResult(winRate) {
    if(winRate === undefined){
        return winRate;
    }
    if(winRate <= 0){
        return false;
    }
    const randomNumber = Math.random(); // 生成一个 0 到 1 之间的随机数
    return randomNumber < winRate
}


exports.addNumbers  = function addNumbers(a, b) {
    // 使用parseInt()或parseFloat()将输入转换为数字
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2)) {
        return NaN;
    }
    return this.toFixed((num1 + num2), 2);
}

exports.addTNumbers  = function addTNumbers(a, b, c) {
    // 使用parseInt()或parseFloat()将输入转换为数字
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    const num3 = parseFloat(c);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2) || isNaN(num3)) {
        return NaN;
    }
    return this.toFixed( ( num1 + num2 + num3), 2);
}


exports.reduceNumbers  = function reduceNumbers(a, b) {
    // 使用parseInt()或parseFloat()将输入转换为数字
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2)) {
        return NaN;
    }
    return this.toFixed( (num1 - num2), 2);
}


exports.compareNumbers  = function compareNumbers(a, b) {
    // 使用parseInt()或parseFloat()将输入转换为数字
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2)) {
        return NaN;
    }
    return num1 < num2;
}

exports.rideNumbers  = function rideNumbers(a, b, decimalPlaces) {
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2)) {
        return NaN;
    }
    return this.toFixed((num1 * num2), decimalPlaces);
}


exports.divNumbers  = function divNumbers(a, b, decimalPlaces) {
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    // 检查输入是否为有效数字，若无效则返回NaN
    if (isNaN(num1) || isNaN(num2)) {
        return NaN;
    }
    return this.toFixed((num1 / num2), decimalPlaces);
}

exports.toFixed  = function toFixed(num, decimalPlaces) {
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    // 将数字转换为字符串并保留指定位数的小数
    const fixedNumber = parsedNum.toFixed(decimalPlaces);
    // 将字符串转换回数字
    return parseFloat(fixedNumber);
}


exports.RandomNumForList = function RandomNumForList(arr) {
    //从指定数组中选取随机值
    return arr[Math.floor((Math.random() * arr.length))]
}

exports.RandomNumBoth = function RandomNumBoth(Min, Max) {
    //生成指定范围内随机整数
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}

exports.list_one_count = function list_one_count(x, list) {
    //数组中指定值出现次数
    var count = 0;
    for (var i in list) {
        if (list[i] == x) {
            count++
        }
    }
    return count;
}


exports.currDate = function currDate(x, list) {
    const currentDate = new Date();
    // 获取年份
    const year = currentDate.getFullYear();
    // 获取月份（月份从0开始，需要加1）
    const month = currentDate.getMonth() + 1;
    // 获取日期
    const day = currentDate.getDate();
    return `${year}-${month}-${day}`;
}

exports.currDateTime = function currDateTime() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return currentDate.getTime();
}


