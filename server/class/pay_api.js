const HTTPRequest = require('../../util/http_util');

// 下订单
exports.buyOrder  = async function buyOrder(uid, prodcut_id, orderId, amount, currency, callbackUrl) {
    try {
        const params = {
            orderId: orderId,
            amount: `${amount}`,
            currency: currency,
            uid: `${uid}`,
            product_id: `${prodcut_id}`,
            returnUrl: `${callbackUrl}`
        };
        const url = 'http://pay.pokerslotgame.com/api/betcatpay/createPaymentOrder';
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 下订单
exports.fastBuyOrder  = async function fastBuyOrder(uid, prodcut_id, orderId, amount, currency, goods, callbackUrl) {
    try {
        const params = {
            orderId: orderId,
            amount: `${amount}`,
            currency: currency,
            uid: `${uid}`,
            product_id: `${prodcut_id}`,
            returnUrl: `${callbackUrl}`,
            goods: goods,
            remark: 'test'
        };
        const url = 'http://pay.pokerslotgame.com/api/fatpagpay/createPaymentOrder';
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        console.error('Error:', error);
    }
}


