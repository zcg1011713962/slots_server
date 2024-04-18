const ErrorCode = require("./ErrorCode");
const log = require('../CClass/class/loginfo').getInstand

// 推首充礼包
exports.pushFirstRecharge = function (socket, pushFirstRechargeType) {
    try {
        if(socket){
            socket.emit('showFirstRechargeShop', {code:  ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
            log.info(socket.userId + pushFirstRechargeType + '推首充礼包')
        }
    }catch (e){
        log.err('推首充礼包' + e)
    }
}