var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 285;			//第几个游戏ID
gameConfig.serverId = 15185;		//当前游戏的第几台服务器
gameConfig.logflag = 15185;		//游戏记录表示
gameConfig.port = 15185;		//游戏记录表示
gameConfig.gameName = "BuffaloKing";
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


gameConfig.GAME_HAND_CARDS_NUMBER_DIAMOND = 24;				// 卡片总数
gameConfig.GAME_HAND_CARDS_Column = 6;						// 列
gameConfig.GAME_HAND_CARDS_Row = 4;							// 行
gameConfig.GAME_HAND_CARDS_LowerLimit = 3;					// 一条线上最少连线的数量
gameConfig.GAME_HAND_CARDS_No_Magic_Column_List = [1];		// 不会出现万能牌的列
gameConfig.GAME_GOLD_Single = 40;							// 单注金额
gameConfig.GAME_IS_FIX_LINE = false;						// 是否固定线数
gameConfig.GAME_IS_ADD_MAGIC_CARD = false;					// 是否多加万能牌
gameConfig.GAME_ADD_MAGIC_CARD_NUMBER = 4;					// 随机多加万能牌的最大数量
gameConfig.GAME_MAGIC_CARD_DIAMOND = 12;				    // 万能牌

gameConfig.GAME_FREE_TIMES_CARD_DIAMOND = 11;				// 免费牌
gameConfig.GAME_OPEN_BOX_CARD_DIAMOND = -1;					// 大奖牌
gameConfig.GAME_COLORS_DIAMOND = [							// 默认牌花色
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, gameConfig.GAME_FREE_TIMES_CARD_DIAMOND, gameConfig.GAME_MAGIC_CARD_DIAMOND
];
gameConfig.Free_GAME_COLORS_DIAMOND = [						// 免费模式花色
    0, 1, 2, 3, 4, 5, 6, 7, 8, 10, gameConfig.GAME_MAGIC_CARD_DIAMOND
];

gameConfig.GAME_COMBINATIONS_DIAMOND = [
    {3: 1, 4: 2, 5: 4, 6: 8},		// hand cards no fix line 0
    {3: 1, 4: 2, 5: 4, 6: 8},		// hand cards no fix line 1
    {3: 1, 4: 3, 5: 6, 6: 10},		// hand cards no fix line 2
    {3: 1, 4: 3, 5: 6, 6: 10},		// hand cards no fix line 3
    {3: 2, 4: 4, 5: 8, 6: 12},		// hand cards no fix line 4
    {3: 2, 4: 4, 5: 8, 6: 12},		// hand cards no fix line 5
    {3: 4, 4: 8, 5: 12, 6: 20},     // hand cards no fix line 6
    {3: 4, 4: 8, 5: 12, 6: 20},	    // hand cards no fix line 7
    {3: 6, 4: 10, 5: 20, 6: 25},	// hand cards no fix line 8
    {3: 6, 4: 10, 5: 20, 6: 25},	// hand cards no fix line 9
    {3: 8, 4: 20, 5: 25, 6: 30},	// hand cards no fix line 10
    {3: 0, 4: 0, 5: 0, 6: 0},	    // hand cards no fix line 11
    {3: 0, 4: 0, 5: 0, 6: 0},       // hand cards no fix line 12
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