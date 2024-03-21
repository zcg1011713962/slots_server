const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

// 创建一个SMTP传输对象
const transporter = nodemailer.createTransport({
    service: 'gmail', // 使用 Gmail 服务
    auth: {
        user: 'zhengchunguang66@gmail.com', // 你的 Gmail 邮箱地址
        pass: 'tawyjatbmqiwdmtw' // 使用应用程序专用密码
    }
});


const sendVerificationCode = (recipientEmail, callback) => {
    // 生成六位数的随机验证码
    const verificationCode = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });
    // 设置邮件内容
    const mailOptions = {
        from: 'zhengchungaung66@gmail.com', // 发送者的邮箱地址
        to: recipientEmail, // 接收者的邮箱地址
        subject: '验证码', // 邮件主题
        text: `你的验证码是：${verificationCode}` // 邮件正文
    };

    // 发送邮件
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            callback(0)
            console.error('邮件发送失败:', error.message);
        } else {
            callback(verificationCode)
            console.log('邮件已发送:', info.response);
        }
    });
}

module.exports = sendVerificationCode;
