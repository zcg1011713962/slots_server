class ErrorCode {

    static get SUCCESS() { return { code: 1, msg: '成功' }; }
    static get FAILED() { return { code: 0, msg: '失败' }; }
    static get ERROR() { return { code: 0, msg: '出错了' }; }

    static get CDK_EXPIRE() { return { code: 'E501', msg: '该兑换码已被他人使用，无法再次兑换', langCode: 'languageId_12' }; }
    static get CDK_USERED_ERROR() { return { code: 'E500', msg: '该兑换码已被他人使用，无法再次兑换', langCode: 'languageId_13' }; }
    static get BANK_TRANSFER_CONTENT() { return { code: 'c0002', msg: '银行转账邮件内容' , langCode: 'languageId_52' }; }
    static get NEW_HAND_BIND_CONTENT() { return { code: 'c0004', msg: '新手绑定邮件内容' , langCode: 'languageId_53' }; }
    static get EMAIL_CODE_FAILED() { return { code: 'E403', msg: '输入的验证码不正确，请重新输入', langCode: 'languageId_210' }; }
    static get EMAIL_CODE_EXPIRED() { return { code: 'E402', msg: '验证码已失效，请重新获取', langCode: 'languageId_211' }; }
    static get EMAIL_BINDED() { return { code: 'E405', msg: '此邮箱地址已被其他账号绑定，请使用不同的邮箱进行绑定。', langCode: 'languageId_261'}; }
    static get ERROR_INVITE_CODE() { return { code: 'E502', msg: '错误的邀请码', langCode: 'languageId_316' } ; }
    static get SELF_INVITE_CODE() { return { code: 'E503', msg: '自己的邀请码' , langCode: 'languageId_317' }; }
    static get BANK_TRANSFER_TITLE() { return { code: 'c0001', msg: '银行转账邮件' , langCode: 'languageId_318' }; }
    static get NEW_HAND_BIND_TITLE() { return { code: 'c0003', msg: '新手绑定邮件' , langCode: 'languageId_319' }; }
    static get VIP_ENTER_HALL_NOTIFY() { return { code: 'p0001', msg: 'VIP进大厅跑马灯' , langCode: 'languageId_320' }; }
    static get VIP_UPGRADE_NOTIFY() { return { code: 'p0002', msg: '发送VIP升级通知' , langCode: 'languageId_321' }; }
    static get BANK_TRANSFER_NOTIFY() { return { code: 'p0002', msg: '转账消息通知' , langCode: 'languageId_52' }; }
    static get PWD_ILLEGAL() { return { code: 'E504', msg: '密码长度非法' , langCode: 'languageId_322' }; }
    static get ACCOUNT_EXCEPTION() { return { code: 'E505', msg: '您的账号暂时无法交易，请联系客服' , langCode: 'languageId_323' }; }
    static get EXIST_PWD() { return { code: 'E506', msg: '存在密码请修改密码' , langCode: 'languageId_324' }; }
    static get TWO_TIME_PWD_DIFFER() { return { code: 'E507', msg: '两次密码不一致' , langCode: 'languageId_325' }; }
    static get SELF_INVITE_SELF() { return { code: 'E507', msg: '不能相互绑定' , langCode: 'languageId_326' }; }


    static get USER_OFFLINE() { return { code: 'E100', msg: '用户不在线', langCode: 'languageId_327' }; }
    static get REGISTER_SUCCESS() { return { code: 'R200', msg: '注册成功', langCode: 'languageId_328' }; }
    static get ACCOUNT_REGISTERED_ERROR() { return { code: 'R400', msg: '账号已注册', langCode: 'languageId_329' }; }
    static get EMAIL_CODE_VERIFY_SUCCESS() { return { code: 'E210', msg: '校验成功', langCode: 'languageId_330' }; }
    static get EMAIL_INPUT_ERROR() { return { code: 'E404', msg: '邮箱格式错误', langCode: 'languageId_331' }; }
    static get LOGIN_SUCCESS() { return { code: 'L200', msg: '登录成功' , langCode: 'languageId_332'}; }
    static get LOGIN_FAILED_MAINTAIN() { return { code: 'L400', msg: '游戏正在维护中,稍后重试' , langCode: 'languageId_333'}; }
    static get LOGIN_FAILED_LOGINAGAIN() { return { code: 'L401', msg: '同一帐号连续登录!,必须退出一个游戏才能进入另一个游戏!', langCode: 'languageId_334' }; }
    static get LOGIN_FAILED_INFO_ERROR() { return { code: 'L402', msg: '登录信息有误', langCode: 'languageId_335' }; }
    static get LOGIN_PWD_INFO_ERROR() { return { code: 'L403', msg: '账户密码错误' , langCode: 'languageId_336'}; }
    static get LOGIN_ACCOUNT_NOT_USING() { return { code: 'L404', msg: '账户已停用', langCode: 'languageId_337' }; }
    static get LOGIN_ACCOUNT_NOT_FOUND() { return { code: 'L405', msg: '账户不存在', langCode: 'languageId_338' }; }
    static get LOGIN_ERROR() { return { code: 'L406', msg: '登录错误' , langCode: 'languageId_339'}; }
    static get LOGIN_TOKEN_NOT_FOUND() { return { code: 'L407', msg: 'token过期', langCode: 'languageId_340' }; }
}

module.exports = ErrorCode;