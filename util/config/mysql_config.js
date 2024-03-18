mysql_config = {};
mysql_config.host= process.env.MYSQL_HOST||"192.168.0.53";
mysql_config.user= process.env.MYSQL_USER||"root";
mysql_config.password=process.env.MYSQL_PASSWORD|| "yx168168";
mysql_config.port= process.env.MYSQL_PORT||"3306";



module.exports = mysql_config;
