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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fkrechargelog`
--

LOCK TABLES `fkrechargelog` WRITE;
/*!40000 ALTER TABLE `fkrechargelog` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_bak`
--

LOCK TABLES `game_bak` WRITE;
/*!40000 ALTER TABLE `game_bak` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_bak1`
--

LOCK TABLES `game_bak1` WRITE;
/*!40000 ALTER TABLE `game_bak1` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_gonggao`
--

LOCK TABLES `game_gonggao` WRITE;
/*!40000 ALTER TABLE `game_gonggao` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_huifu`
--

LOCK TABLES `kefu_huifu` WRITE;
/*!40000 ALTER TABLE `kefu_huifu` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_list`
--

LOCK TABLES `kefu_list` WRITE;
/*!40000 ALTER TABLE `kefu_list` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_msg`
--

LOCK TABLES `kefu_msg` WRITE;
/*!40000 ALTER TABLE `kefu_msg` DISABLE KEYS */;
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
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_category`
--

LOCK TABLES `news_category` WRITE;
/*!40000 ALTER TABLE `news_category` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_list`
--

LOCK TABLES `news_list` WRITE;
/*!40000 ALTER TABLE `news_list` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog`
--

LOCK TABLES `rechargelog` WRITE;
/*!40000 ALTER TABLE `rechargelog` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_kefu`
--

LOCK TABLES `rechargelog_kefu` WRITE;
/*!40000 ALTER TABLE `rechargelog_kefu` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_kefu_zy`
--

LOCK TABLES `rechargelog_kefu_zy` WRITE;
/*!40000 ALTER TABLE `rechargelog_kefu_zy` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tytconfig`
--

LOCK TABLES `tytconfig` WRITE;
/*!40000 ALTER TABLE `tytconfig` DISABLE KEYS */;
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

-- Dump completed on 2024-04-15 11:06:29
