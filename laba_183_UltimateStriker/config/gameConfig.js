
gameConfig = {};
gameConfig.gameId = 283;			//第几个游戏ID
gameConfig.serverId = 15183;		//当前游戏的第几台服务器
gameConfig.logflag = 15183;		//游戏记录表示
gameConfig.port = 15183;		//游戏记录表示
gameConfig.gameName = "UltimateStriker";
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

gameConfig.GAME_HAND_CARDS_NUMBER_DIAMOND = 20;
gameConfig.GAME_HAND_CARDS_Column = 6;						// 列
gameConfig.GAME_HAND_CARDS_Row = 6;							// 行
gameConfig.GAME_HAND_CARDS_LowerLimit = 3;					// 一条线上最少连线的数量
gameConfig.GAME_HAND_CARDS_No_Magic_Column_List = [1, 6];	// 不会出现万能牌的列
gameConfig.GAME_GOLD_Single = 20;							// 单注倍率

gameConfig.GAME_MAGIC_CARD_DIAMOND = 12;	                // 万能牌
gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = 11;			    // 免费牌
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = -1;					// 大奖牌
gameConfig.GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, gameConfig.GAME_FREE_TIMES_CARD_DIAMOND, gameConfig.GAME_MAGIC_CARD_DIAMOND];
gameConfig.Free_GAME_COLORS_DIAMOND = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, gameConfig.GAME_FREE_TIMES_CARD_DIAMOND, gameConfig.GAME_MAGIC_CARD_DIAMOND];

gameConfig.GAME_COMBINATIONS_DIAMOND = [
    {3: 1, 4: 2, 5: 3, 6: 4},		// hand cards no fix line 0
    {3: 1, 4: 2, 5: 3, 6: 4},		// hand cards no fix line 1
    {3: 1, 4: 2, 5: 3, 6: 4},		// hand cards no fix line 2
    {3: 2, 4: 3, 5: 5, 6: 8},		// hand cards no fix line 3
    {3: 2, 4: 3, 5: 5, 6: 8},	    // hand cards no fix line 4
    {3: 8, 4: 10, 5: 15, 6: 20},	// hand cards no fix line 5
    {3: 8, 4: 10, 5: 15, 6: 20},	// hand cards no fix line 6
    {3: 10, 4: 15, 5: 20, 6: 30},	// hand cards no fix line 7
    {3: 15, 4: 20, 5: 25, 6: 50},	// hand cards no fix line 8
    {3: 20, 4: 30, 5: 40, 6: 60},	// hand cards no fix line 9
    {3: 30, 4: 40, 5: 50, 6: 80},	// hand cards no fix line 10
    {3: 0, 4: 0, 5: 0, 6: 0},	    // hand cards no fix line 11
    {3: 0, 4: 0, 5: 0, 6: 0},	    // hand cards no fix line 12
];

gameConfig.GAME_LINE_WIN_LOWER_LIMIT_CARD_NUMBER_DIAMOND = 3;
gameConfig.GAME_LINE_RULE_DIAMOND = true;
gameConfig.GAME_MULTIPLES_DIAMOND = [];
//# 翻牌子对应颜色倍数
gameConfig.GAME_DIAMOND_TURN_OVER_CARD = {
    1: 10,
    2: 100,
    3: 1000,
};

gameConfig.CARD_ORDERING = [
    [[0, 1], [2, 3]],
    [[0, 1], [3, 4]],
    [[0, 1], [4, 5]],
    [[1, 2], [3, 4]],
    [[1, 2], [4, 5]],
    [[2, 3], [4, 5]],
    [[0, 1], [2, 3, 4]],
    [[0, 1], [3, 4, 5]],
    [[1, 2], [3, 4, 5]],
    [[0, 1, 2], [3, 4]],
    [[0, 1, 2], [4, 5]],
    [[1, 2, 3], [4, 5]],
    [[0, 1], [2, 3, 4, 5]],
    [[0, 1, 2, 3], [4, 5]],
];

module.exports = gameConfig;