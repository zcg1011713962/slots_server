const fs = require('fs');
const ini = require('ini');


const readIniFile = function () {
    let conf = "";

    this.Config = function readIniFile(fileName) {
        // 同步读取当前目录的指定文件
        const data = fs.readFileSync(fileName, 'utf-8');
        const config = ini.parse(data);

        this.line_count = parseInt(config['图案连线'].line_count);
        this.col_count = parseInt(config['图案连线'].col_count);
        this.line_direction = parseInt(config['图案连线'].line_direction, 16);
        this.line_rule = config['图案连线'].line_rule;

        // 图案数组
        this.iconInfos = Object.keys(config['图案信息'])
            .filter(key => key.startsWith('icon_type_'))
            .map(key => config['图案信息'][key]);

        // 图案索引数组
        this.cards = Object.keys(config['图案信息'])
            .filter(key => key.startsWith('icon_type_'))
            .map(iconType => parseInt(iconType.split('_')[2].trim()));

        // 图案角标
        this.nGameLines = Object.keys(config['图案角标'])
            .filter(key => key.startsWith('game_line_'))
            .map(key => JSON.parse(config['图案角标'][key]));

        // 特殊图案
        this.nGameMagicCard = parseInt(config['图案信息'].icon_s_type_WILD);
        this.jackpot_card = parseInt(config['图案信息'].icon_s_type_jackpot);
        this.free_card = config['图案信息'].icon_s_type_free ? JSON.parse(config['图案信息'].icon_s_type_free) : null;

        // 免费次数
        this.free_times = JSON.parse(config['图案信息'].icon_free_times);

        // 图案权重数组
        const weight_string = Object.keys(config['图案权重'])
            .filter(key => key.startsWith('col_weight_'))
            .map(key => config['图案权重'][key]);
        this.weight_two_array = weight_string.map(str => JSON.parse(str));

        // 配牌器
        this.icon_bind_switch = parseInt(config['配牌器'].icon_bind_switch);
        this.icon_type_bind = JSON.parse(config['配牌器'].icon_type_bind);
        this.icon_bind_jackpot_sum = parseInt(config['配牌器'].icon_bind_jackpot_sum);
        // 中奖配置
        this.line_win_lower_limit = parseInt(config['中奖配置'].line_win_lower_limit);
        this.icon_jackpot_lower_limit = parseInt(config['中奖配置'].icon_jackpot_lower_limit);

        // 奖池控制
        // 奖池分配比例
        const jackpot_ratio_str = Object.keys(config['奖池控制'])
            .filter(key => key.startsWith('jackpot_ratio_'))
            .map(key => config['奖池控制'][key]);
        this.jackpot_ratio = jackpot_ratio_str.map(str => JSON.parse(str));
        // 奖池控制
        const jackpot_level_str = Object.keys(config['奖池控制'])
            .filter(key => key.startsWith('jackpot_level_'))
            .map(key => config['奖池控制'][key]);

        this.jackpot_level_money = jackpot_level_str.map( item => parseInt(item.split(',')[0]));
        this.jackpot_level_prob = jackpot_level_str.map( item => parseInt(item.split(',')[1]));

        // 玩家下注对应奖池挡位（下注，所属奖池下标）
        const bet_jackpot_level_str = Object.keys(config['奖池控制'])
            .filter(key => key.startsWith('bet_jackpot_level_'))
            .map(key => config['奖池控制'][key]);
        this.bet_jackpot_level_bet = bet_jackpot_level_str.map( item => parseInt(item.split(',')[0]));
        this.bet_jackpot_level_index = bet_jackpot_level_str.map( item => parseInt(item.split(',')[1]));


        // 玩家下注对应奖池挡位
        const jackpot_pay_level_str = Object.keys(config['奖池控制'])
            .filter(key => key.startsWith('jackpot_pay_level_'))
            .map(key => config['奖池控制'][key]);
        this.jackpot_pay_level = jackpot_pay_level_str.map(str => JSON.parse(str));

        // 图案倍数
        const icon_mul_str = Object.keys(config['图案倍数'])
            .filter(key => key.startsWith('icon_mul_'))
            .map(key => config['图案倍数'][key]);
        this.icon_mul = icon_mul_str.map(str => JSON.parse(str));

        // 样本生成器
        this.sample_rtp_random_degree = parseInt(config['样本生成器'].sample_rtp_random_degree);
        this.sample_bet_sum = JSON.parse(config['样本生成器'].sample_bet_sum);
    }

    if (conf) {
        return {getInstand: conf};
    } else {
        conf = new Config("tiger_config.ini");
        return {getInstand: conf};
    }

}();

module.exports = readIniFile;