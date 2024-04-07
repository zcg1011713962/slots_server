redis_config = {};
redis_config.RDS_PORT=process.env.REDIS_PORT|| 6379;
redis_config.RDS_IP= process.env.REDIS_HOST||"127.0.0.1";
redis_config.RDS_PWD= process.env.REDIS_PASSWORD||"yx168168";
redis_config.RDS_OPTS= {auth_pass:redis_config.RDS_PWD};





module.exports = redis_config;
