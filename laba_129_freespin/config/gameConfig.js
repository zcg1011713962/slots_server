var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 229;			//第几个游戏ID
gameConfig.serverId = 15129;		//当前游戏的第几台服务器
gameConfig.logflag = 15129;		//游戏记录表示
gameConfig.port = 15129;		//游戏记录表示
gameConfig.gameName = "freespin";
gameConfig.sendMessage_mul = 5;

//筹码
gameConfig.coinConfig = [10, 20, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 700, 800, 1000, 1500, 2000, 3000, 5000, 6000, 8000];
gameConfig.tax = 1;

gameConfig.seatMax = 30;
gameConfig.tableMax = 10;

gameConfig.LoginServeSign = "slel3@lsl334xx,deka";

//每日获得金币签到活动
gameConfig.everyWinCoinActivity = true;
//等级
gameConfig.lvActivity = true;

gameConfig.GAME_ITEM_NUMBER = 16;

gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = {
    0: 5,
    8: 10
};

gameConfig.GAME_MUL_TURNTABLE = [0, 0.4, 80, 0.6, 20, 1.2, 8, 0.8, 0, 10, 4, 15, 200, 0.2, 40, 2];
gameConfig.FREE_MAX_MUL = 1;
module.exports = gameConfig;