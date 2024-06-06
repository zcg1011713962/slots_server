const ColorType = {
    blackSpade: 0, // 黑桃
    blackPlub: 1,  // 黑梅花
    redHeart: 2, // 红心
    redDiamond: 3, // 红方块
    red: 4, // 红
    black: 5 // 黑
};


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
    withdrawLimit: 5, // 提现额度
    turntableTime: 6, // 转盘次数
    vipScore: 7, // vip点数
    withdrawTime: 8, // 提现次数
    silverCoin: 9, // 银币
    mixture: 99 // 混合
};

const CurrencyTypeIndex = {
    Brazil_BRL: 0, // R$雷亚尔
    Indian_Rupee: 1 // ₹卢比
};

const CurrencyType = {
    Default: 'BRL', // R$雷亚尔
    Brazil_BRL: 'BRL', // R$雷亚尔
    Indian_Rupee: 'IR' // ₹卢比
};


const EmailType = {
    transfer_inform: 0,    // 转账通知
    agent_bind_inform: 1, // 新手绑定通知
    first_recharge_continue_award: 2, // 首充持续奖励
    rank_award: 3, // 排行榜奖励
    withdraw: 4, // 提现成功
    withdrawFailed: 5 // 提现失败被拒
};


const ShopGroupType = {
    normal: 0, // 普通商品
    rechargeGift: 1 // 首充礼包商品
};

const LotteryResultCode = {
    normal: 1, // 正常返回
    parmsError: -1, // 参数非法系统错误
    popFirstRecharge: -2 ,// 输光，弹首充
    popDiscount: -3// 输光了弹限时折扣界面
};


const UndoEvenType ={
    email: 0, // 邮件未读取
    vipDailyGet: 1, // VIP每日奖励领取
    bindPromote: 2, // 推广
    currSignIn: 3, // 签到
    vipMonthlyGet: 4, // VIP每月奖励领取
    gameCountGet: 5, // 完成游戏局数红点推送
    freeCoinGet: 6 // 免费金币到时间领取
}


const notifyType = {
    normal: 0, // 普通消息
    vipUpgrade: 1, // VIP升级
    bankTransfer: 2,// 银行转账
    vipEnterHall: 3, // VIP进大厅
    hitJackpot: 4, // 击中奖池
    bigWin: 5, // 一把赢的金币大于配置
    withdraw: 6 // 提现成功
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
    laba_single: 2, // 特殊单线拉霸
    mixFootball: 3 // 混合足球
};


const PayChannelType ={
    pix: 'pix', // pix
    apnapay: 'apnapay'
}

const ScoreChangeType = {
   /* daySign: 0, // 每日签到
    vipDaylyGet: 1, // vip每日领取
    vipMonthlyGet: 2, // vip每月领取
    luckyCoinGive: 3, // 领取幸运币活动送金币
    inviteBindUser: 4, // 邀请绑定给被邀请用户送金币
    inviteBindAgent: 5, // 邀请绑定给代理人送金币*/
    newHandGive: 6 ,//新手送金币
   /* rebateShop: 7,  // 邀请绑定-购物返点*/
    bustBonus: 8,  // 破产补助金
   /* upgradeGiveGlod: 9, //VIP升级奖励*/
    gameGlodCoin: 10, // 玩游戏获得
    storeBuy: 11, // 商城购买
    firstRechargeBuy: 12, //首充礼包购买
    discountLimitedBuy: 13, // 限时折扣购买
    turntable: 14, // 大厅免费转盘获得
    bankIntoHallGold: 15, // 银行取出金币到大厅
    hallGoldIntoBank: 16, // 大厅金币存入银行
    firstRechargeContinueReward: 17,  // 首充持续奖励
    withdrawApply: 18,  // 提现申请扣减
    withdrawApplyBack: 19,  // 提现申请不通过,退回
   /* coinRankAward: 20,  // 金币排行榜奖励
    rechargeRankAward: 21,  // 充值排行榜奖励
    bigWinRankAward: 22,  // 大富豪排行榜奖励*/
    withdrawGoodsBuy: 23,  // 解锁提现商品
    exchange: 24,  // 银币兑换金币
    monthCardBuy: 25, //月卡购买
    guessColor: 26, //游戏猜花色
};


