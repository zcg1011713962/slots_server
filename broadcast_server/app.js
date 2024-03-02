const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Cio = require('socket.io-client');
const log = require("./../CClass/class/loginfo").getInstand;
const bodyParser = require('body-parser');
const gameInfo = require('./class/game').getInstand;
const gameConfig = require('./config/gameConfig');
const Urls = require("../util/config/url_config");

const Csocket = Cio(Urls.hall_url);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//跨域问题
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
//增加消息相关
app.post('/addMessage', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('addMessage-json');
    }
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({result: 1}));
    response.end();
    gameInfo.addMessage(req.body);
});
//获取key相关
app.post('/getTableKey', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('getTableKey-json');
    }
    let data = gameInfo.getTableKey(req.body);
    console.log(data);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({result: data}));
    response.end();
});

app.post('/checkTableKey', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('checkTableKey-json');
    }
    let data = gameInfo.checkTableKey(req.body);
    console.log(data);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({result: data}));
    response.end();
});

app.post('/updateTableKey', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('updateTableKey-json');
    }
    let data = gameInfo.updateTableKey(req.body);
    // console.log(data);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(JSON.stringify({result: data}));
    response.end();
});

//获取用户金币限额相关
app.post('/getUserCtrl', function (req, response) {
    try {
        let data = {};
        for (let key in req.body) {
            data = JSON.parse(key);
        }
        req.body = data;
    } catch (e) {
        log.warn('getUserCtrl-json');
    }
    gameInfo.getUserCtrl(req.body, response);

});


gameInfo.setIo(io, Csocket);

io.on('connection', function (socket) {
    socket.emit('connected', 'connect bc server');
});


app.set('port', process.env.PORT || gameConfig.port);

const server = http.listen(app.get('port'), function () {
    log.info('start at port:' + server.address().port);
});

log.info(gameConfig.gameName + "服务器启动");

