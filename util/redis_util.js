const redis = require('redis');
const { promisify } = require('util');
const RedisConfig = require("./config/redis_config");

class RedisUtil {
    constructor() {
        if (!RedisUtil.instance) {
            const redisOptions = {
                host: RedisConfig.RDS_IP,
                port: RedisConfig.RDS_PORT, // 默认 Redis 端口号
                password: RedisConfig.RDS_PWD, // 指定 Redis 密码
            };
            this.client = redis.createClient(redisOptions);
            // Promisify Redis functions
            this.getAsync = promisify(this.client.get).bind(this.client);
            this.setAsync = promisify(this.client.set).bind(this.client);
            this.delAsync = promisify(this.client.del).bind(this.client);
            this.expireAsync = promisify(this.client.expire).bind(this.client);
            this.keysAsync = promisify(this.client.keys).bind(this.client);
            // Handle errors
            this.client.on('error', (err) => {
                console.error(`Redis error: ${err}`);
            });

            RedisUtil.instance = this;
        }

        return RedisUtil.instance;
    }

    async set(key, value) {
        return this.setAsync(key, value);
    }

    async get(key) {
        return this.getAsync(key);
    }

    async del(key) {
        return this.delAsync(key);
    }

    async keys(key) {
        return this.keysAsync(key);
    }

    async expire(key, value) {
        return this.expireAsync(key, value);
    }

    async disconnect() {
        this.client.quit();
    }
}

// 创建单例
const redisUtil = new RedisUtil();
// 导出单例实例，使其他模块可以共享同一个实例
module.exports = redisUtil;

