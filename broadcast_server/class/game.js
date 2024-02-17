var schedule = require("node-schedule");
var gameConfig = require("./../config/gameConfig");
let dao = require("./../dao/dao");

//读取文件包

var GameInfo = function () {

    var _gameinfo = "";

    var Game = function () {

        this.serverId = gameConfig.serverId;

        //初始化游戏
        this.init = function () {
            console.log('####init game!####');

            //初始化用户列表
            this.userList = {};

            this.messageList = [];
            this.tableKeyList = {};
            //维护模式
            this.maintain = false;

            var rule = new schedule.RecurrenceRule();
            var times = [];
            for (var i = 0; i < 60; i++) {
                times.push(i);
            }
            rule.second = times;
            var self = this;
            schedule.scheduleJob(rule, function () {
                if (gameConfig.maintain) {
                    --gameConfig.maintainTime;
                    if (!gameConfig.maintainTime) {
                        self.disconnectAllUser();
                    }
                }

                var nowDate = new Date();
                var second = nowDate.getSeconds();

                if (second % 6 == 0) {
                    if (self.messageList[0]) {
                        // console.log(self.messageList[0]);
                        self._io.sockets.emit("bigPriceMessage", {
                            code: 1,
                            data: self.messageList[0]
                        });
                        self.messageList.shift();
                    }
                }

                if (self.messageList.length < 10) {
                    let id = Math.ceil(Math.random() * 11000);
                    let gameList = ["9线拉王", "麻将胡了", "水浒传", "吕布戏貂蝉", "五福临门", "玉蒲团", "水果小玛丽", "阿兹塔克", "双喜临门", "比翼双飞", "比翼双飞", "明星972023", "金财神"];
                    let data = {
                        userId: id,
                        nickName: "玩家" + id,
                        gameName: RandomNumForList(gameList),
                        win: Math.floor(Math.random() * 100000) + 100000
                    };
                    self.messageList.push(data);
                }

            });
        };

        this.addMessage = function (_info) {
            let data = {
                userId: _info.userId,
                nickName: _info.nickName,
                gameName: _info.gameName,
                win: _info.win
            };
            this.messageList.push(data);
        };

        this.getTableKey = function (_info) {
            this.tableKeyList[_info.port] = new Array(_info.num);
            for (let i = 0; i < _info.num; ++i) {
                var table_key = "";
                while (true) {
                    let i_t_key = init_table_key();
                    let findKey = false;
                    for (let j in this.tableKeyList) {
                        if (this.tableKeyList[j].indexOf(i_t_key) !== -1) {
                            findKey = true;
                            break;
                        }
                    }
                    if (!findKey) {
                        table_key = i_t_key;
                        break;
                    }
                }
                this.tableKeyList[_info.port][i] = table_key;

            }
            return this.tableKeyList[_info.port];
        };

        this.checkTableKey = function (_info) {
            let port = null;
            for (let i in this.tableKeyList) {
                if (this.tableKeyList[i].indexOf(_info.key) !== -1) {
                    port = i;
                    break;
                }
            }
            return port;
        };

        this.updateTableKey = function (_info) {
            let table_key = "";
            while (true) {
                let i_t_key = init_table_key();
                let findKey = false;
                for (let j in this.tableKeyList) {
                    if (this.tableKeyList[j].indexOf(i_t_key) !== -1) {
                        findKey = true;
                        break;
                    }
                }
                if (!findKey) {
                    table_key = i_t_key;
                    break;
                }
            }
            //给房间换个新密码
            this.tableKeyList[_info.port][_info.tableId] = table_key;
            return table_key;
        };

        this.getUserCtrl = function (_info, response) {

            dao.getUserCtrl(_info.userId, (code, res) => {
                let data = {
                    code: code,
                    res: res
                };
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.write(JSON.stringify({result: data}));
                response.end();
            });

        };

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
            console.log("服务器开启维护，已经全部离线");
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

function init_table_key() {
    var key = "";
    for (var i = 0; i < 6; i++) {
        key += RandomNumBoth(0, 9)
    }
    return key
}

function RandomNumBoth(Min, Max) {
    //生成指定范围内随机整数
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}

function RandomNumForList(arr) {
    //从指定数组中选取随机值
    return arr[Math.floor((Math.random() * arr.length))]
}

module.exports = GameInfo;

