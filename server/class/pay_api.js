const HTTPRequest = require('../../util/http_util');
const TypeEnum = require('../../util/enum/type')
const CacheUtil = require('../../util/cache_util')
const log = require('../../CClass/class/loginfo').getInstand


// 巴西betcatPay代收下订单
exports.buyOrder  = async function buyOrder(uid, prodcut_id, orderId, amount, currency, callbackUrl) {
    try {
        const commonCache = await CacheUtil.getCommonCache();
        const betcatPay = commonCache.payUrls.betcatPay;
        const params = {
            orderId: orderId,
            amount: `${amount}`,
            currency: currency,
            uid: `${uid}`,
            product_id: `${prodcut_id}`,
            returnUrl: `${callbackUrl}`
        };
        const url = betcatPay.payUrl;
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        log.err('巴西betcatPay代收下订单Error:'+ error);
    }
}

// 巴西fastPay代收下订单
exports.fastBuyOrder  = async function fastBuyOrder(uid, prodcut_id, orderId, amount, currency, goods, callbackUrl) {
    try {
        const commonCache = await CacheUtil.getCommonCache();
        const fastPay = commonCache.payUrls.fastPay;
        const params = {
            orderId: orderId,
            amount: `${amount}`,
            currency: currency,
            uid: `${uid}`,
            product_id: `${prodcut_id}`,
            returnUrl: `${callbackUrl}`,
            goods: goods
        };
        const url = fastPay.payUrl;
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        log.err('巴西fastPay代收下订单Error:'+ error);
    }
}


// 印度代收下订单
exports.ydBuyOrder  = async function (uid, prodcutId, orderId, amount, currency, callbackUrl) {
    try {
        const commonCache = await CacheUtil.getCommonCache();
        const apnaPay = commonCache.payUrls.apnaPay;

        const body = {
            "app_token": apnaPay.token,
            "amount": amount,
            "merOrderNo": orderId,
            "environment": apnaPay.environment // 环境
        }
        const url = apnaPay.payUrl;
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', JSON.stringify(body), headers);
    } catch (error) {
        log.err('印度apnaPay代收下订单Error:'+ error);
    }
}



// 查询巴西代收订单
exports.searchBXOrder  = async function (orderId, payType) {
    try {
        const commonCache = await CacheUtil.getCommonCache();

        const params = {
            merOrderNo: orderId
        };
        let url = '';
        if(TypeEnum.PayType.fatpag === payType){
            const fastPay = commonCache.payUrls.fastPay;
            url = fastPay.searchPayUrl;
        }else if(TypeEnum.PayType.betcatpay === payType){
            const betcatPay = commonCache.payUrls.betcatPay;
            url = betcatPay.searchPayUrl;
        }
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        log.err('查询巴西代收订单Error:'+ error);
    }
}



// 查询印度代收订单
exports.searchYDOrder  = async function (orderId, payType) {
    try {
        const commonCache = await CacheUtil.getCommonCache();
        const apnaPay = commonCache.payUrls.apnaPay;

        const body = {
            app_token: apnaPay.token,
            merOrderNo: orderId,
        };
        const url = apnaPay.searchPayUrl;
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', JSON.stringify(body), headers);
    } catch (error) {
        log.err('查询印度apnaPay代收订单Error:'+ error);
    }
}






