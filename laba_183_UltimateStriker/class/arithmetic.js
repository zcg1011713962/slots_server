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


//算法特殊，单独写在游戏中
    this.newAnalyse = function (dictAnalyseResult, nHandCards, nMagicCard, nFreeCard, nLowerLimit, nColumnNumber, nBet, game_odds, GOLD_Single) {
        /*
            列数判断型拉把算法
            :param nHandCards: 手牌
            :param nMagicCard: 万能牌的值
            :param nLowerLimit: 一条线上最少连线的数量
            :param nColumnNumber: 手牌总共多少列
            :param nBet: 下注倍数
            :param game_odds: 花色对应赔率
            :param free_num: 免费次数
            :param free_multiple:免费倍数
         */
        let now_time = Number(new Date());
        let result = {};
        //# 校验手牌是否满足列数
        //# 生成列的结合
        let idx = 0;
        let columns = [];
        while (idx < nColumnNumber) {
            let column = [];
            for (let str_j in nHandCards) {
                let j = parseInt(str_j);
                if (j % nColumnNumber === idx) {
                    column.push(j);
                }
            }
            if (idx > 0 && idx < 5) {
                column.push(nHandCards.length + idx);
            }
            columns.push(column);
            idx++;
        }
        //# 可以连接的列
        var nWinLines = [];
        var nIndex = 0;
        for (let column_index in columns) {
            let column = columns[parseInt(column_index)];
            nIndex++;
            //# 初始化为第一列
            if (nWinLines.length === 0) {
                for (let i_idx in column) {
                    let nWinLine = [];
                    nWinLine.push(column[parseInt(i_idx)]);
                    nWinLines.push(nWinLine);
                }
            } else {
                //# 遍历nWinLines 和 column 判断是否可以连线
                for (let i_idx in column) {
                    let i = column[parseInt(i_idx)];
                    for (let w_l_idx in nWinLines) {
                        let nWinLine = nWinLines[parseInt(w_l_idx)];
                        //# 存放中奖线的牌的花色
                        let nWinLineCards = [];
                        for (let n_idx in nWinLine) {
                            let n = nWinLine[parseInt(n_idx)];
                            nWinLineCards.push(nHandCards[n])
                        }
                        let target = nHandCards[i];
                        // # 用nWinLine的最后一位和 column中的角标比较，如果值相等的话将角标添加到nWinLine中
                        if (nWinLineCards.indexOf(target) > -1 || target === nMagicCard) {
                            let temp = [];
                            //# 复制出当前的nWinLine
                            for (let m in nWinLine) {
                                temp.push(nWinLine[parseInt(m)]);
                            }
                            //# 如果nWinLine的长度比列数少一位则满足条件，将角标i添加到新的nWinLine中，然后将nWinLine添加到列表nWinLine中
                            if (temp.indexOf(i) === -1 && nWinLine.length + 1 === nIndex) {
                                temp.push(i);
                                nWinLines.push(temp);

                            }
                        }
                    }

                }
            }

        }
        //# 遍历nWinLines，将包含于其他线中的线（之前判断的老线）和长度不满足最短连线要求的线删除
        let bFlage = true;
        while (bFlage) {
            bFlage = false;
            for (let w_l_idx in nWinLines) {
                let nWinLine = nWinLines[parseInt(w_l_idx)];
                for (let wl_idx in nWinLines) {
                    let line = nWinLines[parseInt(wl_idx)];
                    if (es6_set(nWinLine).length < es6_set(line).length || nWinLine.length < nLowerLimit) {
                        // nWinLines.remove(nWinLine)
                        list_remove(nWinLine, nWinLines);
                        bFlage = true;
                        break
                    }
                }
            }
        }
        //# 根据下注倍数计算每条线
        let AllWinNum = 0;          //# 赢钱总数
        let WinLinesList = [];      //# 获奖线和金额
        let AllWinLinesList = [];   //# 所有中奖位置

        //# 判断赢线里有没有免费牌中奖 有没有万能牌代替免费牌 有的话删除中奖线
        // console.log("nWinLines----------------------0")
        // console.log(nWinLines)
        if (nWinLines.length > 0) {
            for (let i_idx in nWinLines) {
                let is_free_card = false;
                let is_magic_card = false;
                for (let j_idx in nWinLines[i_idx]) {
                    let j = nWinLines[i_idx][j_idx];
                    let target = nHandCards[j];
                    if (target === nFreeCard) {
                        is_free_card = true;
                    } else if (target === nMagicCard) {
                        is_magic_card = true;
                    }
                }
                if (is_free_card) {
                    nWinLines[i_idx] = [];
                }
                if (is_free_card && is_magic_card) {
                    let target1 = nHandCards[nWinLines[i_idx][1]];
                    let target2 = nHandCards[nWinLines[i_idx][2]];
                    let target3 = nHandCards[nWinLines[i_idx][3]];
                    let target4 = nHandCards[nWinLines[i_idx][4]];
                    if (target1 === nMagicCard) {
                        nWinLines[i_idx] = [];
                    } else if (target2 === nMagicCard) {
                        nWinLines[i_idx] = [];
                    } else if (target3 === nMagicCard) {
                        nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2]];
                    } else if (target4 === nMagicCard) {
                        nWinLines[i_idx] = [nWinLines[i_idx][0], nWinLines[i_idx][1], nWinLines[i_idx][2], nWinLines[i_idx][3]];
                    }

                }
            }
            // console.log("nWinLines----------------------")
            // console.log(nWinLines)
            for (let x_idx in nWinLines) {
                let x = nWinLines[parseInt(x_idx)];
                if (!x) {
                    // nWinLines.remove(x)
                    list_remove(x, nWinLines);
                }
            }

        }
        if (nWinLines.length > 0) {
            for (let x_idx in nWinLines) {
                let x = nWinLines[parseInt(x_idx)];
                let cards_index = x[0];
                if (cards_index || cards_index === 0) {
                    let card = nHandCards[cards_index];
                    let win_num = 0;
                    win_num = game_odds[card][x.length] * nBet;

                    AllWinNum += win_num;
                    let win_line = [];
                    for (let i_idx in nHandCards) {
                        let i = parseInt(i_idx);
                        if (x.indexOf(i) > -1) {
                            win_line.push(true);
                        } else {
                            win_line.push(false);
                        }
                    }
                    WinLinesList.push({"win_num": win_num, "win_line": win_line});
                }
            }

            for (let i_idx in nHandCards) {
                AllWinLinesList.push(false)
            }
            for (let i_idx in nWinLines) {
                let nWinLineDetail = nWinLines[parseInt(i_idx)];
                for (let o_idx in nWinLineDetail) {
                    let o = nWinLineDetail[o_idx];
                    if (o < nHandCards.length) {
                        AllWinLinesList[o] = true;
                    }

                }

            }
        }
        dictAnalyseResult["nHandCards"] = nHandCards;  //# 手牌
        dictAnalyseResult["nAllWinLines"] = WinLinesList; //# 获胜线具体
        dictAnalyseResult["nWinLinesDetail"] = nWinLines; //# 获胜线
        // result["nBet"] = nBet  //# 下注
        dictAnalyseResult["win"] = AllWinNum; //# 赢钱总数
        dictAnalyseResult["nWinCards"] = AllWinLinesList; //# 总获胜线
        dictAnalyseResult["getOpenBox"] = {"bFlag": false, "nWinOpenBox": 0, "win": 0}; //# 开箱子
        dictAnalyseResult["getFreeTime"] = {"bFlag": false, "nFreeTime": 0};  //# 免费次数
        dictAnalyseResult["nBetTime"] = now_time; //# 时间戳

        return dictAnalyseResult;
    };

    this.init();
}


function es6_set(arr) {
    //es6 数组去重
    return Array.from(new Set(arr));
}

function list_remove(val, list) {
    //数组去除指定元素
    //用法 list.remove(元素)
    var index = list.indexOf(val);
    if (index > -1) {
        list.splice(index, 1);
    }
}


module.exports = arithmetic;