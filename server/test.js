const PayAPI = require("./class/pay_api");
PayAPI.searchOrder('1714280718584141', 0).then(result =>{

    console.log(result)
})