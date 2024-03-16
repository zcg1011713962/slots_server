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
    transfer_inform: 0,    // 转账通知
    agent_bind_inform: 1 // 新手绑定通知
};


const ShopGroupType = {
    normal: 0, // 正常商品
    rechargeGift: 1 // 首充礼包商品
};


const notifyType = {
    normal: 0, // 普通消息
    vipUpgrade: 1, // VIP升级
    bankTransfer: 2 ,// 银行转账
    vipEnterHall: 3 // VIP进大厅
};

const AgentRebateType = {
    bindInviteCode: 0, // 绑定邀请码
    recharge: 1 // 充值
};

const AgentRebateStatus = {
    unissued: 0, // 待发放
    success: 1, // 发放成功
    failed: 2 // 发放失败
};

module.exports = {
    GoodsType,
    CurrencyType,
    EmailType,
    ShopGroupType,
    notifyType,
    AgentRebateType,
    AgentRebateStatus
};