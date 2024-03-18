const fs = require('fs');
const log = require("../../CClass/class/loginfo").getInstand;
const RedisUtil = require('../../util/redis_util')

var update_config = function(){

	var _gameinfo = "";

	var Game = function(){

		//初始化游戏
		this.init = function(){
			//更新配置
			const self = this;

			fs.readFile('./config/json/notice_config.json','utf-8',function(err,data){
			    self.noticeConfig = data.toString().trim();
			})

			fs.readFile('./config/json/vip_config.json','utf-8',function(err,data){
				self.vipConfig = data.toString().trim();
			})


			fs.readFile('./config/json/shop_config.json','utf-8',function(err,data){
				self.shopConfig = data.toString().trim();
			})

			fs.readFile('./config/json/bank_transfer_config.json','utf-8',function(err,data){
				self.bankTransferConfig = data.toString().trim();
			})

			fs.readFile('./config/json/sign_in_config.json','utf-8',function(err,data){
				self.signInConfig = data.toString().trim();
			})


			fs.readFile('./config/json/activity_jackpot_config.json','utf-8',function(err,data){
				self.activityJackpotConfig = data.toString().trim();
			})


			fs.readFile('./config/json/lucky_coin_config.json','utf-8',function(err,data){
				self.luckyCoinConfig = data.toString().trim();
			})


			fs.readFile('./config/json/invite_download_config.json','utf-8',function(err,data){
				self.downloadExtConfig = data.toString().trim();
			})


			fs.readFile('./config/json/customer_service_config.json','utf-8',function(err,data){
				self.customerServiceConfig = data.toString().trim();
			})


			fs.readFile('./config/json/newhand_protect_config.json','utf-8',function(err,data){
				self.newhandProtectConfig = data.toString().trim();
			})


			fs.readFile('./config/json/black_white_list_config.json','utf-8',function(err,data){
				self.blackWhiteListConfig = data.toString().trim();
			})


		};


		this.getNoticeConfig = function(){
		    try{
				RedisUtil.hget('gameConfig', 'notice_config');
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
				log.err('getBankTransferConfig');
			}
		}

		this.getSignInConfig = function(){
			try{
				return JSON.parse(this.signInConfig);
			}
			catch(e){
				log.err('getSignInConfig');
			}
		}

		this.getActivityJackpotConfig = function(){
			try{
				return JSON.parse(this.activityJackpotConfig);
			}
			catch(e){
				log.err('getActivityJackpotConfig');
			}
		}

		this.getLuckyCoinConfig = function(){
			try{
				return JSON.parse(this.luckyCoinConfig);
			}
			catch(e){
				log.err('getActivityJackpotConfig');
			}
		}

		this.getDownloadExtConfig = function(){
			try{
				return JSON.parse(this.downloadExtConfig);
			}
			catch(e){
				log.err('getDownloadExtConfig');
			}
		}

		this.getCustomerServiceConfig = function(){
			try{
				return JSON.parse(this.customerServiceConfig);
			}
			catch(e){
				log.err('getCustomerServiceConfig');
			}
		}

		this.getNewhandProtectConfig = function(){
			try{
				return JSON.parse(this.newhandProtectConfig);
			}
			catch(e){
				log.err('getNewhandProtectConfig');
			}
		}

		this.getBlackWhiteListConfig = function(){
			try{
				return JSON.parse(this.blackWhiteListConfig);
			}
			catch(e){
				log.err('getBlackWhiteListConfig');
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

