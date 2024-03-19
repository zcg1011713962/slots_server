
const serverUrl = {};
serverUrl.hall_url =  process.env.HALL_URL||'http://localhost:13000'
serverUrl.broadcast_ip =  process.env.BROADCAST_IP||'127.0.0.1'

module.exports = serverUrl;
