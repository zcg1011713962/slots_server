const StringUtil = require("./string_util");


exports.gameToHall  = function gameToHall(socket) {
    socket.on('gameToHall', function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if (!d || !d.protocol) throw new Error('参数错误');

        }catch (e){
            socket.emit('gameToHallResult',  {code:0,msg:"参数有误"})
        }
    });

}