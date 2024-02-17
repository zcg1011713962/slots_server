const gameDao = require("./../dao/gameDao");
const redis_laba_win_pool = require("./../../util/redis_laba_win_pool");
const log = require("../../CClass/class/loginfo").getInstand;

arithmetic = function (_idx) {
    //本算法说明，先选中组合，然后再尝试他的概率。
    const betCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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

    //获得实际奖池
    this.getScorePoolList = function () {
        return this.score_pool;
    }
    this.getScoreId = function () {
        return betCount;
    }

    this.getGamblingBalanceGold = function () {
        //获取库存 奖池
        return {
            nGamblingBalanceGold: this.nGamblingBalanceGold
        }
    }
    this.addGamblingBalanceGold = function (Gold, Pool) {
        // 添加库存 奖池   数据库同步使用
        this.nGamblingBalanceGold += parseInt(Gold);
        // redis存储奖池
        redis_laba_win_pool.redis_win_pool_incrby(parseInt(Pool));
        log.info("添加库存:" + Gold + "当前库存" + this.nGamblingBalanceGold);
        log.info("添加奖池:" + Pool);
    }
    this.subGamblingBalanceGold = function (Gold, Pool) {
        //减少库存 奖池
        log.info("减少库存:" + Gold +  "库存" + this.nGamblingBalanceGold);
        log.info("减少奖池:" + Pool);
        //redis奖池
        redis_laba_win_pool.redis_win_pool_decrby(parseInt(Pool))
    }
    this.getGamblingBalanceLevelBigWin = function () {
        //获取库存 水位 幸运值  判断中奖使用
        return {
            nGamblingWaterLevelGold: this.nGamblingWaterLevelGold,
            nGamblingBalanceGold: this.nGamblingBalanceGold,
            nGamblingBigWinLevel: this.nGamblingBigWinLevel,
            nGamblingBigWinLuck: this.nGamblingBigWinLuck,
            expectRTP: this.expectRTP
        }
    }

    this.init = function () {
        //初始化水位和库存
        this.initGamblingGame();
    }

    this.initGamblingGame = function () {
        const self = this;
        gameDao.getGamblingGame(function (Result) {
            self.nGamblingWaterLevelGold = Result[0].nGamblingWaterLevelGold;  //水位
            self.nGamblingBalanceGold = Result[0].nGamblingBalanceGold;      //库存
            self.nGamblingBigWinLevel = Result[0].nGamblingBigWinLevel.split(',').map(Number);  //大奖幸运等级
            self.nGamblingBigWinLuck = Result[0].nGamblingBigWinLuck.split(',').map(Number);    //大奖幸运概率
            self.nGamblingBigWinLuck = Result[0].nGamblingBigWinLuck.split(',').map(Number);    //大奖幸运概率
            self.expectRTP = Result[0].expectRTP;

            console.log("读取采池数据完毕!");
            console.log("水位:" + self.nGamblingWaterLevelGold);
            console.log("库存:" + self.nGamblingBalanceGold);
            console.log("大奖幸运等级:" + self.nGamblingBigWinLevel);
            console.log("大奖幸运概率:" + self.nGamblingBigWinLuck);
        });
    }
    this.init();
}

module.exports = arithmetic;