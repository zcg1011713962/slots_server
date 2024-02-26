class ErrorCode {

    static get REGISTER_SUCCESS() { return { code: 'R200', msg: '注册成功' }; }
    static get ACCOUNT_REGISTERED_ERROR() { return { code: 'R400', msg: '账号已注册' }; }
    static get REGISTER_ERROR() { return { code: 'R500', msg: '注册失败' }; }
    static get EMAIL_CODE_SEND_SUCCESS() { return { code: 'E200', msg: '邮箱验证码发送成功' }; }
    static get EMAIL_CODE_VERIFY_SUCCESS() { return { code: 'E210', msg: '邮箱验证码校验成功' }; }
    static get EMAIL_CODE_SEND_FAILED() { return { code: 'E300', msg: '邮箱验证码发送失败' }; }
    static get EMAIL_CODE_INPUT_ERROR() { return { code: 'E401', msg: '验证码输入错误' }; }
    static get EMAIL_CODE_EXPIRED() { return { code: 'E402', msg: '验证码过期，请重新发送' }; }
    static get EMAIL_CODE_FAILED() { return { code: 'E403', msg: '校验验证码失败' }; }
    static get EMAIL_INPUT_ERROR() { return { code: 'E404', msg: '邮箱输入错误' }; }
    static get LOGIN_SUCCESS() { return { code: 'L200', msg: '登录成功' }; }
    static get LOGIN_FAILED_MAINTAIN() { return { code: 'L400', msg: '游戏正在维护中,稍后重试' }; }
    static get LOGIN_FAILED_LOGINAGAIN() { return { code: 'L401', msg: '同一帐号连续登录!,必须退出一个游戏才能进入另一个游戏!' }; }
    static get LOGIN_FAILED_INFO_ERROR() { return { code: 'L402', msg: '登录信息有误' }; }
    static get LOGIN_PWD_INFO_ERROR() { return { code: 'L403', msg: '账户密码错误' }; }
    static get LOGIN_ACCOUNT_NOT_USING() { return { code: 'L404', msg: '账户已停用' }; }
    static get LOGIN_ACCOUNT_NOT_FOUND() { return { code: 'L405', msg: '账户不存在' }; }
    static get LOGIN_ERROR() { return { code: 'L406', msg: '登录错误' }; }
}

module.exports = ErrorCode;