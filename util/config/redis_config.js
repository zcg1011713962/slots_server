redis_config = {};
redis_config.RDS_PORT= 6379;
redis_config.RDS_IP= "localhost";
redis_config.RDS_PWD= "yx168168";
redis_config.RDS_OPTS= {auth_pass:redis_config.RDS_PWD};





module.exports = redis_config;