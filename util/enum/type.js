const LangType = {
    English: 0, // 英语
    Portugal: 1,    // 葡萄牙
    China_Jian: 2 // 中文
};

const GoodsType = {
    gold: 0, // 金币
    diamond: 1, // 钻石
    prop: 2,    // 道具
    monthCard: 3 // 月卡
};


const CurrencyType = {
    Brazil_BRL: 'BRL' // R$雷亚尔
  /*  China_RMB: 1, // RMB人民币
    America_US: 2,    // $美元*/
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


const VipGetGoldType = {
    dailyGet: 0, // 每日
    monthlyGet: 1, // 每月
};

const TurntableGameMode = {
    free: 0, // 免费
    charge: 1, // 收费
};


const GameType = {
    laba_normal: 0, // 普通拉霸
    laba_sequence: 1, // 数列型拉霸
    laba_single: 2 // 特殊单线拉霸
};



const ScoreChangeType = {
    daySign: 0, // 每日签到
    vipDaylyGet: 1, // vip每日领取
    vipMonthlyGet: 2, // vip每月领取
    luckyCoinGive: 3, // 领取幸运币活动送金币
    inviteBindUser: 4, // 邀请绑定给被邀请用户送金币
    inviteBindAgent: 5, // 邀请绑定给代理人送金币
    newHandGive: 6 ,//新手送金币
    rebateShop: 7  // 邀请绑定-购物返点
};

const NewHandFlag = {
    new: 1, // 新手
    old: 0, // 非新手
};


module.exports = {
    GoodsType,
    CurrencyType,
    EmailType,
    ShopGroupType,
    notifyType,
    AgentRebateType,
    AgentRebateStatus,
    LangType,
    VipGetGoldType,
    TurntableGameMode,
    GameType,
    ScoreChangeType,
    NewHandFlag
};