const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require('../util/redis_laba_win_pool');
const laba_config = require('../util/config/laba_config');

const bankPwdErrorTimes= 'bankPwdErrorTimes';


// 增加银行输入密码错误次数
exports.addBankPwdErrorCount = function (userId) {
    const key = bankPwdErrorTimes + userId;
    RedisUtil.get(key).then(v =>{
        if(v){
            RedisUtil.client.incrby(key, 1);
        }else{
            RedisUtil.set(key, 0).then(r =>{
                RedisUtil.expire(key, 300).then(a=>{
                    RedisUtil.client.incrby(key, 1);
                });
            });
        }
    })
}
// 查询银行输入密码错误次数
exports.searchBankPwdErrorCount = function (userId) {
    const key = bankPwdErrorTimes + userId;
    return RedisUtil.get(bankPwdErrorTimes);
}


// 获取游戏奖池
exports.getGameJackpot  = function getGameJackpot(socket){
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        // 游戏奖池
        let gameJackpot = jackpot ? jackpot * laba_config.game_jackpot_ratio : 0;
        socket.emit('gameJackpotResult', {
            gameJackpot: gameJackpot.toFixed(2),
            grand_jackpot: (gameJackpot * laba_config.grand_jackpot_ratio).toFixed(2),
            major_jackpot: (gameJackpot * laba_config.major_jackpot_ratio).toFixed(2),
            minor_jackpot: (gameJackpot * laba_config.minor_jackpot_ratio).toFixed(2),
            mini_jackpot: (gameJackpot * laba_config.mini_jackpot_ratio).toFixed(2),
        });
    });
}

