const RedisUtil = require("./redis_util");
const redis_laba_win_pool = require("./redis_laba_win_pool");
const laba_config = require("./config/laba_config");
const log = require("../CClass/class/loginfo").getInstand;

exports.doLottery  = function doLottery(socket, nBetSum, jackpot_ratio, gameInfo){
    redis_laba_win_pool.get_redis_win_pool().then(function (jackpot) {
        // 是否配牌
        const icon_type_bind_redis_key = "icon_type_bind_key" + gameInfo.serverId;
        RedisUtil.get(icon_type_bind_redis_key).then(function (key) {
            try {
                const redisIconTypeBind = key ? JSON.parse(key) : null;
                // 游戏奖池
                let gameJackpot = jackpot ? jackpot * laba_config.game_jackpot_ratio : 0;
                // 摇奖
                const result = gameInfo.lottery(socket.userId, nBetSum, gameJackpot, redisIconTypeBind);
                log.info('摇奖结果' + JSON.stringify(result));

                if (result.code < 1) {
                    socket.emit('lotteryResult', {ResultCode: result.code});
                } else {
                    socket.emit('lotteryResult', {
                        ResultCode: result.code,
                        ResultData: {
                            userscore: result.userscore,
                            winscore: result.winscore,
                            viewarray: result.viewarray,
                            winfreeCount: result.winfreeCount,
                            freeCount: result.freeCount,
                            score_pool: result.score_pool,
                            grand_jackpot: (gameJackpot * jackpot_ratio[0]).toFixed(2),
                            major_jackpot: (gameJackpot * jackpot_ratio[1]).toFixed(2),
                            minor_jackpot: (gameJackpot * jackpot_ratio[2]).toFixed(2),
                            mini_jackpot: (gameJackpot * jackpot_ratio[3]).toFixed(2),
                        }
                    });
                }
            }catch (e) {
                log.err(e);
            }
        });
    });
}