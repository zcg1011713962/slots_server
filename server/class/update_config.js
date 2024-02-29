var fs = require('fs');
var log = require("../../CClass/class/loginfo").getInstand;

var update_config = function(){

	var _gameinfo = "";

	var Game = function(){

		//初始化游戏
		this.init = function(){
			//更新配置
			const self = this;

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


			fs.readFile('./config/shop_config.json','utf-8',function(err,data){
				self.shopConfig = data.toString().trim();
			})

			setInterval(function(){
				fs.readFile('./config/shop_config.json','utf-8',function(err,data){
					self.shopConfig = data.toString().trim();
				})
			},60000);

			fs.readFile('./config/bank_transfer.json','utf-8',function(err,data){
				self.bankTransferConfig = data.toString().trim();
			})

			setInterval(function(){
				fs.readFile('./config/bank_transfer.json','utf-8',function(err,data){
					self.bankTransferConfig = data.toString().trim();
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

		this.getShopConfig = function(){
			try{
				return JSON.parse(this.shopConfig);
			}
			catch(e){
				log.err('getShopConfig');
			}
		}


		this.getBankTransferConfig = function(){
			try{
				return JSON.parse(this.bankTransferConfig);
			}
			catch(e){
				log.err('getShopConfig');
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

