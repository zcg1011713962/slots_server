var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 272;			//第几个游戏ID
gameConfig.serverId = 15172;		//当前游戏的第几台服务器
gameConfig.logflag = 15172;		//游戏记录表示
gameConfig.port = 15172;		//游戏记录表示
gameConfig.gameName = "jungledelight";
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

gameConfig.GAME_HAND_CARDS_NUMBER_DIAMOND = 15;
gameConfig.GAME_LINES_DIAMOND = [
    [6, 7, 8, 9, 10],       //# line 1
    [1, 2, 3, 4, 5],        //# line 2
    [11, 12, 13, 14, 15],   //# line 3
    [1, 7, 13, 9, 5],       //# line 4
    [11, 7, 3, 9, 15],      //# line 5
    [1, 2, 8, 4, 5],        //# line 6
    [11, 12, 8, 14, 15],    //# line 7
    [6, 12, 13, 14, 10],    //# line 8
    [6, 2, 3, 4, 10],       //# line 9
    [1, 7, 8, 9, 5],        //# line 10
    [11, 7, 8, 9, 15],      //# line 11
    [6, 7, 3, 9, 10],       //# line 12
    [6, 7, 13, 9, 10],      //# line 13
    [6, 2, 8, 4, 10],       //# line 14
    [6, 12, 8, 14, 10],     //# line 15
    [1, 7, 3, 9, 5],        //# line 16
    [11, 7, 13, 9, 15],     //# line 17
    [1, 2, 8, 14, 15],      //# line 18
    [11, 12, 8, 4, 5],      //# line 19
    [6, 2, 8, 14, 10],      //# line 20
];

gameConfig.GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 8, 9];
gameConfig.Free_GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 9];
gameConfig.GAME_COMBINATIONS_DIAMOND = [
    [5.0, 8.0, 40.0],
    [5.0, 8.0, 50.0],
    [6.0, 10.0, 60.0],
    [8.0, 20.0, 80.0],
    [10.0, 30.0, 100.0],
    [30.0, 60.0, 300.0],
    [100.0, 300.0, 1000.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
];
gameConfig.GAME_MAGIC_CARD_DIAMOND = 9;
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = 7;
gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = 8;
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