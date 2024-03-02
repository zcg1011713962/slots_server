laba_config = {};
//拉把类游戏每条线判断方向
laba_config.GAME_SLOT_LEFT_TO_RIGHT = 0x01;
laba_config.GAME_SLOT_RIGHT_TO_LEFT = 0x02;
laba_config.GAME_SLOT_BOTH_WAY = 0x03;
// 游戏公用奖池
// 游戏奖池
laba_config.game_jackpot_ratio = 0.6
// 活动奖池
laba_config.activity_jackpot_ratio = 0.4
// 游戏奖池划分
laba_config.grand_jackpot_ratio= 0.6;
laba_config.major_jackpot_ratio= 0.4;
laba_config.minor_jackpot_ratio= 0.2;
laba_config.mini_jackpot_ratio= 0.1;

module.exports = laba_config;


