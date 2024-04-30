const HTTPRequest = require('../util/http_util');
const TypeEnum = require('../util/enum/type')
const log = require('../CClass/class/loginfo').getInstand

// 打点请求
exports.dotRequest  = async function dotRequest(gps, adid, apptoken, key, money) {
    try {
        let url = '';
        if(money !== null && money > 0){
            const params = new URLSearchParams({
                gps: `${gps}`,
                adid: `${adid}`,
                ctime: new Date().getTime(),
                apptoken: `${apptoken}`,
                key: `${key}`,
                money: `${money}`
            });
            url = `http://server.pokerslotgame.com/adjust?${params}`
        }else{
            const params = new URLSearchParams({
                gps: `${gps}`,
                adid: `${adid}`,
                ctime: new Date().getTime(),
                apptoken: `${apptoken}`,
                key: `${key}`
            });
            url = `http://server.pokerslotgame.com/adjust?${params}`;
        }
        log.info('打点请求' + url)
        return await HTTPRequest.sendRequest(url, 'GET', null, null);
    } catch (error) {
        log.err('打点请求Error:'+ error);
    }
}