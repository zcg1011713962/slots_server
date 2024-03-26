const HTTPRequest = require('../../util/http_util');

// 下订单
exports.buyOrder  = async function buyOrder(uid, prodcut_id, orderId, amount, currency) {
    try {
        const params = {
            orderId: orderId,
            amount: `${amount}`,
            currency: currency,
            uid: `${uid}`,
            product_id: `${prodcut_id}`
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


