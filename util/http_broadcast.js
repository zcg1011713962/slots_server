const http = require('http');
const url_config = require('./config/url_config');

module.exports.send = function (requestData) {

    var postdata = JSON.stringify(requestData);
    var appstore_optios = {
        hostname: url_config.broadcast_ip,
        port: 13001,
        path: '/addMessage',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                // console.log(data.toString());
            } catch (e) {
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
};

module.exports.getTableKey = function (requestData, cb) {


    var postdata = JSON.stringify(requestData);
    var appstore_optios = {
        hostname: url_config.broadcast_ip,
        port: 13001,
        path: '/getTableKey',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                // console.log(data.toString());
                cb(data.toString());
            } catch (e) {
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
};

module.exports.updateTableKey = function (requestData, cb) {

    var postdata = JSON.stringify(requestData);
    var appstore_optios = {
        hostname: url_config.broadcast_ip,
        port: 13001,
        path: '/updateTableKey',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                // console.log(data.toString());
                cb(data.toString());
            } catch (e) {
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
};

module.exports.getUserCtrl = function (requestData, cb) {

    var postdata = JSON.stringify(requestData);
    var appstore_optios = {
        hostname: url_config.broadcast_ip,
        port: 13001,
        path: '/getUserCtrl',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-111444'
        }
    };

    var req = http.request(appstore_optios, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks, size);
            try {
                // console.log(data.toString());
                cb(data.toString());
            } catch (e) {
                console.error(e);
                console.log('post BoSenWebServer error..');
            }
        });
    });

    req.write(postdata);
    req.end();
};
