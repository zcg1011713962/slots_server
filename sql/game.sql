-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: game
-- ------------------------------------------------------
-- Server version	5.7.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_accounts`
--

DROP TABLE IF EXISTS `t_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_accounts` (
  `account` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reg_time` int(11) NOT NULL,
  PRIMARY KEY (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_accounts`
--

LOCK TABLES `t_accounts` WRITE;
/*!40000 ALTER TABLE `t_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_charge_log`
--

DROP TABLE IF EXISTS `t_charge_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_charge_log` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '充值id',
  `orderno` char(20) NOT NULL COMMENT '订单号',
  `userid` int(11) NOT NULL DEFAULT '0' COMMENT '用户id',
  `gems_num` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '金币数量',
  `cost_money` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '花费的人民币总数',
  `charge_type` char(127) NOT NULL DEFAULT '0' COMMENT '0表示正常充值，1表示是促销活动，免费赠送',
  `time` int(20) NOT NULL DEFAULT '0' COMMENT '充值时间',
  `goldcoin_exchange_rate` double(12,0) NOT NULL DEFAULT '1' COMMENT '当前的转换率',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_charge_log`
--

LOCK TABLES `t_charge_log` WRITE;
/*!40000 ALTER TABLE `t_charge_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_charge_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_game_result_log`
--

DROP TABLE IF EXISTS `t_game_result_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_result_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `roomid` int(11) DEFAULT NULL COMMENT '房间ID',
  `tax` int(11) DEFAULT '0' COMMENT '税率',
  `data` varchar(256) DEFAULT NULL COMMENT '房间数据列表',
  `time` int(11) DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_game_result_log`
--

LOCK TABLES `t_game_result_log` WRITE;
/*!40000 ALTER TABLE `t_game_result_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_game_result_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_games`
--

DROP TABLE IF EXISTS `t_games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_games` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_games`
--

LOCK TABLES `t_games` WRITE;
/*!40000 ALTER TABLE `t_games` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_games_archive`
--

DROP TABLE IF EXISTS `t_games_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_games_archive` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_games_archive`
--

LOCK TABLES `t_games_archive` WRITE;
/*!40000 ALTER TABLE `t_games_archive` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_games_archive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_guests`
--

DROP TABLE IF EXISTS `t_guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_guests` (
  `guest_account` varchar(255) NOT NULL,
  PRIMARY KEY (`guest_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_guests`
--

LOCK TABLES `t_guests` WRITE;
/*!40000 ALTER TABLE `t_guests` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_message`
--

DROP TABLE IF EXISTS `t_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_message` (
  `type` varchar(32) NOT NULL,
  `msg` varchar(1024) NOT NULL,
  `version` varchar(32) NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_message`
--

LOCK TABLES `t_message` WRITE;
/*!40000 ALTER TABLE `t_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_rooms`
--

DROP TABLE IF EXISTS `t_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_rooms` (
  `uuid` char(20) NOT NULL,
  `id` char(8) NOT NULL,
  `genre` int(11) NOT NULL,
  `room_type` int(11) NOT NULL,
  `scene` varchar(128) NOT NULL,
  `base_info` varchar(256) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL,
  `num_of_turns` int(11) NOT NULL DEFAULT '0',
  `next_button` int(11) NOT NULL DEFAULT '0',
  `user_id0` int(11) NOT NULL DEFAULT '0',
  `user_icon0` varchar(128) NOT NULL DEFAULT '',
  `user_name0` varchar(32) DEFAULT NULL,
  `user_score0` int(11) DEFAULT '0',
  `user_id1` int(11) NOT NULL DEFAULT '0',
  `user_icon1` varchar(128) NOT NULL DEFAULT '',
  `user_name1` varchar(32) DEFAULT NULL,
  `user_score1` int(11) DEFAULT '0',
  `user_id2` int(11) NOT NULL DEFAULT '0',
  `user_icon2` varchar(128) NOT NULL DEFAULT '',
  `user_name2` varchar(32) DEFAULT NULL,
  `user_score2` int(11) DEFAULT '0',
  `user_id3` int(11) NOT NULL DEFAULT '0',
  `user_icon3` varchar(128) NOT NULL DEFAULT '',
  `user_name3` varchar(32) DEFAULT NULL,
  `user_score3` int(11) DEFAULT '0',
  `user_id4` int(11) NOT NULL DEFAULT '0',
  `user_icon4` varchar(128) NOT NULL,
  `user_name4` varchar(32) DEFAULT NULL,
  `user_score4` int(11) DEFAULT '0',
  `user_id5` int(11) NOT NULL DEFAULT '0',
  `user_icon5` varchar(128) NOT NULL,
  `user_name5` varchar(32) DEFAULT NULL,
  `user_score5` int(11) DEFAULT '0',
  `user_id6` int(11) NOT NULL DEFAULT '0',
  `user_icon6` varchar(128) NOT NULL,
  `user_name6` varchar(32) DEFAULT NULL,
  `user_score6` int(11) DEFAULT '0',
  `user_id7` int(11) NOT NULL DEFAULT '0',
  `user_icon7` varchar(128) NOT NULL,
  `user_name7` varchar(32) DEFAULT NULL,
  `user_score7` int(11) DEFAULT '0',
  `user_id8` int(11) NOT NULL DEFAULT '0',
  `user_icon8` varchar(128) NOT NULL,
  `user_name8` varchar(32) DEFAULT NULL,
  `user_score8` int(11) DEFAULT '0',
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT '0',
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `uuid` (`uuid`) USING BTREE,
  UNIQUE KEY `id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_rooms`
--

LOCK TABLES `t_rooms` WRITE;
/*!40000 ALTER TABLE `t_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_scene`
--

DROP TABLE IF EXISTS `t_scene`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_scene` (
  `id` int(22) unsigned NOT NULL AUTO_INCREMENT,
  `room_type` int(1) NOT NULL COMMENT '房间类型',
  `scene` int(1) NOT NULL COMMENT '场景编号',
  `genre` int(11) NOT NULL,
  `type` varchar(32) NOT NULL COMMENT '游戏类型',
  `time` int(20) DEFAULT '20',
  `limit_type` int(1) DEFAULT '1' COMMENT '进房消费类型',
  `limit_num` int(20) NOT NULL COMMENT '进房最低需要携带金额',
  `limit_danzhu` int(20) NOT NULL COMMENT '单注',
  `consume_type` int(1) DEFAULT '1' COMMENT '消费类型',
  `consume_num` int(20) NOT NULL COMMENT '小盲注',
  `tax` int(11) DEFAULT '0' COMMENT '税收比率',
  `online` int(11) NOT NULL DEFAULT '0' COMMENT '在线人数',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_scene`
--

LOCK TABLES `t_scene` WRITE;
/*!40000 ALTER TABLE `t_scene` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_scene` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_sell_log`
--

DROP TABLE IF EXISTS `t_sell_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_sell_log` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '充值id',
  `userid` int(11) NOT NULL DEFAULT '0' COMMENT '用户id',
  `gems_num` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '金币数量',
  `seller_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '发放金币人id',
  `charge_type` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '类型:1:会员 2:管理员',
  `addtime` int(20) NOT NULL DEFAULT '0' COMMENT '充值时间',
  `batchno` char(20) NOT NULL DEFAULT '0' COMMENT '批次号',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_sell_log`
--

LOCK TABLES `t_sell_log` WRITE;
/*!40000 ALTER TABLE `t_sell_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_sell_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_session_pool`
--

DROP TABLE IF EXISTS `t_session_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_session_pool` (
  `session_id` varchar(50) NOT NULL,
  `content` text,
  PRIMARY KEY (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_session_pool`
--

LOCK TABLES `t_session_pool` WRITE;
/*!40000 ALTER TABLE `t_session_pool` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_session_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_use_money_logs`
--

DROP TABLE IF EXISTS `t_use_money_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_use_money_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userid` varchar(255) NOT NULL COMMENT '用户ID',
  `money` int(20) NOT NULL COMMENT '消费金额',
  `type` varchar(32) NOT NULL COMMENT '消费类型',
  `create_time` int(11) NOT NULL COMMENT '创建时间',
  `op` varchar(128) NOT NULL COMMENT '游戏类型',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_use_money_logs`
--

LOCK TABLES `t_use_money_logs` WRITE;
/*!40000 ALTER TABLE `t_use_money_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_use_money_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_users`
--

DROP TABLE IF EXISTS `t_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_users` (
  `userid` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `account` varchar(64) NOT NULL DEFAULT '' COMMENT '账号',
  `name` varchar(32) DEFAULT NULL COMMENT '用户昵称',
  `sex` int(1) DEFAULT NULL COMMENT '性别',
  `headimg` varchar(256) DEFAULT NULL COMMENT '头像',
  `lv` smallint(6) DEFAULT '1' COMMENT '用户等级',
  `exp` int(11) DEFAULT '0' COMMENT '用户经验',
  `coins` decimal(64,2) DEFAULT '0.00' COMMENT '用户金币',
  `gems` decimal(64,2) DEFAULT '0.00' COMMENT '用户宝石',
  `roomid` varchar(8) DEFAULT NULL COMMENT '所在房间号',
  `history` varchar(4096) NOT NULL COMMENT '历史',
  `yaoqing` int(11) DEFAULT NULL COMMENT '邀请人',
  `time` int(10) DEFAULT NULL COMMENT '注册时间',
  `shareroomid` varchar(8) DEFAULT '',
  `robot` int(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userid`),
  UNIQUE KEY `account` (`account`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_users`
--

LOCK TABLES `t_users` WRITE;
/*!40000 ALTER TABLE `t_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_users_rechange_record`
--

DROP TABLE IF EXISTS `t_users_rechange_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_users_rechange_record` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '序号',
  `userid` int(11) unsigned NOT NULL COMMENT '用户',
  `orderno` char(20) NOT NULL COMMENT '订单号',
  `money` decimal(10,2) unsigned NOT NULL COMMENT '充值金额',
  `pay_type` char(10) NOT NULL COMMENT '充值类型',
  `status` tinyint(2) NOT NULL COMMENT '状态(0：新  1：充值成功)',
  `time` int(10) NOT NULL COMMENT '充值时间',
  `result` text COMMENT '返回值',
  `notify_result` text COMMENT '异步返回值',
  `is_account` tinyint(2) DEFAULT '0' COMMENT '入帐标志（0：默认  1：已入帐  9:异常）',
  `account_userid` int(11) unsigned DEFAULT NULL COMMENT '入帐人（客户的经纪人）',
  `account_result` text COMMENT '入帐返回值',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='客户充值表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_users_rechange_record`
--

LOCK TABLES `t_users_rechange_record` WRITE;
/*!40000 ALTER TABLE `t_users_rechange_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_users_rechange_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'game'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-02-26 17:08:33
