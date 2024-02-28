-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: yunning
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
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(100) NOT NULL DEFAULT '',
  `salt` char(6) NOT NULL DEFAULT '',
  `isagent` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'admin','515111d528498df3d502f022c05a67f4','8e42b5',0);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agentinfo`
--

DROP TABLE IF EXISTS `agentinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agentinfo` (
  `aid` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'admin ID',
  `level` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `yqcode` char(6) NOT NULL DEFAULT '',
  `name` varchar(100) NOT NULL DEFAULT '',
  `wxname` varchar(100) NOT NULL DEFAULT '',
  `mobile` varchar(255) NOT NULL DEFAULT '',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `pid` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '上级代理ID',
  `uid` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '玩家ID',
  `commission` decimal(30,2) unsigned DEFAULT '0.00',
  `score` bigint(20) unsigned DEFAULT '0',
  PRIMARY KEY (`aid`),
  UNIQUE KEY `aid` (`aid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agentinfo`
--

LOCK TABLES `agentinfo` WRITE;
/*!40000 ALTER TABLE `agentinfo` DISABLE KEYS */;
INSERT INTO `agentinfo` VALUES (99,1,'012789','','','','1600764602',0,99,0.00,0),(3030,1,'012357','','','','1569210438',0,3030,0.00,0),(10725,2,'012367','','','','1599037112',3030,10725,0.00,0),(10735,1,'026789','','','','1605021140',0,10735,0.00,0),(10794,2,'025679','','','','1592109778',3030,10794,0.00,0),(1111111,2,'035789','','','13982087461','1583762457',3030,1111111,0.00,0);
/*!40000 ALTER TABLE `agentinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `value` text NOT NULL,
  `flag` varchar(100) NOT NULL DEFAULT '',
  `desc` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `flag` (`flag`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` VALUES (1,'提现手续费','5','TIXIAN_LV','百分比'),(2,'公告文本上','2222222222222','GONGGAO_TOP','yxx'),(3,'公告文本下','333333333333','GONGGAO_BOTTOM','yxx'),(4,'管理员微信','lengmotiandi','MANAGER_WECHAT_NUMBER',''),(5,'客服默认回复','感谢您的联系','KEFU_RETURNMSG','首次联系客服回复'),(6,'鱼虾蟹显示URL','https://weibo.com','YXX_URL','yxx');
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `downcoinlog`
--

DROP TABLE IF EXISTS `downcoinlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `downcoinlog` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `MatchId` int(20) DEFAULT '0' COMMENT '场次ID',
  `downCoin` int(11) NOT NULL DEFAULT '0',
  `winCoin` int(11) NOT NULL DEFAULT '0',
  `open2` int(11) DEFAULT NULL,
  `open3` int(11) DEFAULT NULL,
  `open4` int(11) DEFAULT NULL,
  `tax` int(9) DEFAULT NULL,
  `isBanker` tinyint(1) NOT NULL DEFAULT '0',
  `serverId` int(3) NOT NULL DEFAULT '1',
  `tableid` int(3) NOT NULL DEFAULT '0',
  `Adddate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mark` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=39392 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `downcoinlog`
--

LOCK TABLES `downcoinlog` WRITE;
/*!40000 ALTER TABLE `downcoinlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `downcoinlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fanyong`
--

DROP TABLE IF EXISTS `fanyong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fanyong` (
  `aid` int(10) unsigned NOT NULL,
  `usernum` int(10) unsigned NOT NULL DEFAULT '0',
  `czfee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00',
  `kuifee` decimal(30,2) NOT NULL DEFAULT '0.00',
  `yufee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00',
  `createtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`aid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fanyong`
--

LOCK TABLES `fanyong` WRITE;
/*!40000 ALTER TABLE `fanyong` DISABLE KEYS */;
/*!40000 ALTER TABLE `fanyong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fanyong_log`
--

DROP TABLE IF EXISTS `fanyong_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fanyong_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `aid` int(10) unsigned NOT NULL DEFAULT '0',
  `addfee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00',
  `oldfee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00',
  `newfee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00',
  `createtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fanyong_log`
--

LOCK TABLES `fanyong_log` WRITE;
/*!40000 ALTER TABLE `fanyong_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `fanyong_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fanyong_xflog`
--

DROP TABLE IF EXISTS `fanyong_xflog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fanyong_xflog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `aid` int(10) unsigned NOT NULL DEFAULT '0',
  `xffee` decimal(30,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '元',
  `createtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='消费表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fanyong_xflog`
--

LOCK TABLES `fanyong_xflog` WRITE;
/*!40000 ALTER TABLE `fanyong_xflog` DISABLE KEYS */;
/*!40000 ALTER TABLE `fanyong_xflog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fkrechargelog`
--

DROP TABLE IF EXISTS `fkrechargelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fkrechargelog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `userid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fkrechargelog`
--

LOCK TABLES `fkrechargelog` WRITE;
/*!40000 ALTER TABLE `fkrechargelog` DISABLE KEYS */;
INSERT INTO `fkrechargelog` VALUES (1,1,10987,'1587364973',100,10,110,1),(2,1,10987,'1587364980',1,110,109,0),(3,1,26,'1606240669',1000,10,1010,1),(4,1,7,'1606240859',1000,10,1010,1),(5,1,10710,'1607429538',2,10,8,0),(6,1,12908,'1612446908',1,10,11,1);
/*!40000 ALTER TABLE `fkrechargelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL DEFAULT '',
  `server` int(10) unsigned NOT NULL DEFAULT '0',
  `port` varchar(100) NOT NULL DEFAULT '',
  `version` varchar(50) DEFAULT '',
  `type` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '游戏类别',
  `isstart` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1开启  0关闭',
  `slotinfo` text,
  `choushuilv` tinyint(2) unsigned DEFAULT '0' COMMENT '1-10',
  `nandulv` tinyint(2) unsigned DEFAULT '0' COMMENT '1-10',
  `isshuigame` tinyint(1) unsigned DEFAULT '0' COMMENT '是否含水位的游戏 1是  0不是',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
INSERT INTO `game` VALUES (1,1,'捕鱼游戏新手',1,'13101','',3,1,'0',0,0,0),(19,1,'捕鱼游戏初级',3,'13103','',3,1,'0',0,0,0),(20,1,'捕鱼游戏中级',5,'13105','',3,1,'0',0,0,0),(21,1,'捕鱼游戏高级',7,'13107','',3,1,'0',0,0,0),(23,10,'德州扑克新手',1,'14101','',1,1,'0',0,0,0),(24,10,'德州扑克初级',2,'14102','',1,1,'0',0,0,0),(25,10,'德州扑克中级',3,'14103','',1,1,'0',0,0,0),(26,10,'德州扑克高级',4,'14104','0',1,1,'0',0,0,0),(27,11,'炸金花新手',1,'14201','',1,1,'0',0,0,0),(28,11,'炸金花初级',2,'14202','',1,1,'0',0,0,0),(29,11,'炸金花中级',3,'14203','',1,1,'0',0,0,0),(30,11,'炸金花高级',4,'14204','',1,1,'0',0,0,0),(32,4,'抢庄牛牛新手',1,'13401','',1,1,'0',0,3,0),(33,4,'抢庄牛牛初级',2,'13402','',1,1,'0',0,3,0),(34,4,'抢庄牛牛中级',3,'13403','',1,1,'0',0,3,0),(35,4,'抢庄牛牛高级',4,'13404','',1,1,'0',0,1,0),(36,9,'跑得快新手',1,'13801','',1,1,'0',0,0,0),(37,9,'跑得快初级',2,'13802','',1,1,'0',0,0,0),(38,9,'跑得快中级',3,'13803','',1,1,'0',0,0,0),(39,9,'跑得快高级',4,'13804','',1,1,'0',0,0,0),(40,7,'斗地主新手',1,'13701','',1,1,'0',0,0,0),(41,7,'斗地主初级',2,'13702','',1,1,'0',0,0,0),(42,7,'斗地主中级',3,'13703','',1,1,'0',0,0,0),(43,7,'斗地主高级',4,'13704','',1,1,'0',0,0,0),(46,1003,'龙虎斗-百人场',1,'16003','',3,1,NULL,1,2,1),(47,1004,'百家乐-百人场',1,'16004','',3,1,NULL,11,10,1),(48,6005,'猜大小-百人场',1,'16005','',3,1,NULL,11,2,1),(49,99999,'摇钱树',1,'99999','',3,1,NULL,9,4,1),(50,135,'钻石',15035,'15035','',2,1,'0',1,0,1),(51,136,'埃及珍宝',15036,'15036','',2,1,'0',10,1,1),(52,501,'金财神',15501,'15501','',2,1,'0',10,7,1),(53,105,'水果机',15005,'15005','',2,1,'0',6,4,1),(54,1006,'赛马',16006,'16006','',3,1,'0',1,6,1);
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_bak`
--

DROP TABLE IF EXISTS `game_bak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_bak` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL DEFAULT '',
  `server` int(10) unsigned NOT NULL DEFAULT '0',
  `port` varchar(100) NOT NULL DEFAULT '',
  `version` varchar(50) DEFAULT '',
  `type` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '游戏类别',
  `isstart` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1开启  0关闭',
  `slotinfo` text,
  `choushuilv` tinyint(2) unsigned DEFAULT '0' COMMENT '1-10',
  `isshuigame` tinyint(1) unsigned DEFAULT '0' COMMENT '是否含水位的游戏 1是  0不是',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_bak`
--

LOCK TABLES `game_bak` WRITE;
/*!40000 ALTER TABLE `game_bak` DISABLE KEYS */;
INSERT INTO `game_bak` VALUES (1,1,'捕鱼游戏',3,'13103','1',0,0,'0',0,0),(2,6,'连线游戏',1,'13601','2',0,0,'0',0,0),(3,100,'精灵女王',1,'15000','3',0,0,'0',0,0),(4,101,'万圣节',1,'15001','',0,0,'0',0,0),(5,102,'足球',15002,'15002','',0,0,'0',0,0),(6,105,'水果机',15005,'15005','',2,1,'0',6,1),(7,115,'三角魔阵',15015,'15015','',0,0,'0',0,0),(8,135,'钻石',15035,'15035','',0,0,'0',0,0),(9,136,'埃及珍宝',15036,'15036','',0,0,'0',0,0),(10,301,'俄罗斯转盘',15301,'15301','',0,0,'0',0,0),(11,501,'金财神',15501,'15501','',0,0,'0',0,0),(12,1000,'西游争霸',16000,'16000','',0,0,'0',0,0),(13,1001,'西游争霸2',16001,'16001','',0,0,'0',0,0),(14,3,'28游戏',1,'13201','',0,0,'0',0,0),(17,10,'牛牛游戏',1,'14001','',0,0,'0',0,0),(19,1,'捕鱼游戏',4,'13104','2',0,0,'0',0,0),(20,1,'捕鱼游戏',5,'13105','3',0,0,'0',0,0),(21,1,'捕鱼游戏',6,'13106','',0,0,'0',0,0),(22,1,'捕鱼游戏',11,'13111','',0,0,'0',0,0),(23,3,'28游戏',2,'13202','',0,0,'0',0,0),(24,3,'28游戏',3,'13203','',0,0,'0',0,0),(25,3,'28游戏',4,'13204','',0,0,'0',0,0),(26,4,'红包游戏',1,'0','0',0,0,'0',0,0),(27,5,'八搭二游戏',1,'13301','',0,0,'0',0,0),(28,5,'八搭二游戏',2,'13302','',0,0,'0',0,0),(29,5,'八搭二游戏',3,'13303','',0,0,'0',0,0),(30,5,'八搭二游戏',4,'13304','',0,0,'0',0,0),(31,10,'几何派对',1,'14101','',0,0,'0',0,0),(32,4,'抢庄牛牛',1,'13401','',0,0,'0',0,0),(33,4,'抢庄牛牛',2,'13402','',0,0,'0',0,0),(34,4,'抢庄牛牛',3,'13403','',0,0,'0',0,0),(35,4,'抢庄牛牛',4,'13404','',0,0,'0',0,0),(36,5,'经典牛牛',1,'13501','',0,0,'0',0,0),(37,5,'经典牛牛',2,'13502','',0,0,'0',0,0),(38,5,'经典牛牛',3,'13503','',0,0,'0',0,0),(39,5,'经典牛牛',4,'13504','',0,0,'0',0,0),(40,7,'Land',1,'13701','',0,0,'0',0,0),(41,7,'Land',2,'13702','',0,0,'0',0,0),(42,7,'Land',3,'13703','',0,0,'0',0,0),(43,7,'Land',4,'13704','',0,0,'0',0,0),(44,0,'斗地主-自创房间',0,'13750','',0,0,'0',0,0),(45,66,'鱼虾蟹',1,'13850','',0,1,'0',0,0);
/*!40000 ALTER TABLE `game_bak` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_bak1`
--

DROP TABLE IF EXISTS `game_bak1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_bak1` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` varchar(100) NOT NULL DEFAULT '',
  `server` int(10) unsigned NOT NULL DEFAULT '0',
  `port` varchar(100) NOT NULL DEFAULT '',
  `version` varchar(50) DEFAULT '',
  `type` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '游戏类别',
  `isstart` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1开启  0关闭',
  `slotinfo` text,
  `choushuilv` tinyint(2) unsigned DEFAULT '0' COMMENT '1-10',
  `nandulv` tinyint(2) unsigned DEFAULT '0' COMMENT '1-10',
  `isshuigame` tinyint(1) unsigned DEFAULT '0' COMMENT '是否含水位的游戏 1是  0不是',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_bak1`
--

LOCK TABLES `game_bak1` WRITE;
/*!40000 ALTER TABLE `game_bak1` DISABLE KEYS */;
INSERT INTO `game_bak1` VALUES (1,1,'捕鱼游戏新手',3,'13103','',3,1,'0',0,0,0),(19,1,'捕鱼游戏初级',4,'13104','',3,1,'0',0,0,0),(20,1,'捕鱼游戏中级',5,'13105','',3,1,'0',0,0,0),(21,1,'捕鱼游戏高级',6,'13106','',3,1,'0',0,0,0),(23,10,'德州扑克新手',1,'14101','',1,1,'0',0,0,0),(24,10,'德州扑克初级',2,'14102','',1,1,'0',0,0,0),(25,10,'德州扑克中级',3,'14103','',1,1,'0',0,0,0),(26,10,'德州扑克高级',4,'14104','0',1,1,'0',0,0,0),(27,11,'炸金花新手',1,'14201','',1,1,'0',0,0,0),(28,11,'炸金花初级',2,'14202','',1,1,'0',0,0,0),(29,11,'炸金花中级',3,'14203','',1,1,'0',0,0,0),(30,11,'炸金花高级',4,'14204','',1,1,'0',0,0,0),(32,4,'抢庄牛牛新手',1,'13401','',1,1,'0',0,0,0),(33,4,'抢庄牛牛初级',2,'13402','',1,1,'0',0,0,0),(34,4,'抢庄牛牛中级',3,'13403','',1,1,'0',0,0,0),(35,4,'抢庄牛牛高级',4,'13404','',1,1,'0',0,0,0),(36,9,'跑得快新手',1,'13801','',1,1,'0',0,0,0),(37,9,'跑得快初级',2,'13802','',1,1,'0',0,0,0),(38,9,'跑得快中级',3,'13803','',1,1,'0',0,0,0),(39,9,'跑得快高级',4,'13804','',1,1,'0',0,0,0),(40,7,'斗地主新手',1,'13701','',1,1,'0',0,0,0),(41,7,'斗地主初级',2,'13702','',1,1,'0',0,0,0),(42,7,'斗地主中级',3,'13703','',1,1,'0',0,0,0),(43,7,'斗地主高级',4,'13704','',1,1,'0',0,0,0),(46,1003,'龙虎斗-百人场',1,'16003','',3,1,NULL,3,6,1),(47,1004,'百家乐-百人场',1,'16004','',3,1,NULL,2,4,1),(48,6005,'猜大小-百人场',1,'16005','',3,1,NULL,0,0,1);
/*!40000 ALTER TABLE `game_bak1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_gonggao`
--

DROP TABLE IF EXISTS `game_gonggao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_gonggao` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `txt` varchar(255) NOT NULL DEFAULT '',
  `status` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '0关闭 1显示',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `updatetime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_gonggao`
--

LOCK TABLES `game_gonggao` WRITE;
/*!40000 ALTER TABLE `game_gonggao` DISABLE KEYS */;
INSERT INTO `game_gonggao` VALUES (1,'供货方菲菲232256',1,'1563442525','1568887598'),(4,'4657844611111',1,'1563443743','1568887361');
/*!40000 ALTER TABLE `game_gonggao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_onlinenum`
--

DROP TABLE IF EXISTS `game_onlinenum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_onlinenum` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT,
  `gid` int(10) unsigned NOT NULL DEFAULT '0',
  `gport` varchar(100) NOT NULL DEFAULT '',
  `num` int(20) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_onlinenum`
--

LOCK TABLES `game_onlinenum` WRITE;
/*!40000 ALTER TABLE `game_onlinenum` DISABLE KEYS */;
/*!40000 ALTER TABLE `game_onlinenum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kefu_huifu`
--

DROP TABLE IF EXISTS `kefu_huifu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kefu_huifu` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL DEFAULT '',
  `txt1` text,
  `txt2` text,
  `value1` varchar(255) DEFAULT '',
  `value2` varchar(255) DEFAULT '',
  `value3` varchar(255) DEFAULT '',
  `value4` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_huifu`
--

LOCK TABLES `kefu_huifu` WRITE;
/*!40000 ALTER TABLE `kefu_huifu` DISABLE KEYS */;
INSERT INTO `kefu_huifu` VALUES (1,'微信支付',NULL,NULL,'11111','2222','3333','4444');
/*!40000 ALTER TABLE `kefu_huifu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kefu_list`
--

DROP TABLE IF EXISTS `kefu_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kefu_list` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `account` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `isclose` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `score` bigint(20) unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_list`
--

LOCK TABLES `kefu_list` WRITE;
/*!40000 ALTER TABLE `kefu_list` DISABLE KEYS */;
INSERT INTO `kefu_list` VALUES (1,'0001','kf0001','111111',0,100001934),(2,'0002','kf0002','111111',0,100),(3,'0003','kf0003','111111',0,0),(4,'0004','kf0004','111111',0,0),(5,'0005','kf0005','111111',0,0),(7,'0007','kf0007','123456',0,0),(8,'nickn','kf0010','112233',0,100000000);
/*!40000 ALTER TABLE `kefu_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kefu_msg`
--

DROP TABLE IF EXISTS `kefu_msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kefu_msg` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `kfid` int(10) unsigned NOT NULL DEFAULT '0',
  `kfname` varchar(255) DEFAULT '',
  `uid` int(10) unsigned NOT NULL DEFAULT '0',
  `uname` varchar(255) DEFAULT '',
  `msg` varchar(255) NOT NULL DEFAULT '',
  `createtime` char(10) NOT NULL DEFAULT '',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1user send 2kefu send',
  PRIMARY KEY (`id`),
  KEY `kfid` (`kfid`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_msg`
--

LOCK TABLES `kefu_msg` WRITE;
/*!40000 ALTER TABLE `kefu_msg` DISABLE KEYS */;
INSERT INTO `kefu_msg` VALUES (23,8,'nickn',12711,'','感谢您的联系','1610956123',2),(24,8,'nickn',12711,'','111','1610956138',2),(25,8,'nickn',12711,'','111','1610956139',2),(26,8,'nickn',12711,'','111','1610956140',2),(27,8,'nickn',12711,'','111','1610956142',2),(28,8,'nickn',12711,'','22222','1610956186',2),(29,8,'nickn',12711,'','22222','1610956188',2),(30,8,'nickn',12711,'','22222','1610956188',2),(31,8,'nickn',12711,'','22222','1610956188',2),(32,8,'nickn',12711,'','22222','1610956189',2),(33,8,'nickn',12711,'','22222','1610956189',2),(34,8,'nickn',12711,'','22222','1610956189',2),(35,8,'nickn',12711,'','22222','1610956189',2),(36,8,'nickn',12711,'','22222','1610956190',2),(37,8,'nickn',12711,'','22222','1610956190',2),(38,8,'nickn',12711,'','3333','1610956193',2),(39,8,'nickn',12711,'','3333','1610956194',2),(40,8,'nickn',12711,'','3333','1610956194',2),(41,8,'nickn',12711,'','3333','1610956194',2),(42,8,'nickn',12711,'','谢谢您','1610956207',2),(43,8,'nickn',12711,'','谢谢您','1610956207',2),(44,8,'nickn',12711,'','谢谢您','1610956208',2),(45,8,'nickn',12711,'','谢谢您','1610956285',2),(46,1,'0001',12550,'','感谢您的联系','1610956482',2),(47,1,'0001',12550,'','3213123123','1610956494',2),(48,1,'0001',12550,'','3213123123','1610956494',2),(49,1,'0001',12550,'','3213123123','1610956494',2),(50,1,'0001',12550,'','3213123123','1610956495',2),(51,1,'0001',12550,'','3213123123','1610956500',2),(52,1,'0001',12550,'','3213123123','1610956500',2),(53,1,'0001',12550,'','3213123123','1610956500',2),(54,1,'0001',12550,'','3213123123','1610956500',2),(55,1,'0001',12550,'','3213123123','1610956500',2);
/*!40000 ALTER TABLE `kefu_msg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kefu_usergl`
--

DROP TABLE IF EXISTS `kefu_usergl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kefu_usergl` (
  `kfid` int(10) unsigned NOT NULL DEFAULT '0',
  `uid` int(10) unsigned NOT NULL DEFAULT '0',
  `uname` varchar(255) DEFAULT '',
  KEY `kfid` (`kfid`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_usergl`
--

LOCK TABLES `kefu_usergl` WRITE;
/*!40000 ALTER TABLE `kefu_usergl` DISABLE KEYS */;
/*!40000 ALTER TABLE `kefu_usergl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kucunlog`
--

DROP TABLE IF EXISTS `kucunlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kucunlog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int(10) unsigned NOT NULL DEFAULT '0',
  `shuiwei` int(10) unsigned NOT NULL DEFAULT '0',
  `kucun` bigint(20) unsigned NOT NULL DEFAULT '0',
  `jiangchi` bigint(20) unsigned NOT NULL DEFAULT '0',
  `createtime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kucunlog`
--

LOCK TABLES `kucunlog` WRITE;
/*!40000 ALTER TABLE `kucunlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `kucunlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matchlog`
--

DROP TABLE IF EXISTS `matchlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matchlog` (
  `matchId` int(20) NOT NULL AUTO_INCREMENT,
  `open11` char(2) DEFAULT NULL,
  `open12` char(2) DEFAULT NULL,
  `open21` char(2) DEFAULT NULL,
  `open22` char(2) DEFAULT NULL,
  `open31` char(2) DEFAULT NULL,
  `open32` char(2) DEFAULT NULL,
  `open41` char(2) DEFAULT NULL,
  `open42` char(2) DEFAULT NULL,
  `open2winbet` int(2) DEFAULT NULL,
  `open3winbet` int(2) DEFAULT NULL,
  `open4winbet` int(2) DEFAULT NULL,
  `tableId` int(3) DEFAULT NULL,
  `serveId` int(3) DEFAULT NULL,
  `adddate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`matchId`)
) ENGINE=MyISAM AUTO_INCREMENT=8918 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matchlog`
--

LOCK TABLES `matchlog` WRITE;
/*!40000 ALTER TABLE `matchlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `matchlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_category`
--

DROP TABLE IF EXISTS `news_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_category`
--

LOCK TABLES `news_category` WRITE;
/*!40000 ALTER TABLE `news_category` DISABLE KEYS */;
INSERT INTO `news_category` VALUES (2,'分类22');
/*!40000 ALTER TABLE `news_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_list`
--

DROP TABLE IF EXISTS `news_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news_list` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cid` int(10) unsigned NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL DEFAULT '',
  `content` text NOT NULL,
  `createtime` char(10) NOT NULL DEFAULT '0',
  `updatetime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_list`
--

LOCK TABLES `news_list` WRITE;
/*!40000 ALTER TABLE `news_list` DISABLE KEYS */;
INSERT INTO `news_list` VALUES (2,2,'321321','2223<s>33333</s>3454<img src=\"/static/kindeditor/attached/image/20191105/20191105095039_25746.jpg\" alt=\"\" />','1572942302','1572943879'),(3,2,'65443','<img src=\"/static/kindeditor/php/../attached/image/20191105/20191105095539_99456.png\" alt=\"\" /><img src=\"/static/kindeditor/php/../attached/image/20191105/20191105095539_15567.png\" alt=\"\" />32323232','1572944145','1572944145');
/*!40000 ALTER TABLE `news_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paylog`
--

DROP TABLE IF EXISTS `paylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paylog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(10) unsigned NOT NULL,
  `fee` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '1：微信支付；2：支付宝',
  `osn` varchar(255) NOT NULL DEFAULT '',
  `osnjz` varchar(255) NOT NULL DEFAULT '',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `paytime` char(10) NOT NULL DEFAULT '0',
  `status` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0待付款  1已付款 2已关闭',
  `payresmsg` text,
  `prepayresmsg` text,
  `payendtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='支付记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paylog`
--

LOCK TABLES `paylog` WRITE;
/*!40000 ALTER TABLE `paylog` DISABLE KEYS */;
/*!40000 ALTER TABLE `paylog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog`
--

DROP TABLE IF EXISTS `rechargelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `userid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog`
--

LOCK TABLES `rechargelog` WRITE;
/*!40000 ALTER TABLE `rechargelog` DISABLE KEYS */;
INSERT INTO `rechargelog` VALUES (1,1,10680,'1579192956',2000000000,20,2000000020,1),(2,1,10680,'1579192984',200000000,20,200000020,1),(3,1,10681,'1579193354',100000000,50,100000050,1),(4,1,10681,'1579228172',87714650,97714650,185429300,1),(5,1,10681,'1579228189',175429300,185429300,10000000,0),(6,1,10688,'1579443575',10000000,0,10000000,1),(7,1,10794,'1583681676',11111111111100,4768,11111111115868,1),(8,1,10627,'1585061169',1000000000,18,1000000018,1),(9,1,10903,'1585557884',1222200,0,1222200,1),(10,1,10918,'1585904570',100000000,90000,100090000,1),(11,1,10919,'1585904577',90000000,100000,90100000,1),(12,1,10920,'1585904584',1000000000,99920,1000099920,1),(13,1,10921,'1585904591',1000000000,370,1000000370,1),(14,1,10921,'1585905591',300000,1000000370,1000300370,1),(15,3030,3030,'1587365168',100,626589,626489,0),(16,3030,10987,'1587365168',100,24800,24900,1),(17,1,11018,'1589532727',1000000000,100125,1000100125,1),(18,1,14,'1589903649',10000000000,0,10000000000,1),(19,1,24791,'1590227559',200000,100000,300000,1),(20,10715,10715,'1590641185',10000,99300,89300,0),(21,10715,10714,'1590641185',10000,100348,110348,1),(22,1,10757,'1591588943',3000000000,0,3000000000,1),(23,1,10780,'1591934198',100000,99500,199500,1),(24,1,10794,'1592108710',1000000,100000,1100000,1),(25,1,10760,'1596983522',500000,1799,501799,1),(26,1,11089,'1597480091',1000000,45,1000045,1),(27,1,11089,'1597480372',1000000,45,1000045,1),(28,1,11303,'1598265154',100000000,53100,100053100,1),(29,1,11355,'1598439998',10000000,0,10000000,1),(30,1,11392,'1598520063',10000000,98732,10098732,1),(31,1,10820,'1599720389',123100,100000,223100,1),(32,1,1111,'1599962010',233300,599129,832429,1),(33,1,10867,'1599972282',1000000,87000,1087000,1),(34,1,11,'1600697662',10000,776632,786632,1),(35,1,1,'1600697681',100,634110,634210,1),(36,1,10000,'1600697738',1,507962,507963,1),(37,1,1,'1604227176',900000,100000,1000000,1),(38,1,1,'1604394212',100000000,999150,100999150,1),(39,1,20,'1606209734',100000000,100000,100100000,1),(40,1,22,'1606215852',100000000,100000,100100000,1),(41,1,5,'1607232714',11111111100,5320,11111116420,1),(42,1,1,'1607264782',9999999900,99998,10000099898,1),(43,1,22,'1607274241',10000,100000,110000,1),(44,1,11082,'1608788875',1000000,79990,1079990,1),(45,1,11082,'1608791065',10000000,1058050,11058050,1),(46,1,11143,'1609686735',10000000000,1240,10000001240,1),(47,1,11143,'1609686756',222000000000,440,222000000440,1),(48,1,10011069,'1610125819',1000000,100000,1100000,1),(49,1,12721,'1610960537',100000000,23365,100023365,1),(50,1,12768,'1611294906',1000000000,340,1000000340,1),(51,1,12809,'1611850136',100000000,100000,100100000,1);
/*!40000 ALTER TABLE `rechargelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog_agent`
--

DROP TABLE IF EXISTS `rechargelog_agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog_agent` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `agentid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_agent`
--

LOCK TABLES `rechargelog_agent` WRITE;
/*!40000 ALTER TABLE `rechargelog_agent` DISABLE KEYS */;
/*!40000 ALTER TABLE `rechargelog_agent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog_kefu`
--

DROP TABLE IF EXISTS `rechargelog_kefu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog_kefu` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `kefuid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_kefu`
--

LOCK TABLES `rechargelog_kefu` WRITE;
/*!40000 ALTER TABLE `rechargelog_kefu` DISABLE KEYS */;
INSERT INTO `rechargelog_kefu` VALUES (12,1,1,'1569214434',1002,0,1002,1),(13,1,1,'1569214440',1055,1002,2057,1),(14,1,1,'1569214450',11,2057,2046,0),(15,1,1,'1569221023',1,2046,2045,0),(16,0,1,'1569221803',3,2046,2043,0),(17,0,1,'1569221982',2,2043,2041,0),(18,0,1,'1569222237',2,2041,2039,0),(19,0,1,'1569222282',1,2039,2038,0),(20,0,1,'1569222555',1,2038,2037,0),(21,0,1,'1569222602',1,2037,2036,0),(22,0,1,'1569222828',1,2036,2035,0),(23,0,1,'1569222881',1,2035,2034,0),(24,1,1,'1598521009',100,2034,1934,0),(25,1,2,'1598521016',100,0,100,1),(26,1,1,'1604222597',100000000,1934,100001934,1),(27,1,1,'1607274721',10000,100001934,100011934,1),(28,1,1,'1607274731',10000,100011934,100001934,0),(29,1,8,'1610955821',100000000,0,100000000,1);
/*!40000 ALTER TABLE `rechargelog_kefu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog_kefu_zy`
--

DROP TABLE IF EXISTS `rechargelog_kefu_zy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog_kefu_zy` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `kefuid` int(10) unsigned NOT NULL DEFAULT '0',
  `uid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_kefu_zy`
--

LOCK TABLES `rechargelog_kefu_zy` WRITE;
/*!40000 ALTER TABLE `rechargelog_kefu_zy` DISABLE KEYS */;
INSERT INTO `rechargelog_kefu_zy` VALUES (15,1,3051,'1569219663',1000,51333,52333,1),(16,1,3051,'1569221023',1,51333,51334,1),(17,1,3051,'1569221299',1,51333,51334,1),(18,1,3051,'1569221459',2,51333,51335,1),(19,1,3051,'1569221482',2,51333,51335,1),(20,1,3051,'1569221600',3,51333,51336,1),(21,1,3051,'1569221687',100,51333,51433,1),(22,1,3051,'1569221803',3,51333,51336,1),(23,1,3051,'1569221982',2,51333,51335,1),(24,1,3051,'1569222237',2,51333,51335,1),(25,1,3051,'1569222282',1,51333,51334,1),(26,1,3051,'1569222555',1,51333,51334,1),(27,1,3051,'1569222602',1,51333,51334,1),(28,1,3051,'1569222828',1,51333,51334,1),(29,1,3051,'1569222881',1,51333,51334,1);
/*!40000 ALTER TABLE `rechargelog_kefu_zy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog_user`
--

DROP TABLE IF EXISTS `rechargelog_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned DEFAULT '0',
  `userid` int(10) unsigned DEFAULT '0',
  `createtime` char(10) DEFAULT '0',
  `czfee` bigint(20) unsigned DEFAULT '0',
  `oldfee` bigint(20) unsigned DEFAULT '0',
  `newfee` bigint(20) unsigned DEFAULT '0',
  `type` tinyint(1) unsigned DEFAULT '0' COMMENT '0 -  1 +',
  `fromtype` tinyint(3) unsigned DEFAULT '0' COMMENT '1-5',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_user`
--

LOCK TABLES `rechargelog_user` WRITE;
/*!40000 ALTER TABLE `rechargelog_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `rechargelog_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rechargelog_video`
--

DROP TABLE IF EXISTS `rechargelog_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rechargelog_video` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `userid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `czfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `oldfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `newfee` bigint(20) unsigned NOT NULL DEFAULT '0',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_video`
--

LOCK TABLES `rechargelog_video` WRITE;
/*!40000 ALTER TABLE `rechargelog_video` DISABLE KEYS */;
/*!40000 ALTER TABLE `rechargelog_video` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tytconfig`
--

DROP TABLE IF EXISTS `tytconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tytconfig` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `flag` varchar(255) NOT NULL DEFAULT '',
  `value` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tytconfig`
--

LOCK TABLES `tytconfig` WRITE;
/*!40000 ALTER TABLE `tytconfig` DISABLE KEYS */;
INSERT INTO `tytconfig` VALUES (1,'nandu','{\"1\":{\"big\":1,\"num\":5},\"2\":{\"big\":2,\"num\":5},\"3\":{\"big\":3,\"num\":5},\"4\":{\"big\":4,\"num\":5},\"5\":{\"big\":5,\"num\":5},\"6\":{\"big\":6,\"num\":5},\"7\":{\"big\":7,\"num\":5},\"8\":{\"big\":8,\"num\":5},\"9\":{\"big\":9,\"num\":5},\"10\":{\"big\":10,\"num\":5}}'),(2,'quan','{\"1\":\"201812250001\",\"2\":\"201812250002\",\"3\":\"201812250003\",\"4\":\"201812250004\",\"5\":\"201812250005\",\"6\":\"201812250006\",\"7\":\"201812250007\",\"8\":\"201812250008\",\"9\":\"201812250009\",\"10\":\"201812250010\"}'),(4,'deng','{\"1\":{\"text\":\"txt1\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"},\"2\":{\"text\":\"txt2\",\"lv\":4,\"ex\":\"2019-06-22 17:02:54\"},\"3\":{\"text\":\"txt3\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"},\"4\":{\"text\":\"\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"},\"5\":{\"text\":\"\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"},\"6\":{\"text\":\"\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"},\"7\":{\"text\":\"\",\"lv\":5,\"ex\":\"2019-06-22 17:02:54\"}}'),(5,'txt','\"TEXT\"'),(6,'jifen','{\"1\":{\"xiaohao\":1,\"huodelv\":2},\"2\":{\"xiaohao\":2,\"huodelv\":3},\"3\":{\"xiaohao\":3,\"huodelv\":4},\"4\":{\"xiaohao\":4,\"huodelv\":5},\"5\":{\"xiaohao\":5,\"huodelv\":6},\"6\":{\"xiaohao\":6,\"huodelv\":7},\"7\":{\"xiaohao\":7,\"huodelv\":8},\"8\":{\"xiaohao\":8,\"huodelv\":9},\"9\":{\"xiaohao\":9,\"huodelv\":10},\"10\":{\"xiaohao\":10,\"huodelv\":11}}');
/*!40000 ALTER TABLE `tytconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uidglaid`
--

DROP TABLE IF EXISTS `uidglaid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uidglaid` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(10) unsigned NOT NULL DEFAULT '0',
  `aid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COMMENT='uid与aid关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uidglaid`
--

LOCK TABLES `uidglaid` WRITE;
/*!40000 ALTER TABLE `uidglaid` DISABLE KEYS */;
INSERT INTO `uidglaid` VALUES (9,3308,3241,'1566365810'),(10,3287,3241,'1566366043'),(11,3378,3241,'1566366055'),(12,3317,3308,'1566366144'),(13,3330,3308,'1566366168'),(14,3325,3308,'1566366176'),(15,3376,3317,'1566366240'),(16,3232,3317,'1566366293'),(17,3227,3317,'1566366307'),(18,3326,3376,'1566366359'),(19,3335,3376,'1566366369'),(20,3313,3376,'1566366378'),(21,3327,3376,'1566367094'),(22,10794,3030,'1592109713'),(23,10725,3030,'1599037108');
/*!40000 ALTER TABLE `uidglaid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `openid` varchar(255) DEFAULT '',
  `account` varchar(255) DEFAULT NULL,
  `nickname` varchar(100) DEFAULT '',
  `avatar` varchar(255) DEFAULT '',
  `score` int(10) unsigned DEFAULT '0',
  `diamond` int(10) unsigned DEFAULT '0',
  `jifen` int(10) unsigned DEFAULT '0',
  `yue` decimal(10,2) unsigned DEFAULT '0.00',
  `createtime` char(10) DEFAULT '0',
  `logintime` char(10) DEFAULT '0',
  `uid` int(10) unsigned DEFAULT '0',
  `token` char(32) DEFAULT '',
  `fromtype` tinyint(1) unsigned DEFAULT '1' COMMENT '1-5',
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COMMENT='意大利8个游戏用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (5,'','000000q','000000q','2',100,0,0,0.00,'1563963361','1564042161',3149,'ad7c82a3f4bbcc0e9b82e9b60904a9bc',2);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'yunning'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-02-28 17:43:42
