var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 287;			//第几个游戏ID
gameConfig.serverId = 15187;		//当前游戏的第几台服务器
gameConfig.logflag = 15187;		//游戏记录表示
gameConfig.port = 15187;		//游戏记录表示
gameConfig.gameName = "GrandWheel";
gameConfig.sendMessage_mul = 5;

//筹码
gameConfig.coinConfig = [1, 10, 100, 1000, 10000];
gameConfig.tax = 0.99;

gameConfig.seatMax = 30;
gameConfig.tableMax = 10;

gameConfig.LoginServeSign = "slel3@lsl334xx,deka";


//每日获得金币签到活动
gameConfig.everyWinCoinActivity = true;
//等级
gameConfig.lvActivity = true;

gameConfig.GAME_HAND_CARDS_NUMBER_DIAMOND = 3;
gameConfig.GAME_LINES_DIAMOND = [
    [1, 2, 3],       //# line 1
];

gameConfig.GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 99];
gameConfig.Free_GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 99];
gameConfig.GAME_COMBINATIONS_DIAMOND = [
    [3.0],
    [5.0],
    [8.0],
    [18.0],
    [38.0],
    [88.0],
    [0.0],
];
gameConfig.GAME_MAGIC_CARD_DIAMOND = -1;
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = -1;
gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = -1;
gameConfig.GAME_LINE_WIN_LOWER_LIMIT_CARD_NUMBER_DIAMOND = 3;
gameConfig.GAME_LINE_DIRECTION_DIAMOND = laba_config.GAME_SLOT_LEFT_TO_RIGHT;
gameConfig.GAME_LINE_RULE_DIAMOND = true;
gameConfig.GAME_MULTIPLES_DIAMOND = [];

//# 翻牌子对应颜色倍数
gameConfig.GAME_DIAMOND_TURN_OVER_CARD = {
    1: 10,
    2: 100,
    3: 1000,
};

module.exports = gameConfig;