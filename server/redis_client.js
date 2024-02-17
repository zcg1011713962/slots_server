var redis = require('redis');
var redis_conf= require('../util/config/redis_config');

const client = redis.createClient(redis_conf.RDS_PORT, redis_conf.RDS_IP);
client.auth(redis_conf.RDS_PWD);

module.exports = client;

