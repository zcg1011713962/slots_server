/**
 * sms.send(手机号) 发送短信验证码
 * sms.verify(手机号,验证码) 校验验证码是否正确
 **/
let http = require('http');
let crypto = require('crypto');
// const Core = require('@alicloud/pop-core');
const _ = require('lodash');

// 阿里云控制台 - 短信服务 - 国内消息
const SignName = "姿漫科技消遣果内容后台";
const TemplateCode = "SMS_195285034";

// https://usercenter.console.aliyun.com/
const accessKeyId = "LTAIwGNfEJZwkj6t";
const accessKeySecret = "pm1IWKjPaYHbUaTgde1L6R1rSEAkPZ";

// var client = new Core({
//     accessKeyId,
//     accessKeySecret,
//     endpoint: 'https://dysmsapi.aliyuncs.com',
//     apiVersion: '2017-05-25'
// });

// 保存手机号和验证码的对应关系
// phone_code_list = {'18855551234':['1024']}
var phone_code_list = {};

exports.send = function (phone) {
    // 生成验证码
    var code = "" + (_.random(8) + 1) + _.random(9) + _.random(9) + _.random(9);
    return new Promise((resolve, reject) => {
        try {
            client.request('SendSms', {
                RegionId: "cn-hangzhou",
                PhoneNumbers: phone,
                SignName,
                TemplateCode,
                TemplateParam: "{code:" + code + "}"
            }, {
                method: 'POST'
            }).then((result) => {
                if (result.Message && result.Message == "OK" && result.Code && result.Code == "OK") { // 短信发送成功
                    // 保存验证码
                    if (phone_code_list[phone]) {
                        phone_code_list[phone].push(code);
                    } else {
                        phone_code_list[phone] = [code];
                    }
                    // 5分钟后删除验证码
                    setTimeout(() => {
                        _.pull(phone_code_list[phone], code);
                        if (phone_code_list[phone] && phone_code_list[phone].length == 0) {
                            delete phone_code_list[phone];
                        }
                    }, 5 * 60 * 1000);
                    resolve(result)
                } else {
                    reject(result)
                }
            }, (ex) => {
                reject(ex)
            })
        } catch (error) {
            reject(error)
        }
    })
};

let Sms = require('./sendsms.js');

exports.send_shansuma = function (phone) {

    let code = "" + (_.random(8) + 1) + _.random(9) + _.random(9) + _.random(9);  //验证码
    let mobile = phone;  //接收短信手机号码，如果多个手机号用逗号间隔

    let app_id = 'hw_10019';
    let secretKey = 'fd636ed50c2fb943f67a9f7fdddb3a3c';

    let template_sign = "游米";
    let template_id = 'ST_2020101100000003';  //短信模板ID

    let sms = new Sms();
    let res = sms.getSendSmsData(app_id, secretKey, template_sign, template_id, mobile, code);

    var req = http.get('http://api.shansuma.com/gateway.do' + res, function (res) {
        var sendresult = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { //获取放回结果
            sendresult = chunk;
        });
        res.on('end', () => {
            console.log(sendresult);  //显示返回结果
            let result = JSON.parse(sendresult);
            if (result.code == 0) { // 短信发送成功
                // 保存验证码
                if (phone_code_list[phone]) {
                    phone_code_list[phone].push(code);
                } else {
                    phone_code_list[phone] = [code];
                }
                // 5分钟后删除验证码
                setTimeout(() => {
                    _.pull(phone_code_list[phone], code);
                    if (phone_code_list[phone] && phone_code_list[phone].length == 0) {
                        delete phone_code_list[phone];
                    }
                }, 5 * 60 * 1000);

            } else {

            }
        });

    }).on('error', function (e) { //错误
        console.log("Got error: " + e.message);
    });
    req.end();

};

function makeDate() {
    try {
        var newDate = new Date();
        //在小于10的月份前补0
        var month = eval(newDate.getMonth() + 1) < 10 ? '0' + eval(newDate.getMonth() + 1) : eval(newDate.getMonth() + 1);
        //在小于10的日期前补0
        var day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
        //在小于10的小时前补0
        var hours = newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
        //在小于10的分钟前补0
        var minutes = newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes();
        //在小于10的秒数前补0
        var seconds = newDate.getSeconds() < 10 ? '0' + newDate.getSeconds() : newDate.getSeconds();
        //拼接时间
        var stringDate = newDate.getFullYear() + '' + month + '' + day + "" + hours + "" + minutes + "" + seconds;
    } catch (e) {
        var stringDate = "0000-00-00 00:00:00";
    } finally {
        return stringDate;
    }
}

exports.verify = function (phone, code) {
    return (phone_code_list[phone].indexOf(code) > -1);
};