const HTTPRequest = require('../../util/http_util');
const TypeEnum = require('../../util/enum/type')
const crypto = require('crypto');
// 巴西代收下订单
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

// 巴西代收下订单
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


// 印度代收下订单
exports.ydBuyOrder  = async function (uid, prodcutId, orderId, amount, currency, callbackUrl) {
    try {
        // 加密数据
        const body = {
            apiKey: 'V7ZZbvvg3x',
            sign: '',
            clientId: orderId,
            amount: amount,
            skipUrl: '',
            callbackUrl: '',
            payMode: 'launch',
            name: '',
            phone: '',
            email: ''
        };
        const apiSecret = '6XLsu1pyRr'
        body.sign = ydGenerateSign(body, apiSecret);
        const url = 'https://test-api.apnapay.net/api/payin/desk';
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', JSON.stringify(body), headers);
    } catch (error) {
        console.error('Error:', error);
    }
}



// 查询巴西代收订单
exports.searchBXOrder  = async function (orderId, payType) {
    try {
        const params = {
            merOrderNo: orderId
        };
        let url = '';
        if(TypeEnum.PayType.fatpag === payType){
            url = 'http://pay.pokerslotgame.com/api/fatpagpay/queryPaymentOrder';
        }else if(TypeEnum.PayType.betcatpay === payType){
            url = 'http://pay.pokerslotgame.com/api/betcatpay/queryPaymentOrder';
        }
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        console.error('Error:', error);
    }
}



// 查询印度代收订单
exports.searchYDOrder  = async function (orderId, payType) {
    try {
        // 加密数据
        const body = {
            apiKey: 'V7ZZbvvg3x',
            sign: '',
            clientId: orderId
        };
        const apiSecret = '6XLsu1pyRr'
        body.sign = ydGenerateSign(body, apiSecret);
        const url = 'https://test-api.apnapay.net/api/payin/status';
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', JSON.stringify(body), headers);
    } catch (error) {
        console.error('Error:', error);
    }
}


// 查询巴西Fatpag订单
exports.searchOrder  = async function searchOrder(orderId) {
    try {
        const params = {
            merOrderNo: orderId
        };
        const url = 'http://pay.pokerslotgame.com/api/betcatpay/queryPaymentOrder';
        const body = JSON.stringify(params);
        const headers = {
            'Content-Type': 'application/json'
        };
        return await HTTPRequest.sendRequest(url, 'POST', body, headers);
    } catch (error) {
        console.error('Error:', error);
    }
}


// 印度生成签名
function ydGenerateSign(body, apiSecret) {
    const sortedBody = {};
    Object.keys(body).sort().forEach(key =>{
        if (key !== 'sign') {
        sortedBody[key] = body[key];
        }
    });

    const params = [];
    for (const key in sortedBody) {
        params.push(`${key}=${sortedBody[key]}`);
    }
    params.push(`apiSecret=${apiSecret}`);

    const beforeSign = params.join('&');
    const sign = crypto.createHash('md5').update(beforeSign).digest('hex');
    // console.log(sign);
    return sign;
}

