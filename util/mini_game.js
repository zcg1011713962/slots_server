const LABA = require("./laba");
const TypeEnum = require("./enum/type");
const CacheUtil = require("./cache_util");


exports.guessColor  = async function (socket, color, gameInfo) {
    const relColorName = LABA.getRandomColor()
    const relColor = getColor(relColorName);

    // 黑色和红色为当前中奖线奖励的两倍，黑桃、黑梅花、红心、红方块为四倍
    const colorName = getColorName (color);

    const userId = socket.userId;
    const user = gameInfo.userList[userId];
    let win = user.getLastTimeRecord()['win'];
    if (relColorName === colorName) {
        await CacheUtil.addGoldCoin(userId, win, TypeEnum.ScoreChangeType.guessColor)
    } else {
        await CacheUtil.reduceGoldCoin(userId, win, TypeEnum.ScoreChangeType.guessColor)
        win = 0;
    }
    socket.emit('guessColorResult', {code: 1, data: {colorName: relColorName, color: relColor, win: win}})
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
        default:
            break;
    }
    return color;
}


