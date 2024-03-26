var config_ip = "127.0.0.1";

var ServerInfo = function () {

    var _serverinfo = "";


    const Server = function () {
        const GameConfig = [];
        let serverGame = {};
        let serverRoomTemp = {};

        // 转盘
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 229;
        serverGame.serverId = 15129;
        serverGame.GameName = "freespin";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15129";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);

        // 神头象
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 263;
        serverGame.serverId = 15163;
        serverGame.GameName = "ganeshagold";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15163";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);
        // 老虎
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 268;
        serverGame.serverId = 15168;
        serverGame.GameName = "fortunetiger";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15168";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);
        // 快乐丛林
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 272;
        serverGame.serverId = 15172;
        serverGame.GameName = "jungledelight";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15172";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);
        // 魔法女
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 283;
        serverGame.serverId = 15183;
        serverGame.GameName = "UltimateStriker";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15183";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);
        // 野牛
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 285;
        serverGame.serverId = 15185;
        serverGame.GameName = "BuffaloKing";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15185";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);

        // 汽车
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 287;
        serverGame.serverId = 15187;
        serverGame.GameName = "GrandWheel";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15187";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);
        // 钻石
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 288;
        serverGame.serverId = 15188;
        serverGame.GameName = "BlueDiamond";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15188";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);

        // 挖掘机
        serverGame = {};
        serverRoomTemp = {};
        serverGame.GameId = 286;
        serverGame.serverId = 15186;
        serverGame.GameName = "DigDigDigger";
        serverGame.serverInfo = {};
        serverGame.serverInfo.normal = [];
        serverRoomTemp.Server = 1;
        serverRoomTemp.bet = 1;
        serverRoomTemp.Match = 0;
        serverRoomTemp.entryCoin = 1000;
        serverRoomTemp.gift = 0;
        serverRoomTemp.ip = config_ip;
        serverRoomTemp.prot = "15186";
        serverGame.serverInfo.normal.push(serverRoomTemp);
        GameConfig.push(serverGame);

        //初始
        this.init = function () {

        };

        this.getServerNameById = function (_id) {
            for (const i in GameConfig) {
                if (GameConfig[i].serverId === parseInt(_id)) {
                    return GameConfig[i].GameName
                }
            }
            return GameConfig[0].GameName;
        };

        //通过ID获得服务器关键信息
        this.getServerInfoById = function (_id) {
            for (const i in GameConfig) {
                if (GameConfig[i].GameId === parseInt(_id)) {
                    return GameConfig[i];
                }
            }
            return null;
        };

        //获得进场数据
        this.getServerEnterCoinByProt = function (_port) {
            for (let i = 0; i < GameConfig.length; ++i) {
                for (let j = 0; j < GameConfig[i].serverInfo.normal.length; ++j) {
                    if (parseInt(GameConfig[i].serverInfo.normal[j].prot) === _port) {
                        return GameConfig[i].serverInfo.normal[j].entryCoin;
                    }
                }
            }
            return -1;
        };

        this.getServerAll = function () {
            return GameConfig;
        };

        this.socketList = {};

        this.setScoket = function (_idx, _socket) {
            this.socketList[_idx] = _socket;
            _socket.serverGameid = _idx;
        };

        this.getScoket = function (_idx) {
            return this.socketList[_idx];
        };

        this.getScoketList = function () {
            return this.socketList;
        };
        //运行初始化
        this.init();
    };

    if (_serverinfo) {
        return {getInstand: _serverinfo}
    } else {
        console.log("####create ServerInfo!####");
        _serverinfo = new Server();
        return {getInstand: _serverinfo}
    }

}();


module.exports = ServerInfo;

