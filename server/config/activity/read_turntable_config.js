const fs = require('fs');
const ini = require('ini');


const readIniFile = function () {
    let conf = "";

    this.Config = function readIniFile(fileName) {
        // 同步读取当前目录的指定文件
        const data = fs.readFileSync(fileName, 'utf-8');
        const config = ini.parse(data);

        // 图案连线
        this.line_count = parseInt(config['图案连线'].line_count);
        this.col_count = parseInt(config['图案连线'].col_count);

        // 下注挡位
        this.coinConfig = JSON.parse(config['下注挡位'].coin_config);

        // 图案数组
        this.iconInfos = Object.keys(config['图案信息'])
            .filter(key => key.startsWith('icon_type_'))
            .map(key => config['图案信息'][key]);

        // 图案索引数组
        this.cards = Object.keys(config['图案信息'])
            .filter(key => key.startsWith('icon_type_'))
            .map(iconType => parseInt(iconType.split('_')[2].trim()));

        // 图案权重数组
        const weight_string = Object.keys(config['图案权重'])
            .filter(key => key.startsWith('col_weight_'))
            .map(key => config['图案权重'][key]);
        this.weight_two_array = weight_string.map(str => JSON.parse(str));

        // 配牌器
        this.icon_type_bind = config['配牌器'].icon_type_bind ? JSON.parse(config['配牌器'].icon_type_bind) : config['配牌器'].icon_type_bind;

        // 图案倍数
        const icon_mul_str = Object.keys(config['图案倍数'])
            .filter(key => key.startsWith('icon_mul_'))
            .map(key => config['图案倍数'][key]);
        this.icon_mul = icon_mul_str.map(str => JSON.parse(str));

    }

    if (conf) {
        return {getInstand: conf};
    } else {
        conf = new Config("./turntable.ini");
        return {getInstand: conf};
    }

}();

module.exports = readIniFile;