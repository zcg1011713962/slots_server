const RedisUtil = require('./redis_util');
const redis_jackpot_key = "jackpot";

//初始奖池
exports.redis_win_pool_init  = function redis_win_pool_init() {
    RedisUtil.set(redis_jackpot_key,0);
};

//累加奖池
exports.redis_win_pool_incrby  = function redis_win_pool_incrby(increment) {
    RedisUtil.client.incrby(redis_jackpot_key,increment);
};

//累减奖池
exports.redis_win_pool_decrby  = function redis_win_pool_decrby(increment) {
    RedisUtil.client.decrby(redis_jackpot_key, increment);
};

//获取奖池
exports.get_redis_win_pool  = function get_redis_win_pool() {
    return RedisUtil.get(redis_jackpot_key);
};






