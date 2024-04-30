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
    turntableTicket: 4, // 免费转盘门票
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

const UndoEvenType ={
    email: 0 // 邮件未读取
}


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


const OrderStatus = {
    create: 0, // 订单生成
    paying: 1, // 支付中
    payedNotify: 2, // 支付未通知
    payedUnNotify: 3, // 支付已通知
    payFailed: -1, // 交易失败
    payExpired: -2, // 交易过期
    payReturn: -3, // 交易退还
    payExcept: -4, // 交易异常
    payTimeOut: -99 // 超时未查询到支付成功状态
};



const OrderType = {
    betcatpay: 0, // betcatpay支付
    fatpag: 1 // fatpag支付
};


const dotEnum = {
    register: 'nvixl1', // 发起注册
    login: 't93b78', // 登录
    star_game_100: 'ywt0mq', // 玩家累计游戏局数,玩游戏累计满5局
    toatl_jackpot: 'xhp537' ,// 总击中奖池
    total_code_success: 'gvgu9g', // 绑定成功
    gold_code_success: 'lc2x0f', // 推广发送金币成功
    recharge: 'g5qi4w', // 充值
    recharge_arrive: 'gg48nw' // 充值成功
}

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
    OrderStatus,
    OrderType,
    dotEnum
};