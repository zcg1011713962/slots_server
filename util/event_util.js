const ErrorCode = require("./ErrorCode");
const log = require('../CClass/class/loginfo').getInstand

// 游戏内推首充礼包
exports.pushFirstRecharge = function (socket) {
    try {
        if(socket){
            socket.emit('showFirstRechargeShop', {code:  ErrorCode.SUCCESS.code, msg: ErrorCode.SUCCESS.msg});
            log.info('推首充礼包' + socket.userId)
        }
    }catch (e){
        log.err('推首充礼包' + e)
    }
}