var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 285;			//第几个游戏ID
gameConfig.serverId = 15185;		//当前游戏的第几台服务器
gameConfig.logflag = 15185;		//游戏记录表示
gameConfig.port = 15185;		//游戏记录表示
gameConfig.gameName = "BuffaloKing";
gameConfig.sendMessage_mul = 5;

gameConfig.LoginServeSign = "slel3@lsl334xx,deka";

gameConfig.GAME_GOLD_Single = 40;
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

module.exports = gameConfig;