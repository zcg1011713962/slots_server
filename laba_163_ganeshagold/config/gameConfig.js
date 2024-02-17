var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 263;			//第几个游戏ID
gameConfig.serverId = 15163;		//当前游戏的第几台服务器
gameConfig.logflag = 15163;			//游戏记录表示
gameConfig.port = 15163;			//游戏记录表示
gameConfig.gameName = "ganeshagold";
gameConfig.sendMessage_mul = 5;

//筹码
gameConfig.coinConfig = [1, 10, 100, 1000, 10000];
gameConfig.tax = 1;

gameConfig.seatMax = 30;
gameConfig.tableMax = 10;

gameConfig.LoginServeSign = "slel3@lsl334xx,deka";


//每日获得金币签到活动
gameConfig.everyWinCoinActivity = true;
//等级
gameConfig.lvActivity = true;


gameConfig.GAME_HAND_CARDS_NUMBER_DIAMOND = 15;				// 卡片总数
gameConfig.GAME_HAND_CARDS_Column = 5;						// 列
gameConfig.GAME_HAND_CARDS_Row = 3;							// 行
gameConfig.GAME_HAND_CARDS_LowerLimit = 3;					// 一条线上最少连线的数量
gameConfig.GAME_HAND_CARDS_No_Magic_Column_List = [1];		// 不会出现万能牌的列
gameConfig.GAME_GOLD_Single = 30;							// 单注金额
gameConfig.GAME_MAGIC_CARD_DIAMOND = [9, 9, 9, 9, 9];	// 万能牌


gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = 8;					// 免费牌
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = -1;					// 大奖牌
gameConfig.GAME_COLORS_DIAMOND = [							// 默认牌花色
    0, 1, 2, 3, 4, 5, 6, 7, 8, gameConfig.GAME_MAGIC_CARD_DIAMOND[0]
];
gameConfig.Free_GAME_COLORS_DIAMOND = [						// 免费模式花色
    0, 1, 2, 3, 4, 5, 6, 7, 8, gameConfig.GAME_MAGIC_CARD_DIAMOND[0]
];

gameConfig.GAME_COMBINATIONS_DIAMOND = [
    {3: 10, 4: 20, 5: 100},		// hand cards no fix line 0
    {3: 10, 4: 20, 5: 100},		// hand cards no fix line 1
    {3: 15, 4: 30, 5: 125},		// hand cards no fix line 2
    {3: 15, 4: 30, 5: 125},		// hand cards no fix line 3
    {3: 30, 4: 100, 5: 200},	// hand cards no fix line 4
    {3: 40, 4: 100, 5: 250},	// hand cards no fix line 5
    {3: 50, 4: 150, 5: 300},	// hand cards no fix line 6
    {3: 75, 4: 150, 5: 400},	// hand cards no fix line 7
    {3: 0, 4: 0, 5: 0},	    // hand cards no fix line 8
    {3: 0, 4: 0, 5: 0},	    // hand cards no fix line 9
];

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