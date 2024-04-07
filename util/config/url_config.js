
const serverUrl = {};
serverUrl.hall_url =  'http://127.0.0.1:13000'
serverUrl.broadcast_ip =  process.env.BROADCAST_IP||'127.0.0.1'

module.exports = serverUrl;
