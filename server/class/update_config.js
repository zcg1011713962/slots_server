var fs = require('fs');
var log = require("../../CClass/class/loginfo").getInstand;

var update_config = function(){

	var _gameinfo = "";

	var Game = function(){

		//初始化游戏
		this.init = function(){
			//更新配置
			this.noticeConfig;
			var self = this;
			var Cun;

			fs.readFile('./config/notice_config.json','utf-8',function(err,data){
			    self.noticeConfig = data.toString().trim();
			})

			setInterval(function(){
				fs.readFile('./config/notice_config.json','utf-8',function(err,data){
					self.noticeConfig = data.toString().trim();
				})
			},60000);


			fs.readFile('./config/vip_config.json','utf-8',function(err,data){
				self.vipConfig = data.toString().trim();
			})

			setInterval(function(){
				fs.readFile('./config/vip_config.json','utf-8',function(err,data){
					self.vipConfig = data.toString().trim();
				})
			},60000);
		};


		this.getNoticeConfig = function(){
		    try{
				return JSON.parse(this.noticeConfig);
		    }
		    catch(e){
		      log.err('getNoticeConfig');
		    }
		}
		this.getVipConfig = function(){
			try{
				return JSON.parse(this.vipConfig);
			}
			catch(e){
				log.err('getVipConfig');
			}
		}

		//运行初始化
		this.init();
	}


	if (_gameinfo){
		return {getInstand:_gameinfo}
	}
	else{
		console.log("初始化配置文件");
		_gameinfo = new Game();
		return {getInstand:_gameinfo}
	}

}()


module.exports = update_config;
