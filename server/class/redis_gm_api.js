// var redis = require('redis');
// var redis_config=require("../../util/redis_config");
//
// var client = redis.createClient(redis_config.RDS_PORT, redis_config.RDS_IP,redis_config.RDS_OPTS);
//
//
// client.on("ready", function () {
//     //订阅消息
//     client.subscribe("GMsendMsgToUser");   //gm发送信息给用户事件
//     console.log("订阅成功。。。");
// });
//
//
// //监听订阅成功事件
// client.on("subscribe", function (channel, count) {
//     console.log("client subscribed to " + channel + "," + count + "total subscriptions");
// });
//
// // var gameInfo = require('../../laba_5200_lian_huan_duo_bao_server/class/game').getInstand;
// //
// //
// //
// //
// //监听gm发送来的消息
// client.on("message", function (channel, message) {
//     console.log("------------------------------我接收到信息了------------------");
//     console.log("------------------------------我接收到信息了");
//     console.log("------------------------------我接收到信息了");
//     console.log("------------------------------我接收到信息了");
//     console.log("channel" + channel);
//     console.log("message" + message);
//     var message = JSON.parse(message)
//     if (channel == "GMsendMsgToUser") {
//         if(gameInfo.userList[message.user_id]){
//             var send_socket=gameInfo.userList[message.user_id]._socket;
//             send_socket.emit("GMsendMsg",{gm_id:message.gm_id,msg:message.msg})
//         }
//     }
//
// });