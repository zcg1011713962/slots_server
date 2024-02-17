const RedisUtil = require('./redis_util');


//发布
module.exports.send_msg= function send_msg(s,msg) {
    RedisUtil.client.publish(s, JSON.stringify(msg));
}


module.exports.redis_client = RedisUtil.client;

