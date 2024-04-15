-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: gameaccount
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
-- Table structure for table `activity_sign`
--

DROP TABLE IF EXISTS `activity_sign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_sign` (
  `userId` int(11) NOT NULL,
  `last_sign_in_date` bigint(20) DEFAULT NULL COMMENT '最后签到日期时间戳',
  `consecutive_days` int(11) DEFAULT '0' COMMENT '连续签到天数',
  PRIMARY KEY (`userId`) USING BTREE,
  KEY `userId` (`userId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_sign`
--

LOCK TABLES `activity_sign` WRITE;
/*!40000 ALTER TABLE `activity_sign` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_sign` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bankbindlist`
--

DROP TABLE IF EXISTS `bankbindlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankbindlist` (
  `cardId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL COMMENT '用户ID',
  `account` char(30) NOT NULL COMMENT '银行卡账号',
  `name` char(30) NOT NULL COMMENT '银行卡名称',
  `bankType` char(30) NOT NULL COMMENT '银行类型',
  `cpf` varchar(30) DEFAULT NULL COMMENT 'BLR税号',
  PRIMARY KEY (`cardId`),
  UNIQUE KEY `bankbindlist_account_IDX` (`account`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bankbindlist`
--

LOCK TABLES `bankbindlist` WRITE;
/*!40000 ALTER TABLE `bankbindlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `bankbindlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bankname`
--

DROP TABLE IF EXISTS `bankname`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankname` (
  `typeId` int(11) NOT NULL AUTO_INCREMENT,
  `bankName` char(30) NOT NULL,
  PRIMARY KEY (`typeId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bankname`
--

LOCK TABLES `bankname` WRITE;
/*!40000 ALTER TABLE `bankname` DISABLE KEYS */;
/*!40000 ALTER TABLE `bankname` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatlog`
--

DROP TABLE IF EXISTS `chatlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatlog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `toUserId` int(11) NOT NULL,
  `nickname` char(30) DEFAULT NULL,
  `msg` char(50) NOT NULL,
  `isSendEnd` tinyint(1) DEFAULT '0',
  `addDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `img` mediumtext,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatlog`
--

LOCK TABLES `chatlog` WRITE;
/*!40000 ALTER TABLE `chatlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diamond_changelog`
--

DROP TABLE IF EXISTS `diamond_changelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diamond_changelog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `diamond_before` int(11) NOT NULL,
  `diamond_change` int(11) NOT NULL,
  `diamond_current` int(11) NOT NULL,
  `change_type` int(11) NOT NULL COMMENT '0网站加分,1捕鸟,2连线,3赠送,4兑换,528game,6领取,7东山再起,8红包,9八搭二,10牛牛',
  `change_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isOnline` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`,`userid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diamond_changelog`
--

LOCK TABLES `diamond_changelog` WRITE;
/*!40000 ALTER TABLE `diamond_changelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `diamond_changelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email`
--

DROP TABLE IF EXISTS `email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `isRead` int(11) DEFAULT '0' COMMENT '是否已读 0-否   1-是',
  `title_id` varchar(20) CHARACTER SET utf8 DEFAULT NULL COMMENT '邮件标题',
  `type` int(11) DEFAULT NULL COMMENT '邮件类型  0通知 1奖励',
  `to_userid` int(11) DEFAULT NULL COMMENT '收邮件者id',
  `from_userid` int(11) DEFAULT NULL COMMENT '发邮件者id 0-系统',
  `createTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `content_id` varchar(20) DEFAULT NULL COMMENT '内容对应多语言码',
  `otherId` int(11) DEFAULT '-1' COMMENT '邮箱关联其他表ID',
  `goods_type` int(11) DEFAULT '-1' COMMENT '物品类型',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email`
--

LOCK TABLES `email` WRITE;
/*!40000 ALTER TABLE `email` DISABLE KEYS */;
/*!40000 ALTER TABLE `email` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_onlinenum`
--

DROP TABLE IF EXISTS `game_onlinenum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_onlinenum` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gid` int(10) unsigned NOT NULL DEFAULT '0',
  `gport` varchar(100) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `num` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) CHARACTER SET utf8 NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_onlinenum`
--

LOCK TABLES `game_onlinenum` WRITE;
/*!40000 ALTER TABLE `game_onlinenum` DISABLE KEYS */;
/*!40000 ALTER TABLE `game_onlinenum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineout`
--

DROP TABLE IF EXISTS `lineout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineout` (
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineout`
--

LOCK TABLES `lineout` WRITE;
/*!40000 ALTER TABLE `lineout` DISABLE KEYS */;
/*!40000 ALTER TABLE `lineout` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_bank_score_change`
--

DROP TABLE IF EXISTS `log_bank_score_change`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_bank_score_change` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `bank_score_before` decimal(20,2) NOT NULL,
  `bank_score_change` decimal(20,2) NOT NULL,
  `bank_score_current` decimal(20,2) NOT NULL,
  `change_type` int(11) NOT NULL COMMENT '0网站加分,1捕鸟,2连线,3赠送,4兑换,528game,6领取,8红包',
  `change_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isOnline` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`,`userid`),
  KEY `userid` (`userid`) USING BTREE,
  KEY `change_time` (`change_time`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_bank_score_change`
--

LOCK TABLES `log_bank_score_change` WRITE;
/*!40000 ALTER TABLE `log_bank_score_change` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_bank_score_change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_bank_transfer`
--

DROP TABLE IF EXISTS `log_bank_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_bank_transfer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_userid` int(11) NOT NULL COMMENT '发起方',
  `to_userid` int(11) NOT NULL COMMENT '接收方',
  `transfer_bank_score` decimal(20,2) NOT NULL,
  `transfer_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isNotify` int(11) DEFAULT '0' COMMENT '是否通知了对方',
  PRIMARY KEY (`id`),
  KEY `transfer_time` (`transfer_time`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_bank_transfer`
--

LOCK TABLES `log_bank_transfer` WRITE;
/*!40000 ALTER TABLE `log_bank_transfer` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_bank_transfer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mark`
--

DROP TABLE IF EXISTS `mark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mark` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `useCoin` bigint(20) NOT NULL,
  `winCoin` bigint(20) NOT NULL,
  `tax` bigint(20) NOT NULL,
  `gameId` int(11) DEFAULT NULL,
  `serverId` int(11) DEFAULT NULL,
  `balanceTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mark` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`) USING BTREE,
  KEY `gameId` (`gameId`) USING BTREE,
  KEY `serverId` (`serverId`) USING BTREE,
  KEY `mark` (`mark`),
  KEY `gameId_2` (`gameId`,`serverId`) USING BTREE,
  KEY `balanceTime` (`balanceTime`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mark`
--

LOCK TABLES `mark` WRITE;
/*!40000 ALTER TABLE `mark` DISABLE KEYS */;
/*!40000 ALTER TABLE `mark` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `msg`
--

DROP TABLE IF EXISTS `msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msg` (
  `msgId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `winPropId` int(11) DEFAULT NULL,
  `winPropCount` int(11) DEFAULT NULL,
  `winScore` int(11) DEFAULT NULL,
  `matchlogId` int(11) DEFAULT NULL,
  `isGetPrize` tinyint(1) DEFAULT '0',
  `type` int(11) DEFAULT NULL COMMENT '0比赛信息 1赠送 2等级',
  `AddDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sendCoinUserId` int(11) DEFAULT NULL,
  `nickName` char(40) DEFAULT NULL,
  PRIMARY KEY (`msgId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `msg`
--

LOCK TABLES `msg` WRITE;
/*!40000 ALTER TABLE `msg` DISABLE KEYS */;
/*!40000 ALTER TABLE `msg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newuseraccounts`
--

DROP TABLE IF EXISTS `newuseraccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newuseraccounts` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Account` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '账户',
  `Password` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '密码',
  `nickname` varchar(128) NOT NULL COMMENT '昵称',
  `AddDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `p` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `phoneNo` char(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '手机号',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '邮箱',
  `sex` int(11) DEFAULT NULL COMMENT '性别',
  `city` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '城市',
  `province` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '省',
  `country` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '国家',
  `headimgurl` int(11) DEFAULT '0' COMMENT '头像',
  `language` int(11) DEFAULT '0' COMMENT '语言 0巴西 1葡萄牙',
  `Robot` tinyint(1) DEFAULT '0' COMMENT '是否机器人 0否1是',
  `ChannelType` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `official` tinyint(1) DEFAULT '0',
  `gametoken` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `qdid` int(10) unsigned DEFAULT '0' COMMENT '渠道id',
  `housecard` int(11) DEFAULT '0' COMMENT 'VIP等级',
  `totalRecharge` bigint(20) unsigned DEFAULT '0' COMMENT '总充值(默认使用BRL货币类型)',
  `loginip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '' COMMENT '登录IP',
  `iscanlogin` tinyint(3) unsigned DEFAULT '0' COMMENT '1 can 0 no',
  `diansha_score` int(10) unsigned DEFAULT '0',
  `diansha_gameids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `is_vip` tinyint(3) unsigned DEFAULT '0' COMMENT '是否VIP',
  `g4_uid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `account_using` int(11) NOT NULL DEFAULT '1' COMMENT '账户是否可用',
  `bankPwd` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '银行密码',
  `google_uid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'google登录UID',
  `vip_score` bigint(20) DEFAULT '0' COMMENT 'VIP积分',
  `score_flow` bigint(20) DEFAULT NULL COMMENT '金币流水',
  `bankLock` int(11) DEFAULT '0' COMMENT '银行是否锁定',
  `device_code` varchar(100) DEFAULT NULL COMMENT '设备码',
  `step` int(11) DEFAULT '0' COMMENT '新手指引步数',
  `submittedRecharge` decimal(20,2) DEFAULT '0.00' COMMENT '已提现充值金额',
  PRIMARY KEY (`Id`) USING BTREE,
  KEY `ChannelType` (`ChannelType`)
) ENGINE=MyISAM AUTO_INCREMENT=10000 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newuseraccounts`
--

LOCK TABLES `newuseraccounts` WRITE;
/*!40000 ALTER TABLE `newuseraccounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `newuseraccounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pay_order`
--

DROP TABLE IF EXISTS `pay_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(100) NOT NULL COMMENT '订单ID',
  `userId` bigint(20) NOT NULL COMMENT '下单用户',
  `amount` decimal(20,2) NOT NULL COMMENT '下单金额',
  `currencyType` varchar(10) NOT NULL COMMENT '货币类型',
  `vipLevel` int(11) NOT NULL COMMENT 'VIP等级',
  `goodsType` int(11) NOT NULL COMMENT '购买物品类型',
  `price` int(11) NOT NULL COMMENT '原单价',
  `status` int(11) DEFAULT '0' COMMENT '订单状态 0未完成',
  `group` int(11) NOT NULL COMMENT '物品分组',
  `service` int(11) NOT NULL DEFAULT '0' COMMENT '0 大厅 1游戏内',
  `mul` int(11) DEFAULT '0' COMMENT '免费转盘倍数',
  `shopType` int(11) DEFAULT NULL COMMENT '购买类型',
  `val` int(11) DEFAULT '0' COMMENT '物品数量',
  `serverId` int(11) DEFAULT '0' COMMENT '0大厅 其他服务ID ',
  `buyContinueRewardGold` bigint(20) DEFAULT '0' COMMENT '购买首充持续奖励金币',
  `buyContinueRewardDiamond` bigint(20) DEFAULT '0' COMMENT '购买首充持续奖励钻石',
  `buyContinueDays` int(11) DEFAULT '0' COMMENT '持续赠送天数',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `pay_order_orderId_IDX` (`orderId`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pay_order`
--

LOCK TABLES `pay_order` WRITE;
/*!40000 ALTER TABLE `pay_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `pay_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prop_changelog`
--

DROP TABLE IF EXISTS `prop_changelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prop_changelog` (
  `userid` int(11) DEFAULT NULL,
  `propid` int(11) DEFAULT NULL,
  `change_before` int(10) unsigned DEFAULT NULL,
  `change_count` int(11) DEFAULT NULL,
  `change_after` int(10) unsigned DEFAULT NULL,
  `insertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gameid` int(10) unsigned NOT NULL COMMENT '房间ID,0为大厅',
  `codeid` int(10) unsigned NOT NULL COMMENT '1-比赛获得 2-兑换 3-比赛领奖 4-每日签到领奖 5-首充'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prop_changelog`
--

LOCK TABLES `prop_changelog` WRITE;
/*!40000 ALTER TABLE `prop_changelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `prop_changelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prop_item`
--

DROP TABLE IF EXISTS `prop_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prop_item` (
  `userid` int(10) unsigned NOT NULL COMMENT '用户ID',
  `propid` int(10) unsigned NOT NULL COMMENT '道具ID 1礼品券 2喇叭',
  `propcount` int(10) unsigned NOT NULL COMMENT '道具数量'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prop_item`
--

LOCK TABLES `prop_item` WRITE;
/*!40000 ALTER TABLE `prop_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `prop_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `score_changelog`
--

DROP TABLE IF EXISTS `score_changelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `score_changelog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `score_before` decimal(20,2) NOT NULL COMMENT '金币变化前',
  `score_change` decimal(20,2) NOT NULL COMMENT '金币变化',
  `score_current` decimal(20,2) NOT NULL COMMENT '当前金币',
  `change_type` int(11) NOT NULL COMMENT '改变类型',
  `change_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isOnline` tinyint(1) DEFAULT NULL COMMENT '是否在线',
  `pay_sn` varchar(50) CHARACTER SET utf8 NOT NULL DEFAULT '',
  PRIMARY KEY (`id`,`userid`),
  KEY `userid` (`userid`) USING BTREE,
  KEY `pay_sn` (`pay_sn`),
  KEY `change_time` (`change_time`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `score_changelog`
--

LOCK TABLES `score_changelog` WRITE;
/*!40000 ALTER TABLE `score_changelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `score_changelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server_log`
--

DROP TABLE IF EXISTS `server_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `server_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `txt` varchar(255) NOT NULL DEFAULT '',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '0关闭 1显示',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `updatetime` char(10) NOT NULL DEFAULT '0',
  `begin_time` int(10) unsigned NOT NULL DEFAULT '0',
  `end_time` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server_log`
--

LOCK TABLES `server_log` WRITE;
/*!40000 ALTER TABLE `server_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `server_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userinfo`
--

DROP TABLE IF EXISTS `userinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userinfo` (
  `userId` int(11) NOT NULL,
  `invite_code` varchar(32) DEFAULT NULL COMMENT '邀请码',
  `firstRecharge` int(11) DEFAULT '0' COMMENT '是否购买首充礼包',
  `login_count` int(11) DEFAULT '0' COMMENT '登录次数',
  `newHandGive` int(11) DEFAULT '0' COMMENT '是否领取了新手礼包',
  `dailyGet` int(11) DEFAULT '0' COMMENT '是否领取了VIP每日金币',
  `monthlyGet` int(11) DEFAULT '0' COMMENT '是否领取了VIP每月金币',
  `bustTimes` int(11) DEFAULT '0' COMMENT '已经领取破产补助金次数',
  `winScorePopFirstRecharge` int(11) DEFAULT '0' COMMENT '赢分差是否弹首充物品',
  PRIMARY KEY (`userId`) USING BTREE,
  UNIQUE KEY `userinfo_invite_code_IDX` (`invite_code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userinfo`
--

LOCK TABLES `userinfo` WRITE;
/*!40000 ALTER TABLE `userinfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `userinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userinfo_imp`
--

DROP TABLE IF EXISTS `userinfo_imp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userinfo_imp` (
  `userId` int(11) NOT NULL,
  `score` decimal(20,2) DEFAULT '0.00' COMMENT '金币',
  `diamond` bigint(20) DEFAULT '0' COMMENT '钻石',
  `bankScore` decimal(20,2) DEFAULT '0.00' COMMENT '银行积分',
  `luckyCoin` bigint(20) DEFAULT '0' COMMENT '活动幸运币',
  `withdrawLimit` bigint(20) DEFAULT '0' COMMENT '提现额度(默认使用BRL为货币类型)',
  `lockBankScore` decimal(20,2) DEFAULT '0.00' COMMENT '锁定的银行积分（提现锁定）',
  `lockWithdrawLimit` bigint(20) DEFAULT '0' COMMENT '锁定提现额度',
  PRIMARY KEY (`userId`) USING BTREE,
  KEY `userId` (`userId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userinfo_imp`
--

LOCK TABLES `userinfo_imp` WRITE;
/*!40000 ALTER TABLE `userinfo_imp` DISABLE KEYS */;
/*!40000 ALTER TABLE `userinfo_imp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usermoneyctrl`
--

DROP TABLE IF EXISTS `usermoneyctrl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usermoneyctrl` (
  `userId` bigint(20) NOT NULL COMMENT '玩家id',
  `coinCtrl` bigint(20) NOT NULL COMMENT '限制金币',
  `isUse` int(11) NOT NULL DEFAULT '1' COMMENT '1:启用  0:未启用  默认为1',
  PRIMARY KEY (`userId`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 ROW_FORMAT=FIXED;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usermoneyctrl`
--

LOCK TABLES `usermoneyctrl` WRITE;
/*!40000 ALTER TABLE `usermoneyctrl` DISABLE KEYS */;
/*!40000 ALTER TABLE `usermoneyctrl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdraw_record`
--

DROP TABLE IF EXISTS `withdraw_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdraw_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(20) NOT NULL COMMENT '提现用户',
  `amount` decimal(20,2) NOT NULL COMMENT '提现金额',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  `account` varchar(30) NOT NULL COMMENT '账号',
  `bankType` varchar(30) NOT NULL COMMENT '卡类型 如:pix',
  `name` varchar(30) NOT NULL COMMENT '账户名称',
  `status` int(11) DEFAULT '0' COMMENT '审核状态 0 审核中 1审核通过 2审核不通过',
  `callbackUrl` varchar(100) NOT NULL COMMENT '审核通过回调地址',
  `orderId` varchar(100) NOT NULL COMMENT '订单ID(流水号)',
  `pay_status` int(11) NOT NULL DEFAULT '0' COMMENT '支付状态：-1 支持失败0 待支付，1支付中,2 支付完成待通知, 3支付完成已通知4.支付失败已退款',
  `cpf` varchar(30) DEFAULT NULL COMMENT 'BLR税号',
  `lockBankScore` bigint(20) NOT NULL DEFAULT '0' COMMENT '锁定银行积分',
  `currencyType` varchar(30) NOT NULL COMMENT '货币类型 BLR雷亚尔',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdraw_record`
--

LOCK TABLES `withdraw_record` WRITE;
/*!40000 ALTER TABLE `withdraw_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdraw_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'gameaccount'
--
/*!50003 DROP PROCEDURE IF EXISTS `AddBankCard` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddBankCard`(userIdx int(11),accountx VARCHAR(30),namex VARCHAR(30),bankTypex VARCHAR(30), cpfx VARCHAR(30))
BEGIN

	INSERT INTO bankbindlist(userId,account,name,bankType,cpf) VALUES(userIdx,accountx,namex,bankTypex,cpfx);

	SELECT LAST_INSERT_ID() as rcode;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddDaSub` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddDaSub`(userIdx INT (11),goldx INT (11),change_typex INT(2))
BEGIN

	DECLARE scorex INT DEFAULT -1;

	SELECT score INTO scorex FROM userinfo_imp WHERE userId = useridx;

	IF scorex = -1 or scorex < (goldx * -1) THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE userinfo_imp SET score=score+goldx WHERE userId = userIdx;

		INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(userIdx,scorex,goldx,scorex + goldx,change_typex,0);

		SELECT 1 AS rcode;

	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddDiamond` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddDiamond`(userIdx INT (11),goldx Int (11),change_typex int(2))
BEGIN

	DECLARE diamondx INT DEFAULT -1;

	SELECT diamond INTO diamondx FROM userinfo_imp WHERE userId = useridx;

	IF diamondx = -1 THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE userinfo_imp SET diamond=diamond+goldx WHERE userId = userIdx;

		INSERT INTO diamond_changelog(userid,diamond_before,diamond_change,diamond_current,change_type,isOnline) VALUES(userIdx,diamondx,goldx,diamondx + goldx,change_typex,0);

		SELECT 1 AS rcode;

	END IF;

   END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddDiamondSub` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddDiamondSub`(userIdx INT (11),goldx INT (11),change_typex INT(2))
BEGIN

	DECLARE diamondx INT DEFAULT -1;

	SELECT diamond INTO diamondx FROM userinfo_imp WHERE userId = useridx;

	IF diamondx = -1 or diamondx < (goldx * -1) THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE userinfo_imp SET diamond=diamond+goldx WHERE userId = userIdx;

		INSERT INTO diamond_changelog(userid,diamond_before,diamond_change,diamond_current,change_type,isOnline) VALUES(userIdx,diamondx,goldx,diamondx + goldx,change_typex,0);

		SELECT 1 AS rcode;

	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddGold` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddGold`(userIdx INT (11),goldx Int (11),change_typex int(2))
BEGIN

	DECLARE scorex INT DEFAULT -1;

	SELECT score INTO scorex FROM userinfo_imp WHERE userId = useridx;

	IF scorex = -1 THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE userinfo_imp SET score=score+goldx WHERE userId = userIdx;

		INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(userIdx,scorex,goldx,scorex + goldx,change_typex,0);

		SELECT 1 AS rcode;

	END IF;

   END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddGoldSub` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `AddGoldSub`(userIdx INT (11),goldx INT (11),change_typex INT(2))
BEGIN

	DECLARE scorex INT DEFAULT -1;

	SELECT score INTO scorex FROM userinfo_imp WHERE userId = useridx;

	IF scorex = -1 or scorex < (goldx * -1) THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE userinfo_imp SET score=score+goldx WHERE userId = userIdx;

		INSERT INTO score_changelog(userid,score_before,score_change,score_current,change_type,isOnline) VALUES(userIdx,scorex,goldx,scorex + goldx,change_typex,0);

		SELECT 1 AS rcode;

	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `BankAddScore` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `BankAddScore`(_userId INT (11),_bankScore bigint (30),change_typex int(2))
BEGIN

	DECLARE scorex INT DEFAULT -1;

	SELECT score INTO scorex FROM userinfo_imp WHERE userId = _userId;

	IF scorex = -1 THEN

		SELECT 0 AS rcode;

	ELSE

		UPDATE gameaccount.userinfo_imp SET  bankScore = bankScore + _bankScore  where userId = _userId;

		INSERT INTO bank_score_changelog(userid, bank_score_before, bank_score_change, bank_score_current, change_type, isOnline) VALUES(_userId, scorex, _bankScore, scorex+_bankScore, change_typex, 0);

		SELECT 1 AS rcode;

	END IF;

   END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `BankTransfer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `BankTransfer`(IN _userId INT (11),IN _giveUserId INT (11), IN _bankScore INT(30), IN change_typex INT(2))
BEGIN

	DECLARE bank_score_x INT DEFAULT -1;

	DECLARE bank_score_y INT DEFAULT -1;

	SELECT bankScore INTO bank_score_x FROM userinfo_imp WHERE userId = _userId;

	SELECT bankScore INTO bank_score_y FROM userinfo_imp WHERE userId = _giveUserId;





	
	IF bank_score_x >= _bankScore AND bank_score_y > -1  THEN

		
		UPDATE gameaccount.userinfo_imp SET  bankScore = bankScore-_bankScore  where userId = _userId;

		INSERT INTO log_bank_score_change(userid, bank_score_before, bank_score_change, bank_score_current, change_type, isOnline) VALUES(_userId, bank_score_x, _bankScore, bank_score_x-_bankScore, change_typex, 0);

		

		
		UPDATE gameaccount.userinfo_imp SET  bankScore = bankScore+_bankScore  where userId = _giveUserId;

		INSERT INTO log_bank_score_change(userid, bank_score_before, bank_score_change, bank_score_current, change_type, isOnline) VALUES(_giveUserId, bank_score_y, _bankScore, bank_score_y+_bankScore, change_typex, 0);

		
		INSERT INTO gameaccount.log_bank_transfer(from_userid, to_userid, transfer_bank_score)VALUES(_userId, _giveUserId, _bankScore);

		SELECT LAST_INSERT_ID() AS logTransferId, 1 as rcode;

	ELSE

		SELECT LAST_INSERT_ID() AS logTransferId, 0 as rcode;

	END IF;

	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `BatchUpdateAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `BatchUpdateAccount`(IN user_data JSON)
BEGIN

	
    DECLARE user_count INT;

    DECLARE i INT DEFAULT 0;



    
    SET user_count = JSON_LENGTH(user_data);



    
    WHILE i < user_count DO

        
        SET @user_info = JSON_UNQUOTE(JSON_EXTRACT(user_data, CONCAT('$[', i, ']')));



        
       UPDATE newuseraccounts
		SET
		    is_vip = IF(JSON_EXTRACT(@user_info, '$.is_vip') IS NOT null AND JSON_EXTRACT(@user_info, '$.is_vip') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.is_vip')), is_vip),
		    housecard = IF(JSON_EXTRACT(@user_info, '$.housecard') IS NOT null AND JSON_EXTRACT(@user_info, '$.housecard') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.housecard')), housecard),
		    vip_score = IF(JSON_EXTRACT(@user_info, '$.vip_score') IS NOT null AND JSON_EXTRACT(@user_info, '$.vip_score') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.vip_score')), vip_score),
		    bankLock = IF(JSON_EXTRACT(@user_info, '$.bankLock') IS NOT null AND JSON_EXTRACT(@user_info, '$.bankLock') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.bankLock')), bankLock)
		WHERE
		    id = JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.id'));

		           

           

         
        UPDATE userinfo_imp
		SET
		    bankScore = IF(JSON_EXTRACT(@user_info, '$.bankScore') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.bankScore')), bankScore),
		    luckyCoin = IF(JSON_EXTRACT(@user_info, '$.luckyCoin') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.luckyCoin')), luckyCoin)
		WHERE
		    userId = JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.id'));
           
        UPDATE userinfo
        SET
         	firstRecharge = IF(JSON_EXTRACT(@user_info, '$.firstRecharge') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.firstRecharge')), firstRecharge),
         	login_count = IF(JSON_EXTRACT(@user_info, '$.loginCount') IS NOT NULL, JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.loginCount')), login_count)
        WHERE
            userId = JSON_UNQUOTE(JSON_EXTRACT(@user_info, '$.id'));



        SET i = i + 1;

    END WHILE;

   

 

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `changeOfficial` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `changeOfficial`(userIdx INT(11),newAccountx VARCHAR(30), passwordx VARCHAR(32),px VARCHAR(30))
BEGIN

	set @name = "";

	set @count = 0;

	SELECT count(*) INTO @count FROM newuseraccounts WHERE Account = newAccountx;

	if @count > 0 then

		SELECT 0 AS rcode;

	else

		update newuseraccounts set Account = newAccountx,Password = passwordx,p = px,official=1 where Id = userIdx;

		SELECT 1 AS rcode;

	end if;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `checkPhone` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `checkPhone`(idx INT(11),phoneNox VARCHAR(11))
BEGIN

	SET @flag = 0;

	SET @phone = "";

	SELECT COUNT(*) INTO @flag FROM newuseraccounts WHERE phoneNo = phoneNox;

	select phoneNo INTO @phone FROM newuseraccounts WHERE Id = idx;

	if @flag = 1 or @phone != "" then

		select 0 as rcode;

	else

		select 1 AS rcode;

	end if;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `copyhand` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `copyhand`()
BEGIN

	DECLARE i INT DEFAULT 0;

	DECLARE randidx INT DEFAULT 0;

	select COUNT(*) INTO @recordcount from newuseraccounts where robot = 1;

	select COUNT(*) INTO @randMax from newuseraccounts where ADDDATE > '2016-12-29';

	while i < @recordcount do

		select FLOOR(RAND()* 10) into randidx;

		select headimgurl into @url from newuseraccounts where AddDate > '2016-12-29' LIMIT randidx,1;

		

		select Id into @idx from newuseraccounts where robot = 1 LIMIT i,1;

		update newuseraccounts SET headimgurl = @url where Id = @idx;

		set i = i + 1;

	end WHILE;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `creatAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `creatAccount`()
BEGIN

    DECLARE counter INT DEFAULT 1;

    DECLARE maxCounter INT DEFAULT 100; 
 	DECLARE user_account VARCHAR(255);

 	DECLARE nick_name VARCHAR(255);

 

    WHILE counter <= maxCounter DO

       

        SET user_account = CONCAT('user_', counter); 

        SET nick_name = CONCAT('nick_', counter); 



        
        INSERT INTO gameaccount.newuseraccounts (Account, `Password`, nickname, score, `AddDate`, LoginCount, p, diamond, giftTicket, phoneNo, email, sex, city, province, country, headimgurl, `language`, Robot, ChannelType, official, gametoken, qdid, housecard, totalRecharge, loginip, iscanlogin, diansha_score, diansha_gameids, is_vip, g4_uid, account_using, bankPwd, bankScore) VALUES(user_account, '4333a184fb3b39201530c593a86f8e14', nick_name, 100000, '2024-01-15 08:49:21.0', 0, '8I4E5F', 10, 0, '', '', -1, '', '', '', '9', '', 0, 'abc', 0, '', 0, 0, 0, '', 0, 0, '', 0, '', 1, '111111', 0);

		SELECT Id INTO @recordcount FROM newuseraccounts WHERE Account = user_account;

        INSERT INTO userInfo_imp(userId,score,diamond,giftTicket) VALUES(@recordcount,1000000,10,0);

		INSERT INTO userInfo(userId,firstexchange) values(@recordcount,0);

        SET counter = counter + 1;

    END WHILE;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `createRecharge` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `createRecharge`(userIdx INT(11),openidx VARCHAR(50),total_feex FLOAT(10),out_trade_nox VARCHAR(30),goodsIdx INT(2))
BEGIN

	SET @recordcount = (SELECT COUNT(*) FROM recharge WHERE out_trade_no = out_trade_nox);

	IF @recordcount <= 0 THEN

		INSERT INTO recharge(userId,Account,total_fee,out_trade_no,goodsid) VALUES(userIdx,openidx,total_feex,out_trade_nox,goodsIdx);

		SELECT 1 AS rcode;

	ELSE

		SELECT 0 AS rcode;

	END IF;

	

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetEmail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `GetEmail`(type_parm VARCHAR(255), _to_userid INT )
begin

	set @i = 1;

	

	

    SET @len = (SELECT LENGTH(type_parm) - LENGTH(REPLACE(type_parm, ',', '')) + 1);

   

   

    SET @temp_table_name = CONCAT('gameaccount.temp_email_result_', _to_userid);

   

   

    SET @create_table_sql = CONCAT('CREATE TEMPORARY TABLE IF NOT EXISTS ', @temp_table_name, ' (
        id INT,
        isRead INT,
        titleId VARCHAR(255),
        contentId VARCHAR(255),
        type INT,
        createTime DATETIME,
        goodsType INT,
        userId INT,
        nickname VARCHAR(255),
        headimgurl VARCHAR(255),
        val bigint
    )');

   

   

    PREPARE stmt FROM @create_table_sql;

    EXECUTE stmt;

    DEALLOCATE PREPARE stmt;

    

    

    WHILE @i <= @len DO

        SET @type = SUBSTRING_INDEX(SUBSTRING_INDEX(type_parm, ',', @i), ',', -1);

       	if @type = '0' then

       		

       		SET @insert_query = CONCAT('INSERT INTO ', @temp_table_name, ' select e.id, e.isRead, e.title_id  titleId , e.content_id contentId , e.`type`, e.createTime ,e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, b.transfer_bank_score val  from gameaccount.email e left join gameaccount.log_bank_transfer b on e.to_userid = b.to_userid  and e.otherId = b.id left join gameaccount.newuseraccounts n on e.from_userid  = n.Id where  e.type = 0 and e.to_userid =', _to_userid);

			PREPARE stmt FROM @insert_query;

            EXECUTE stmt;

            DEALLOCATE PREPARE stmt;

       	elseif @type = '1' then

			

       		SET @insert_query = CONCAT('INSERT INTO ', @temp_table_name, ' select e.id, e.isRead, e.title_id  titleId , e.content_id contentId , e.`type`, e.createTime ,e.goods_type goodsType, n.id userId, n.nickname, n.headimgurl, b.rebate_glod  val  from gameaccount.email e left join ym_manage.agent_rebate  b on e.otherId = b.id left join gameaccount.newuseraccounts n on e.from_userid = n.Id where e.type = 1 and  e.to_userid =', _to_userid);

       		PREPARE stmt FROM @insert_query;

            EXECUTE stmt;

            DEALLOCATE PREPARE stmt;

       	end if;

      

        set @i = @i + 1;

    END WHILE;

   

	

    SET @query = CONCAT('SELECT * FROM ', @temp_table_name);

	PREPARE stmt FROM @query;

    EXECUTE stmt;

    DEALLOCATE PREPARE stmt;

    

    SET @del = CONCAT('DROP TEMPORARY TABLE IF EXISTS ', @temp_table_name);

   	PREPARE stmt FROM @del;

    EXECUTE stmt;

    DEALLOCATE PREPARE stmt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginaddTempDiamond` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginaddTempDiamond`(userIdx INT(11))
BEGIN

	SELECT * FROM tempAddDiamond WHERE userId=userIdx;

	delete from tempAddDiamond where userId=userIdx;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginaddTempScore` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginaddTempScore`(userIdx INT(11))
BEGIN

	SELECT * FROM tempAddScore WHERE userId=userIdx;

	delete from tempAddScore where userId=userIdx;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginByEmail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginByEmail`(em VARCHAR(50))
BEGIN

	SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.email = em;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginByGoogle` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginByGoogle`(_uid VARCHAR(50),nickname VARCHAR(40),_email VARCHAR(50))
BEGIN

	SET @id = 0;
	SET @email = '';
	SET @eid = 0;

	SELECT Id , email INTO @eid , @email FROM newuseraccounts WHERE email = _email LIMIT 1;
	SELECT Id INTO @id FROM newuseraccounts WHERE google_uid = _uid LIMIT 1;
	IF @id <= 0 and @email IS NOT NULL AND @email != '' then
		
		SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.google_uid = _uid LIMIT 1;
	elseif @eid > 0 and @id <= 0 then
		
		update newuseraccounts set google_uid = _uid where Id = @id;
		SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.google_uid = _uid LIMIT 1;
	else
		SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.google_uid = _uid LIMIT 1;
	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginByPassword` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginByPassword`(accountx VARCHAR(50),passwordx VARCHAR(50))
BEGIN

	SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.Account=accountx AND a.PASSWORD=passwordx;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LoginByToken` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LoginByToken`(userId int(11))
BEGIN

	SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.id = userId;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `LogLotterySearch` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `LogLotterySearch`(gameid varChar(32),line int)
BEGIN

	if gameid = '1' then 

		SELECT fish.fishlog.*,newuseraccounts.Account FROM fish.fishlog JOIN newuseraccounts ON fish.fishlog.userid=newuseraccounts.Id WHERE mark = 0 LIMIT line;

	elseif gameid = '2' then 

		SELECT tiger.lotterylog.*,newuseraccounts.Account FROM tiger.lotterylog JOIN newuseraccounts ON tiger.lotterylog.userid=newuseraccounts.Id WHERE mark = 0 LIMIT line;

	elseif gameid = '3' then

		SELECT 28game.downcoinlog.*,newuseraccounts.Account FROM tiger.lotterylog JOIN newuseraccounts ON tiger.lotterylog.userid=newuseraccounts.Id WHERE mark = 0 LIMIT line;

	end if;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `mark` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `mark`(pkid VARCHAR(10))
BEGIN

	set @flag = false;

	set @id = 0;

	select id,mark into @id,@flag from mark where id = pkid;

	

	if @id then

		if @flag then

			select 1 as rcode;

		else

		 	update mark set mark = 1 WHERE id = pkid;

		 	SELECT 0 AS rcode;

		end if;

	else

		select 2 as rcode;

	end if;

	

	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `RegisterByEmail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `RegisterByEmail`(_email VARCHAR(50),_account VARCHAR(50),_pwd VARCHAR(64),_nickname VARCHAR(128),_king VARCHAR(20))
BEGIN

	SET @recordcount = 0;

	SELECT Id INTO @recordcount FROM newuseraccounts WHERE email = _email;

	IF @recordcount <= 0 THEN

		INSERT INTO newuseraccounts(Account,`Password`,nickname,email,p) VALUES(_account,_pwd,_nickname,_email,_king);

		SELECT Id INTO @recordcount FROM newuseraccounts WHERE email = _email;

		INSERT INTO userInfo_imp(userId,diamond) VALUES(@recordcount,0);

		INSERT INTO userInfo(userId) values(@recordcount);	

	END IF;


	SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.email = _email;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `RegisterByGoogle` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `RegisterByGoogle`(_uid VARCHAR(50),_email VARCHAR(50),_account VARCHAR(50),_pwd VARCHAR(64),_nickname VARCHAR(128),_king VARCHAR(20))
begin

		SET @id = 0;

		SELECT Id INTO @id FROM newuseraccounts WHERE google_uid = _uid;

		IF @id <= 0 then

			

			INSERT INTO newuseraccounts(Account,`Password`,nickname,email, google_uid,p) VALUES(_account,_pwd, _nickname,_email,_uid, _king);

			SELECT Id INTO @recordcount FROM newuseraccounts WHERE google_uid = _uid;

			INSERT INTO userInfo_imp(userId,score,diamond) VALUES(@recordcount,0,0);

			INSERT INTO userInfo(userId) values(@recordcount);	

		END IF;	
		SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.google_uid = _uid limit 1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `RegisterByGuest` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `RegisterByGuest`(Accountx VARCHAR(50),Passwordx VARCHAR(32),nicknamex VARCHAR(40),scorex INT(20),px VARCHAR(20),phoneNox VARCHAR(13),emailx VARCHAR(20),sexx INT(1),cityx VARCHAR(20),countryx VARCHAR(20),provincex VARCHAR(20),headimgurlx VARCHAR(200),languagex VARCHAR(10),logincodex VARCHAR(40),ChannelTypex VARCHAR(30),bindUserId VARCHAR(30),did VARCHAR(20),ipx VARCHAR(50))
BEGIN

	SET @recordcount = 0;



	SELECT Id INTO @recordcount FROM newuseraccounts WHERE Account = Accountx;

	IF @recordcount <= 0 THEN

		INSERT INTO newuseraccounts(Account,PASSWORD,nickname,p,phoneNo,email,sex,city,province,country,headimgurl,LANGUAGE,ChannelType,official,loginip) VALUES(Accountx,Passwordx,nicknamex,px,phoneNox,emailx,sexx,cityx,provincex,countryx,headimgurlx,languagex,ChannelTypex,0,ipx);

		SELECT Id INTO @recordcount FROM newuseraccounts WHERE Account = Accountx;

		INSERT INTO userInfo_imp(userId,score,diamond) VALUES(@recordcount,0,0);

		INSERT INTO userInfo(userId) values(@recordcount);

	END IF;

	

	SELECT * FROM gameaccount.newuseraccounts a left join gameaccount.userinfo_imp u on a.id = u.userId left join gameaccount.userinfo u2 on u2.userId = a.Id  WHERE a.Account = Accountx;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sendEmail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sendEmail`(userIdx INT(11),winPropIdx INT(3),winPropCountx INT(10),winScorex INT(20),typex INT(2),sendCoinUserIdx int(11),nicknamex VARCHAR(40))
BEGIN

	INSERT INTO msg(userId,winPropId,winPropCount,winScore,TYPE,sendCoinUserId,nickname) VALUES(userIdx,winPropIdx,winPropCountx,winScorex,typex,sendCoinUserIdx,nicknamex);

	SELECT @@IDENTITY as id;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `tempadddiamond` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `tempadddiamond`(useridx int(11),scorex INT(20),typex int(3))
BEGIN

	INSERT tempadddiamond(userId,score,change_type) VALUE(useridx,scorex,typex);

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `tempaddscore` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `tempaddscore`(useridx int(11),scorex INT(20),typex int(3))
BEGIN

	INSERT tempaddscore(userId,score,change_type) VALUE(useridx,scorex,typex);

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `updateProp` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `updateProp`(useridx VARCHAR(32),propidx int(4),propcountx int(10),roomidx int(10),typex INT(1))
BEGIN

	DECLARE recordcount INT DEFAULT 0;

	DECLARE prop_before_count INT DEFAULT 0;

	DECLARE prop_after_count INT DEFAULT 0;

	SELECT COUNT(*) INTO recordcount FROM gameaccount.prop_item WHERE userid = useridx AND propid = propidx;

	IF recordcount > 0 THEN

		SELECT propcount INTO prop_before_count FROM gameaccount.prop_item WHERE userid = useridx AND propid = propidx;

		UPDATE gameaccount.prop_item SET propcount = propcount + propcountx WHERE userid = useridx AND propid = propidx;

		SELECT propcount INTO prop_after_count FROM gameaccount.prop_item WHERE userid = useridx AND propid = propidx;

	ELSE

		INSERT INTO gameaccount.prop_item(userid,propid,propcount) VALUES(useridx,propidx,propcountx);

		SELECT propcount INTO prop_after_count FROM gameaccount.prop_item WHERE userid = useridx AND propid = propidx;

	END IF;

	

	INSERT INTO gameaccount.`prop_changelog`(userid,propid,change_before,change_count,change_after,gameid,codeid) VALUES(useridx,propidx,prop_before_count,propcountx,prop_after_count,roomidx,typex);

	

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `updateRecharge` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `updateRecharge`(out_trade_nox VARCHAR(30))
BEGIN

	SELECT state INTO @state FROM recharge WHERE out_trade_no = out_trade_nox;

	IF @state = 0 THEN

		UPDATE recharge SET state = 1 WHERE out_trade_no = out_trade_nox;

	 	SELECT * FROM recharge WHERE out_trade_no = out_trade_nox;

	ELSE

	 	SELECT 2 AS rcode;

	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `updateScoreOut` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `updateScoreOut`(out_trade_nox VARCHAR(30),flag int(1),remarkx VARCHAR(50))
BEGIN

	SELECT state INTO @state FROM scoreout WHERE out_trade_no = out_trade_nox;

	IF @state = 0 THEN

		UPDATE scoreout SET state = flag,outDate = NOW(),remark=remarkx WHERE out_trade_no = out_trade_nox;

	 	SELECT * FROM scoreout WHERE out_trade_no = out_trade_nox;

	ELSE

	 	SELECT 1 AS rcode;

	END IF;

    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-15 11:05:53
