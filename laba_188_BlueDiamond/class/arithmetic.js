const gameDao = require("../../util/dao/gameDao");
const redis_laba_win_pool = require("./../../util/redis_laba_win_pool");
const log = require("../../CClass/class/loginfo").getInstand;

arithmetic = function (_idx) {
	// 水位
	this.nGamblingWaterLevelGold = 0;
	// 库存
	this.nGamblingBalanceGold = 0;
	//大奖幸运等级
	this.nGamblingBigWinLevel = [];
	//大奖幸运概率
	this.nGamblingBigWinLuck = [];
	// 期望RTP
	this.expectRTP = 90;

	this.getGamblingBalanceGold = function () {
		//获取库存 奖池
		return {
			nGamblingBalanceGold: this.nGamblingBalanceGold,
			nSysBalanceGold: this.nSysBalanceGold
		}
	}
}

module.exports = arithmetic;