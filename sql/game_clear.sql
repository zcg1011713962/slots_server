
truncate table game.t_accounts;truncate table game.t_charge_log;truncate table game.t_game_result_log;truncate table game.t_games;truncate table game.t_games_archive;truncate table game.t_guests;truncate table game.t_message;truncate table game.t_rooms;truncate table game.t_scene;truncate table game.t_sell_log;truncate table game.t_session_pool;truncate table game.t_use_money_logs;truncate table game.t_users;truncate table game.t_users_rechange_record;    
truncate table gameaccount.activity_sign;truncate table gameaccount.bankbindlist;truncate table gameaccount.bankname;truncate table gameaccount.chatlog;truncate table gameaccount.diamond_changelog;truncate table gameaccount.email;truncate table gameaccount.game_onlinenum;truncate table gameaccount.lineout;truncate table gameaccount.log_bank_score_change;truncate table gameaccount.log_bank_transfer;truncate table gameaccount.mark;truncate table gameaccount.msg;truncate table gameaccount.newuseraccounts;truncate table gameaccount.pay_order;truncate table gameaccount.prop_changelog;truncate table gameaccount.prop_item;truncate table gameaccount.score_changelog;truncate table gameaccount.server_log;truncate table gameaccount.userinfo;truncate table gameaccount.userinfo_imp;truncate table gameaccount.usermoneyctrl;truncate table gameaccount.withdraw_record;
truncate table la_ba.gambling_game_list;truncate table la_ba.lotterylog;truncate table la_ba.lotterylog_229;truncate table la_ba.lotterylog_263;truncate table la_ba.lotterylog_268;truncate table la_ba.lotterylog_272;truncate table la_ba.lotterylog_283;truncate table la_ba.lotterylog_285;truncate table la_ba.lotterylog_286;truncate table la_ba.lotterylog_287;truncate table la_ba.lotterylog_288;truncate table la_ba.score_pool;truncate table la_ba.scoretotal;truncate table la_ba.scoretotallog;truncate table la_ba.shop_item;truncate table la_ba.useraccounts;
truncate table game_attarc.lotterylog;truncate table game_attarc.roominfo;
truncate table ym_manage.account_invite_sends;truncate table ym_manage.account_invites;truncate table ym_manage.agent_get_rebate_record;truncate table ym_manage.agent_rebate;truncate table ym_manage.paylog;truncate table ym_manage.order_record_detail; 

ALTER TABLE gameaccount.newuseraccounts  AUTO_INCREMENT=10000;


INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(229, 'freespin', 0, 5, 0, 0, '0,0,50', '0,0,50', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(268, 'fortunetiger', 0, 5, 0, 0, '0,0,500', '0,0,50', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(263, 'GaneshaGold', 0, 5, 0, 0, '0,0,1', '0,0,10', 50, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(272, 'jungledelight', 0, 5, 0, 0, '0,0,50', '0,0,50', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(283, 'UltimateStriker', 0, 5, 0, 0, '0,0,700', '0,0,100', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(285, 'BuffaloKing', 0, 5, 0, 0, '0,0,700', '0,0,100', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(286, 'DigDigDigger', 0, 5, 0, 0, '0,0,700', '0,0,100', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(287, 'GrandWheel', 0, 5, 0, 0, '0,0,700', '0,0,100', 80, 0);
INSERT INTO la_ba.gambling_game_list
(nGameID, strGameName, nGameType, nGamblingWaterLevelGold, nGamblingBalanceGold, nGamblingUpdateBalanceGold, nGamblingBigWinLevel, nGamblingBigWinLuck, expectRTP, nSysBalanceGold)
VALUES(288, 'BlueDiamond', 0, 5, 0, 0, '0,0,700', '0,0,100', 80, 0);