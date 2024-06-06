const TypeEnum = require("./enum/type");
const CacheUtil = require("./cache_util");
const StringUtil = require("./string_util");
const log = require("../CClass/class/loginfo").getInstand;

exports.guessColor  = async function (socket, color, gameInfo) {
    const num = StringUtil.RandomNumBoth(0, 100);

    const userId = socket.userId;
    const user = gameInfo.userList[userId];

    // 猜花色局累计赢分
    let bWin = user.getBWin() === 0 ? user.getLastTimeRecord()['win'] : user.getBWin();
    // 黑色和红色为当前中奖线奖励的两倍，黑桃、黑梅花、红心、红方块为四倍
    let relColorName = '';
    let relColor = -1;

    if(num < 10 && color !== TypeEnum.ColorType.red && color !== TypeEnum.ColorType.black){
        // 中四倍奖励
        user.setBWin(StringUtil.rideNumbers(4 , bWin, 2));
        bWin =  StringUtil.reduceNumbers((4 * bWin), bWin);
        console.log('猜花色赢:' + user.getBWin())
        relColor = color;
        relColorName = getColorName (relColor);
        await CacheUtil.addGoldCoin(userId, bWin, TypeEnum.ScoreChangeType.guessColor)
    }else if(num < 100 && color === TypeEnum.ColorType.red ||  num < 6 && color === TypeEnum.ColorType.black){
        user.setBWin(StringUtil.rideNumbers(2 , bWin, 2));
        bWin =  StringUtil.reduceNumbers((2 * bWin), bWin);
        console.log('猜花色赢:' + user.getBWin())
        // 显示花色和花色名称
        relColor = getWColor(color);
        relColorName = getColorName (relColor);
        await CacheUtil.addGoldCoin(userId, bWin, TypeEnum.ScoreChangeType.guessColor)
    }else {
        relColor = getFColor(color);
        relColorName = getColorName (relColor);
        console.log('猜花色输:' + bWin)
        // 全输
        await CacheUtil.reduceGoldCoin(userId, bWin, TypeEnum.ScoreChangeType.guessColor)
        user.setBWin(0);
    }

    const card = StringUtil.RandomNumBoth(1, 13);
    log.info(userId + '猜花色输入:' + color + '结果:' + JSON.stringify({code: 1, data: {colorName: relColorName, color: relColor, card: card,  win: user.getBWin()}}))
    socket.emit('guessColorResult', {code: 1, data: {colorName: relColorName, color: relColor, card: card,  win: user.getBWin()}})
}



function getWColor(color){
    let black = [0,1];
    let red = [2,3];
    const name = getColorName (color);
    if(name === '黑'){
        const index = StringUtil.RandomNumBoth(0, 1);
        return black[index];
    }else if(name === '红'){
        const index = StringUtil.RandomNumBoth(0, 1);
        return red[index];
    }
}

// 猜不中
function getFColor (color){
    const name = getColorName (color);
    let arr =  [0,1,2,3];
    let black = [0,1];
    let red = [2,3];
    if(name === '黑'){
        const index = StringUtil.RandomNumBoth(0, 1);
        return red[index];
    }else if(name === '红'){
        const index = StringUtil.RandomNumBoth(0, 1);
        return black[index];
    }else{
        arr = arr.filter(c => c !== color)
        const index = StringUtil.RandomNumBoth(0, 2);
        return arr[index];
    }
}


function getColorName (color){
    let colorName = '';
    switch (color) {
        case TypeEnum.ColorType.blackSpade:
            colorName = '黑桃'
            break;
        case TypeEnum.ColorType.blackPlub:
            colorName = '黑梅花'
            break;
        case TypeEnum.ColorType.redHeart:
            colorName = '红心'
            break;
        case TypeEnum.ColorType.redDiamond:
            colorName = '红方块'
            break;
        case TypeEnum.ColorType.red:
            colorName = '红'
            break;
        case TypeEnum.ColorType.black:
            colorName = '黑'
            break;
        default:
            break;
    }
    return colorName;
}


function getColor (colorName){
    let color = '';
    switch (colorName) {
        case '黑桃':
            color = TypeEnum.ColorType.blackSpade
            break;
        case '黑梅花':
            color = TypeEnum.ColorType.blackPlub
            break;
        case '红心':
            color = TypeEnum.ColorType.redHeart
            break;
        case '红方块':
            color = TypeEnum.ColorType.redDiamond
            break;
        case '红':
            color = TypeEnum.ColorType.red
            break;
        case '黑':
            color = TypeEnum.ColorType.black
            break;
        default:
            break;
    }
    return color;
}


