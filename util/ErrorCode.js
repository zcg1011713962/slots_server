class ErrorCode {

    static get SUCCESS() { return { code: 1, msg: '成功' }; }

    static get FAILED() { return { code: 0, msg: '失败' }; }
    static get ERROR() { return { code: 0, msg: '出错了' }; }
    static get USER_OFFLINE() { return { code: 0, msg: '用户不在线' }; }



    static get REGISTER_SUCCESS() { return { code: 'R200', msg: '注册成功' }; }
    static get ACCOUNT_REGISTERED_ERROR() { return { code: 'R400', msg: '账号已注册' }; }


    static get EMAIL_CODE_VERIFY_SUCCESS() { return { code: 'E210', msg: '校验成功' }; }



    static get EMAIL_CODE_INPUT_ERROR() { return { code: 'E401', msg: '验证码错误' }; }
    static get EMAIL_CODE_EXPIRED() { return { code: 'E402', msg: '验证码过期' }; }
    static get EMAIL_CODE_FAILED() { return { code: 'E403', msg: '错误的验证码' }; }
    static get EMAIL_INPUT_ERROR() { return { code: 'E404', msg: '邮箱格式错误' }; }
    static get EMAIL_BINDED() { return { code: 'E405', msg: '邮箱已绑定' }; }


    static get LOGIN_SUCCESS() { return { code: 'L200', msg: '登录成功' }; }
    static get LOGIN_FAILED_MAINTAIN() { return { code: 'L400', msg: '游戏正在维护中,稍后重试' }; }
    static get LOGIN_FAILED_LOGINAGAIN() { return { code: 'L401', msg: '同一帐号连续登录!,必须退出一个游戏才能进入另一个游戏!' }; }
    static get LOGIN_FAILED_INFO_ERROR() { return { code: 'L402', msg: '登录信息有误' }; }
    static get LOGIN_PWD_INFO_ERROR() { return { code: 'L403', msg: '账户密码错误' }; }
    static get LOGIN_ACCOUNT_NOT_USING() { return { code: 'L404', msg: '账户已停用' }; }
    static get LOGIN_ACCOUNT_NOT_FOUND() { return { code: 'L405', msg: '账户不存在' }; }
    static get LOGIN_ERROR() { return { code: 'L406', msg: '登录错误' }; }
    static get LOGIN_TOKEN_NOT_FOUND() { return { code: 'L407', msg: 'token过期' }; }
}

module.exports = ErrorCode;