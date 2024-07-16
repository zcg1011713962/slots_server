const HTTPRequest = require('../util/http_util');
const TypeEnum = require('../util/enum/type')
const CacheUtil = require("./cache_util");
const log = require('../CClass/class/loginfo').getInstand

// 打点请求
exports.bxDotRequest  = async function (gps, adid, apptoken, key, money) {
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




// 打点请求
exports.ydDotRequest  = async function (gps, adid, afid, apptoken, eventName, money) {
    try {
        const commonCache = await CacheUtil.getCommonCache();
        const url = commonCache.dotUrls.url;
        const environment = commonCache.dotUrls.environment;
        const tokens = commonCache.dotUrls.tokens;
        const tokenItem = tokens.filter(t => apptoken === t.app_token)

        if(!tokenItem || !tokenItem[0]){
            log.err('打点请求找不到token配置');
            return;
        }
        const token = tokenItem[0].token;

        const body = {
            app_token: token,
            gpsAdid: `${gps}`,
            adid: adid,
            eventName: eventName,
            amount: `${money}`,
            environment: environment,
            afid: afid
        };

        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', JSON.stringify(body), headers);
    } catch (error) {
        log.err('打点请求Error:'+ error);
    }
}