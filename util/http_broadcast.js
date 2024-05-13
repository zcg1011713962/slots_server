const httpUtil = require('../util/http_util');
const url_config = require('./config/url_config');
const log = require('../CClass/class/loginfo').getInstand

module.exports.sendNoticeMsg = function (noticeMsg) {
    try{
        const Url = 'http://' + url_config.broadcast_ip + ':13001'
        const headers = {
            'Content-Type': 'application/json'
        }
        const body = JSON.stringify(noticeMsg);
        httpUtil.sendRequest(  Url + '/addMessage' , 'POST', body, headers).then(r =>{})
    }catch (e){
        log.err('连接广播服务出错' + e)
    }
};




