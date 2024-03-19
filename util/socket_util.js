const StringUtil = require("./string_util");


exports.clientToHall  = function clientToHall(socket, Csocket) {
    // 转发到大厅
    socket.on('clientToHall', function (data) {
        try {
            const d = StringUtil.isJson(data) ? JSON.parse(data) : data;
            if (!d || !d.protocol) throw new Error('参数错误');
            // 转发到大厅
            Csocket.emit(d.protocol, data);
        }catch (e){
            socket.emit('clientToHallResult',  {code:0,msg:"参数有误"})
        }
    });
}