
gameConfig = {};
gameConfig.gameId = 286;			//第几个游戏ID
gameConfig.serverId = 15186;		//当前游戏的第几台服务器
gameConfig.logflag = 15186;		//游戏记录表示
gameConfig.gameName = "DigDigDigger";
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
    [6, 2, 3, 4, 10],        //# line 6
    [6, 12, 13, 14, 10],    //# line 7
    [1, 2, 8, 14, 15],    //# line 8
    [11, 12, 8, 4, 5],       //# line 9
    [6, 12, 8, 4, 10],       //# line 10
];

gameConfig.GAME_MAGIC_CARD_DIAMOND = 9;
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = -1;
gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = -1;
gameConfig.GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 7, 8, gameConfig.GAME_MAGIC_CARD_DIAMOND];
gameConfig.Free_GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 7, 8, gameConfig.GAME_MAGIC_CARD_DIAMOND];
gameConfig.GAME_COMBINATIONS_DIAMOND = [
    [0.0, 5.0, 20.0, 100.0],
    [0.0, 5.0, 20.0, 100.0],
    [0.0, 5.0, 20.0, 100.0],
    [0.0, 5.0, 40.0, 150.0],
    [0.0, 5.0, 40.0, 150.0],
    [5.0, 30.0, 100.0, 750.0],
    [5.0, 30.0, 100.0, 750.0],
    [5.0, 40.0, 400.0, 2000.0],
    [10.0, 100.0, 1000.0, 5000.0],
    [2.0, 100.0, 1000.0, 5000.0],

];

gameConfig.GAME_LINE_WIN_LOWER_LIMIT_CARD_NUMBER_DIAMOND = 2;
gameConfig.GAME_LINE_RULE_DIAMOND = true;
gameConfig.GAME_MULTIPLES_DIAMOND = [];

module.exports = gameConfig;