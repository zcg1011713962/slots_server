var laba_config = require('../../util/config/laba_config');

gameConfig = {};
gameConfig.gameId = 263;			//第几个游戏ID
gameConfig.serverId = 15163;		//当前游戏的第几台服务器
gameConfig.logflag = 15163;			//游戏记录表示
gameConfig.port = 15163;			//游戏记录表示
gameConfig.gameName = "ganeshagold";
gameConfig.sendMessage_mul = 5;

gameConfig.LoginServeSign = "slel3@lsl334xx,deka";

gameConfig.GAME_GOLD_Single = 30;	// 单注金额

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

//# 翻牌子对应颜色倍数
gameConfig.GAME_DIAMOND_TURN_OVER_CARD = {
    1: 10,
    2: 100,
    3: 1000,
};

module.exports = gameConfig;