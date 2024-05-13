const schedule = require("node-schedule");
const gameConfig = require("./../config/gameConfig");
const TypeEnum = require('../../util/enum/type')
const CacheUtil = require('../../util/cache_util')
const ErrorCode = require("../../util/ErrorCode");
const http_bc = require("../../util/http_broadcast");
const StringUtil = require('../../util/string_util')

const GameInfo = function () {
    let _gameinfo = "";
    const Game = function () {
        this.serverId = gameConfig.serverId;
        //初始化游戏
        this.init = function () {
            console.log('####init game!####');
            //初始化用户列表
            this.userList = {};
            this.messageList = [];
            //维护模式
            this.maintain = false;

            const rule = new schedule.RecurrenceRule();
            const times = [];
            for (let i = 0; i < 60; i++) {
                times.push(i);
            }
            let count = 0;
            let lastTime = new Date().getTime();
            let sendFlag = true;
            // 记录上次打印时间的变量
            rule.second = times;
            const self = this;
            let saveList = [];
            CacheUtil.getBankTransferConfig().then(config =>{
                schedule.scheduleJob(rule, function () {
                    const nowDate = new Date();
                    const second = nowDate.getSeconds();

                    if (second % 3 === 0) {
                        const msg = self.messageList[0]
                        if (msg) {
                            const type = msg.type;
                            if(type === TypeEnum.notifyType.bigWin){
                                // 全服通知栏消息
                                self._io.sockets.emit("noticeBigWinMsg", msg.extend);
                            }else if(type === TypeEnum.notifyType.hitJackpot){
                                self._io.sockets.emit("noticeJackpotMsg", msg.extend);
                            }else{
                                // 全服发送跑马灯
                                self._io.sockets.emit("noticeMsg", msg);
                                if(saveList.length < 20){
                                    saveList.push(msg)
                                }else{
                                    saveList.shift(); // 移除第一项
                                    saveList.push(msg)
                                }
                                CacheUtil.saveNotifyMsg(saveList);
                            }
                            // 移除消息
                            self.messageList.shift();
                        }
                    }

                    if(sendFlag){
                        const idx  = StringUtil.RandomNum(11, 19)
                        if(idx % 3 === 0){
                            const amounts = config.withdrawWard.map(it => it.val)
                            const index  = StringUtil.RandomNum(0, amounts.length -1)
                            let id =  StringUtil.RandomNum(100000, 999999);
                            // 发送提现跑马灯
                            const noticeMsg = [{
                                type: TypeEnum.notifyType.withdraw, // 6
                                content_id: ErrorCode.WITHDRAW_NOTIFY.code, // p0006
                                extend: {
                                    nickName: "USER" + id, // 昵称
                                    withdrawAmount: amounts[index] ? amounts[index] : amounts, // 提现金额
                                    userId: id
                                }
                            }]
                            // 全服发送跑马灯
                            self._io.sockets.emit("noticeMsg", noticeMsg[0]);
                            count ++;
                            if(count >= 2 && Date.now() - lastTime < 60000){
                                sendFlag = false;
                            }
                            console.log(noticeMsg[0])
                        }
                    }
                    if(Date.now() - lastTime > 60000){
                        lastTime = Date.now();
                        sendFlag = true;
                        console.log('一分钟重置')
                    }
                });
            })
        };


        this.addMessage = function (noticeMsg) {
            console.log('添加通知消息', noticeMsg)
            this.messageList.push(noticeMsg);
        }

        this.setIo = function (_io, _Csocket) {
            this._io = _io;
            this._Csocket = _Csocket;
        };

        this.Setmaintain = function () {
            gameConfig.maintain = true;
        };

        this.isMaintain = function () {
            return gameConfig.maintain;
        };

        this.disconnectAllUser = function () {
            this._io.sockets.disconnect();
            log.info("服务器开启维护，连接广播服务的玩家已经全部离线");
        };
        //运行初始化
        this.init();
    };


    if (_gameinfo) {
        return {getInstand: _gameinfo}
    } else {
        console.log("####create game!####");
        _gameinfo = new Game();
        return {getInstand: _gameinfo}
    }

}();

module.exports = GameInfo;

