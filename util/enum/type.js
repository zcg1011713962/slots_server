const GoodsType = {
    gold: 0, // 金币
    diamond: 1, // 钻石
    prop: 2,    // 道具
    monthCard: 3 // 月卡
};


const CurrencyType = {
    Brazil_BRL: 0, // R$雷亚尔
    China_RMB: 1, // RMB人民币
    America_US: 2,    // $美元
};


const EmailType = {
    inform: 0,    // 通知
    award: 1 // 奖励
};


const ShopGroupType = {
    normal: 0, // 正常商品
    rechargeGift: 1 // 首充礼包商品
};


const notifyType = {
    normal: 0, // 普通消息
    vipUpgrade: 1, // VIP升级
    bankTransfer: 2 // 银行转账
};



module.exports = {
    GoodsType,
    CurrencyType,
    EmailType,
    ShopGroupType,
    notifyType
};