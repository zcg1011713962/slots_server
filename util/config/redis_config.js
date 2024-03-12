redis_config = {};
redis_config.RDS_PORT= 6379;
redis_config.RDS_IP= "192.168.0.53";
redis_config.RDS_PWD= "yx168168";
redis_config.RDS_OPTS= {auth_pass:redis_config.RDS_PWD};





module.exports = redis_config;