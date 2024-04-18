const LangType = {
    English: 0, // 英语
    Portugal: 1,    // 葡萄牙
    China_Jian: 2 // 中文
};

const GoodsType = {
    gold: 0, // 金币
    diamond: 1, // 钻石
    prop: 2,    // 道具
    monthCard: 3, // 月卡
    turntableTicket: 4 // 免费转盘门票
};


const CurrencyTypeIndex = {
    0: 'BRL' // R$雷亚尔
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

const LotteryResultCode = {
    normal: 1, // 正常返回
    parmsError: -1, // 参数非法
    popFirstRecharge: -2 ,// 输光，弹首充
    popDiscount: -3// 输光了弹限时折扣界面
};


const UndoEvenType ={
    email: 0, // 邮件未读取
    vipDailyGet: 1, // VIP每日奖励领取
    bindPromote: 2, // 推广
    currSignIn: 3, // 签到
    vipMonthlyGet: 4 // VIP每月奖励领取
}


const notifyType = {
    normal: 0, // 普通消息
    vipUpgrade: 1, // VIP升级
    bankTransfer: 2,// 银行转账
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


const PayChannelType ={
    pix: 'pix' // pix
}


const PayStatus ={
    failed: 0,
    success: 1
}



const ScoreChangeType = {
    daySign: 0, // 每日签到
    vipDaylyGet: 1, // vip每日领取
    vipMonthlyGet: 2, // vip每月领取
    luckyCoinGive: 3, // 领取幸运币活动送金币
    inviteBindUser: 4, // 邀请绑定给被邀请用户送金币
    inviteBindAgent: 5, // 邀请绑定给代理人送金币
    newHandGive: 6 ,//新手送金币
    rebateShop: 7,  // 邀请绑定-购物返点
    bustBonus: 8,  // 破产补助金
    upgradeGiveGlod: 9, //VIP升级奖励
    gameGlodCoin: 10, // 玩游戏获得
    storeBuy: 11, // 商城购买
    firstRechargeBuy: 12, //首充礼包购买
    discountLimitedBuy: 13, // 限时折扣购买
    turntable: 14, // 大厅免费转盘获得
    bankIntoHallGold: 15, // 银行取出金币到大厅
    hallGoldIntoBank: 16, // 大厅金币存入银行
    firstRechargeContinueReward: 17  // 首充持续奖励
};

const DiamondChangeType = {
    storeBuy: 0, // 商城购买
    firstRechargeBuy: 1, //首充礼包购买
    firstRechargeContinueReward: 2, // 首充持续奖励
    changleOfficial: 3 // 首充持续奖励
}

const NewHandFlag = {
    new: 1, // 新手
    old: 0, // 非新手
};

const ShopType = {
    store: 0, // 商城
    free_turntable: 1, // 转盘活动
    discount_Limited: 2, // 限时折扣
    firstRecharge: 3, // 首充
};

const NewHandGuideFlow = {
    promoCode: 0, // 推广码填写（终生一次）
    signIn: 1, // 七天签到（每日首次）
    firstRecharge: 2, // 首充（每日首次）
    activityPop: 3, // 活动弹窗（每日首次）
    continueReward: 4// 首充持续奖励（每日首次）
};


const pushFirstRechargeType = {
    winJackpot: '中jackpot',
    vipUpgrade: 'vip升级',
    winScorePop: '历史赢金币满足弹首充条件,只弹一次'
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
    NewHandFlag,
    ShopType,
    NewHandGuideFlow,
    DiamondChangeType,
    UndoEvenType,
    PayChannelType,
    PayStatus,
    CurrencyTypeIndex,
    pushFirstRechargeType,
    LotteryResultCode
};