const SilverCoinChangeType = {
    storeBuy: 0, // 商城购买
    firstRechargeBuy: 1,  // 首充购买
    discountLimitedBuy: 2,  //  限时折扣购买
    turntableBuy: 3,  //  转盘购买
    monthCardBuy: 4, // 月卡购买
    withdrawGoodsBuy: 5, // 解锁提现商品购买
    daySign: 6, // 每日签到
    vipDaylyGet: 7, // vip每日领取
    vipMonthlyGet: 8, // vip每月领取
    luckyCoinGive: 9, // 领取幸运币活动送金币
    inviteBindUser: 10, // 邀请绑定给被邀请用户送金币
    inviteBindAgent: 11, // 邀请绑定给代理人送金币
    rebateShop: 12,  // 邀请绑定-购物返点
    upgradeGiveGlod: 13, //VIP升级奖励
    coinRankAward: 14,  // 金币排行榜奖励
    rechargeRankAward: 15,  // 充值排行榜奖励
    bigWinRankAward: 16,  // 大富豪排行榜奖励
    changleOfficial: 17, // 绑定邮箱
    firstRechargeContinueReward: 18, // 首充持续奖励
    exchange: 19,  // 银币兑换减少
    turntable: 20, // 大厅免费转盘获得
}

const DiamondChangeType = {
    storeBuy: 0, // 商城购买
    firstRechargeBuy: 1, //首充礼包购买
    firstRechargeContinueReward: 2, // 首充持续奖励
    changleOfficial: 3 // 绑定邮箱
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
    withdraw_goods: 4, // 解锁提现商品
    month_card_goods: 5, // 月卡商品
    exchangeGoods: 6 // 兑换类商品
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
    payTimeOut: -99, // 超时未查询到支付成功状态
    orderNotExist: -98 // 订单不存在
};
const pushFirstRechargeType = {
    winJackpot: '中jackpot',
    vipUpgrade: 'vip升级',
    winScorePop: '历史赢金币满足弹首充条件,只弹一次'
};



const PayType = {
    betcatpay: 0, // pix betcatpay巴西支付
    fatpag: 1, // fastPay 巴西支付
    apnaPay: 2 // apnaPay 印度支付
};

const CountryType = {
    yd: 'yd',
    bx: 'bx',
};


const dotEnum = {
    recharge: 'g5qi4w', // 充值
    recharge_arrive: 'gg48nw' // 充值成功
}

const DotNameEnum = {
    register: 'register', // 注册
    login: 'login', // 登录
    first_recharge: 'first_recharge', // 首充提交订单
    first_recharge_arrive: 'first_recharge_arrive', // 首充成功
    recharge: 'recharge', // 复充提交订单
    recharge_arrive: 'recharge_arrive', // 复充成功
    withdraw: 'withdraw', // 赠币提交订单
    withdraw_arrive: 'withdraw_arrive', // 赠币成功
    bind_card: 'bind_card', // 绑卡
    login_game: 'login_game', // 进入游戏
    total_login_success: 'total_login_success', // 登录成功总数
}

const RankType = {
    coin: 0, // 金币排行
    recharge: 1, // 充值排行
    bigwin: 2 // 大富豪排行
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
	dotEnum,
 	UndoEvenType,
    PayChannelType,
    CurrencyTypeIndex,
    pushFirstRechargeType,
    LotteryResultCode,
 	OrderStatus,
    PayType,
    RankType,
    SilverCoinChangeType,
    CountryType,
    DotNameEnum,
    ColorType
};