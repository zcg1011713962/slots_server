const log4js = require('log4js');
log4js.configure({
	appenders: {
		console: { type: 'console' },
		file: {
			type: 'file',
			filename: 'logs/log.log',
			layout: {
				type: 'pattern',
				pattern: '%d{ISO8601} [%-5p] %c - %m'
			}
		}
	},
	categories: {
		default: { appenders: ['console', 'file'], level: 'debug' }
	}
});




var logoinfo = function(){

	let _gameinfo = "";

	const Game = function () {

		//初始化游戏
		this.init = function () {
			this.logInfo = log4js.getLogger();
		}

		this.info = function (_str) {
			this.logInfo.info(_str);
		}

		this.warn = function (_str) {
			this.logInfo.warn(_str);
		}

		this.err = function (_str) {
			this.logInfo.error(_str);
		}

		//运行初始化
		this.init();
	};


	if (_gameinfo){
		return {getInstand:_gameinfo}
	}
	else{
		_gameinfo = new Game();
		return {getInstand:_gameinfo}
	}

}()


module.exports = logoinfo;

