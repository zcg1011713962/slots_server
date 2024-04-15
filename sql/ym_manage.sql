-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: ym_manage
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
-- Table structure for table `account_invite_sends`
--

DROP TABLE IF EXISTS `account_invite_sends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_invite_sends` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) DEFAULT NULL,
  `number` int(11) DEFAULT '1' COMMENT '推广人数',
  `gold` int(11) DEFAULT '0' COMMENT '绑定奖励金币',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='推广绑定奖励表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_invite_sends`
--

LOCK TABLES `account_invite_sends` WRITE;
/*!40000 ALTER TABLE `account_invite_sends` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_invite_sends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_invites`
--

DROP TABLE IF EXISTS `account_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invite_uid` int(11) DEFAULT '0' COMMENT '邀请人',
  `invitee_uid` int(11) DEFAULT '0' COMMENT '被邀请人',
  `created_at` datetime DEFAULT NULL COMMENT '邀请时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_index_invite_key` (`invite_uid`,`invitee_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='账号邀请记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_invites`
--

LOCK TABLES `account_invites` WRITE;
/*!40000 ALTER TABLE `account_invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `operator_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '子运营商ID',
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '活动类型',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '活动名称',
  `begin_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '活动结束时间',
  `image` varchar(100) NOT NULL DEFAULT '' COMMENT '活动宣传图片',
  `note` varchar(200) NOT NULL DEFAULT '' COMMENT '备注信息',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0 启用 1 禁用',
  `sort` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `operator_id` (`operator_id`) USING BTREE,
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_infomation_authreward`
--

DROP TABLE IF EXISTS `activity_infomation_authreward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_infomation_authreward` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL DEFAULT '',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 绑定 1 未绑定',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_infomation_authreward`
--

LOCK TABLES `activity_infomation_authreward` WRITE;
/*!40000 ALTER TABLE `activity_infomation_authreward` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_infomation_authreward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_infomation_daycharge`
--

DROP TABLE IF EXISTS `activity_infomation_daycharge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_infomation_daycharge` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `min` int(10) unsigned NOT NULL DEFAULT '0',
  `max` int(10) unsigned NOT NULL DEFAULT '0',
  `value` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_infomation_daycharge`
--

LOCK TABLES `activity_infomation_daycharge` WRITE;
/*!40000 ALTER TABLE `activity_infomation_daycharge` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_infomation_daycharge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_infomation_dayreward`
--

DROP TABLE IF EXISTS `activity_infomation_dayreward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_infomation_dayreward` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `value` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_infomation_dayreward`
--

LOCK TABLES `activity_infomation_dayreward` WRITE;
/*!40000 ALTER TABLE `activity_infomation_dayreward` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_infomation_dayreward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_infomation_firstcharge`
--

DROP TABLE IF EXISTS `activity_infomation_firstcharge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_infomation_firstcharge` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `min` int(10) unsigned NOT NULL DEFAULT '0',
  `max` int(10) unsigned NOT NULL,
  `value` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_infomation_firstcharge`
--

LOCK TABLES `activity_infomation_firstcharge` WRITE;
/*!40000 ALTER TABLE `activity_infomation_firstcharge` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_infomation_firstcharge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_infomation_invite`
--

DROP TABLE IF EXISTS `activity_infomation_invite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_infomation_invite` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `min` int(10) unsigned NOT NULL DEFAULT '0',
  `max` int(10) unsigned NOT NULL DEFAULT '0',
  `value` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_infomation_invite`
--

LOCK TABLES `activity_infomation_invite` WRITE;
/*!40000 ALTER TABLE `activity_infomation_invite` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_infomation_invite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_language_detail`
--

DROP TABLE IF EXISTS `activity_language_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_language_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) NOT NULL DEFAULT '0' COMMENT '活动ID',
  `language_id` int(11) NOT NULL DEFAULT '0' COMMENT '语言ID',
  `language` varchar(128) NOT NULL DEFAULT '' COMMENT '语言',
  `title` varchar(256) NOT NULL DEFAULT '' COMMENT '标题',
  `pic_url` varchar(256) NOT NULL DEFAULT '' COMMENT '图片',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态:1生效，0 待生效，2删除',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动多语言配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_language_detail`
--

LOCK TABLES `activity_language_detail` WRITE;
/*!40000 ALTER TABLE `activity_language_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_language_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_page_config`
--

DROP TABLE IF EXISTS `activity_page_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_page_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` int(11) DEFAULT NULL COMMENT '状态 0未启用 1启用',
  `show_location` varchar(20) DEFAULT NULL COMMENT '展示位置',
  `show_type` int(11) DEFAULT '0' COMMENT '显示类型 0 活动 1公告 2新机台',
  `title` varchar(50) DEFAULT NULL COMMENT '标题',
  `order` int(11) DEFAULT '0' COMMENT '排序',
  `pic_group` json DEFAULT NULL COMMENT '存多张活动图片地址',
  `game_address` varchar(100) DEFAULT NULL COMMENT '游戏地址',
  `start_time` datetime DEFAULT NULL COMMENT '活动开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '活动结束时间',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_page_config`
--

LOCK TABLES `activity_page_config` WRITE;
/*!40000 ALTER TABLE `activity_page_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_page_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_type`
--

DROP TABLE IF EXISTS `activity_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_type` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `begin_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `minimum_recharge_amount` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '最低充值金额',
  `win_statement_amount` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '彩金提现流水',
  `infomation_templet` varchar(50) NOT NULL DEFAULT '' COMMENT '活动规则详情 对应的某张表',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0 开启 1 禁用',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_type`
--

LOCK TABLES `activity_type` WRITE;
/*!40000 ALTER TABLE `activity_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activitys`
--

DROP TABLE IF EXISTS `activitys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activitys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `content` text,
  `created_at` int(11) DEFAULT NULL,
  `created_uid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activitys`
--

LOCK TABLES `activitys` WRITE;
/*!40000 ALTER TABLE `activitys` DISABLE KEYS */;
/*!40000 ALTER TABLE `activitys` ENABLE KEYS */;
UNLOCK TABLES;

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
  `isagent` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 1',
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
-- Table structure for table `agent_get_rebate_record`
--

DROP TABLE IF EXISTS `agent_get_rebate_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_get_rebate_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `invite_uid` bigint(20) NOT NULL COMMENT '代理人ID',
  `rebate_glod` bigint(20) NOT NULL COMMENT '返点金币数量',
  `created_at` datetime NOT NULL COMMENT '领取时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COMMENT='代理人领取返点记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_get_rebate_record`
--

LOCK TABLES `agent_get_rebate_record` WRITE;
/*!40000 ALTER TABLE `agent_get_rebate_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `agent_get_rebate_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent_rebate`
--

DROP TABLE IF EXISTS `agent_rebate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_rebate` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `invitee_uid` bigint(20) NOT NULL COMMENT '被邀请人ID',
  `rebate_glod` bigint(20) DEFAULT '0' COMMENT '返点金币数量',
  `created_at` datetime DEFAULT NULL,
  `invite_uid` bigint(20) NOT NULL COMMENT '代理人ID',
  `currency_type` varchar(10) NOT NULL COMMENT '充值货币类型 BRL雷亚尔',
  `currency_val` bigint(20) NOT NULL DEFAULT '0' COMMENT '充值货币数量',
  `type` int(11) NOT NULL DEFAULT '0' COMMENT '0绑定 1充值',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '0 待发放 1 发放成功 2 发放失败',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COMMENT='代理推广返点记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_rebate`
--

LOCK TABLES `agent_rebate` WRITE;
/*!40000 ALTER TABLE `agent_rebate` DISABLE KEYS */;
/*!40000 ALTER TABLE `agent_rebate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent_settlement`
--

DROP TABLE IF EXISTS `agent_settlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_settlement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mark_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'mark表 id',
  `uid` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `p_uid` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '父用户ID',
  `amount` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '佣金',
  `create_at` datetime NOT NULL,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否已结算 0 未结算 1 已结算',
  `every_statement` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '每次 平台5%流水',
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`,`p_uid`) USING BTREE,
  KEY `create_at` (`create_at`),
  KEY `mark_id` (`mark_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_settlement`
--

LOCK TABLES `agent_settlement` WRITE;
/*!40000 ALTER TABLE `agent_settlement` DISABLE KEYS */;
/*!40000 ALTER TABLE `agent_settlement` ENABLE KEYS */;
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
-- Table structure for table `banner`
--

DROP TABLE IF EXISTS `banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banner` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `begin_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 开启 1 关闭',
  `image` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banner`
--

LOCK TABLES `banner` WRITE;
/*!40000 ALTER TABLE `banner` DISABLE KEYS */;
/*!40000 ALTER TABLE `banner` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `black_list`
--

DROP TABLE IF EXISTS `black_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `black_list` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(50) NOT NULL,
  `admin_id` int(10) unsigned NOT NULL,
  `note` varchar(200) NOT NULL,
  `create_at` datetime NOT NULL,
  `delete_at` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `black_list`
--

LOCK TABLES `black_list` WRITE;
/*!40000 ALTER TABLE `black_list` DISABLE KEYS */;
/*!40000 ALTER TABLE `black_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cdkey`
--

DROP TABLE IF EXISTS `cdkey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cdkey` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(17) DEFAULT NULL COMMENT '卡密号码',
  `use_id` int(11) DEFAULT NULL COMMENT '使用者ID',
  `use_time` datetime DEFAULT NULL COMMENT '使用时间',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态 0 未使用 1 已使用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cdkey`
--

LOCK TABLES `cdkey` WRITE;
/*!40000 ALTER TABLE `cdkey` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdkey` ENABLE KEYS */;
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
  UNIQUE KEY `flag` (`flag`)
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
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '反馈用户',
  `content` text NOT NULL COMMENT '内容',
  `created_at` datetime NOT NULL COMMENT '反馈时间',
  `resolve_content` text COMMENT '反馈处理',
  `resolve_uid` varchar(64) DEFAULT '' COMMENT '经办人ID',
  `is_delete` int(11) NOT NULL DEFAULT '0' COMMENT '是否删除: 1删除 0 未删除',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '状态码: 0 待处理，1已处理',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolve_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COMMENT='意见反馈表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (1,20977,'abc20240314192923011B5F8I89b5b987124d2ec3','2024-03-14 19:30:30','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(2,20977,'反馈意见','2024-03-14 19:33:40','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(3,20977,'反馈意见','2024-03-14 19:34:10','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(4,20977,'反馈意见','2024-03-14 19:35:00','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(5,20977,'反馈意见','2024-03-14 19:38:58','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(6,21407,'11','2024-03-15 10:33:15','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(7,21407,'123435','2024-03-15 10:33:38','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(8,21407,'1234313455','2024-03-15 10:33:46','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(9,21407,'12345','2024-03-15 10:34:43','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(10,21407,'123456','2024-03-15 10:34:47','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(11,21425,'a','2024-03-15 16:36:39','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(12,21425,'a','2024-03-15 16:37:12','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(13,21428,'12222222222222222222222222','2024-03-15 17:59:12','','',0,0,'2024-03-16 09:39:48','2024-03-16 09:40:06'),(14,22018,'222','2024-03-30 05:29:07',NULL,'',0,0,'2024-03-30 08:29:07','2024-03-30 08:29:07'),(15,22018,'44','2024-03-30 05:29:16',NULL,'',0,0,'2024-03-30 08:29:16','2024-03-30 08:29:16'),(16,22015,'发发发发我发','2024-03-30 05:29:32',NULL,'',0,0,'2024-03-30 08:29:31','2024-03-30 08:29:31');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fkrechargelog`
--

LOCK TABLES `fkrechargelog` WRITE;
/*!40000 ALTER TABLE `fkrechargelog` DISABLE KEYS */;
INSERT INTO `fkrechargelog` VALUES (1,1,16121,'1677809954',1000,10,1010,1),(2,1,17117,'1686194933',99999,10,100009,1),(3,1,17400,'1688813924',100000,0,99998,1),(4,1,18626,'1694957811',9999999,10,10000009,1),(5,1,18768,'1696248274',10,10,0,0),(6,1,18770,'1696249614',10000000,10,10000010,1),(7,1,18771,'1696266859',150000,10,150010,1),(8,1,18771,'1696266917',50000,150010,200010,1),(9,1,18771,'1696267079',200010,200010,0,0),(10,1,18838,'1696843693',999999,10,1000009,1),(11,1,18838,'1701331858',999999999,1000009,1001000008,1),(12,1,20072,'1701333043',2147483647,10,2147483657,1),(13,1,20072,'1701333044',2147483647,2147483657,4294967304,1),(14,18773,20947,'1704795498',100,10,110,1);
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '游戏类别',
  `isstart` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '1开启  0关闭',
  `slotinfo` text,
  `choushuilv` tinyint(3) unsigned DEFAULT '0' COMMENT '1-10',
  `nandulv` tinyint(3) unsigned DEFAULT '0' COMMENT '1-10',
  `isshuigame` tinyint(3) unsigned DEFAULT '0' COMMENT '是否含水位的游戏 1是  0不是',
  `fish` varchar(50) NOT NULL DEFAULT '',
  `delete_at` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '0 未删除 大于0 已删除 (时间戳)',
  PRIMARY KEY (`id`),
  KEY `gameid` (`gameid`) USING BTREE,
  KEY `port` (`port`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
INSERT INTO `game` VALUES (154,229,'Freespin',15129,'15129','',2,1,'0',11,1,1,'',0),(202,272,'Jungledelight',15172,'15172','',2,1,NULL,3,9,1,'',0),(203,268,'FortuneTiger',15168,'15168','',2,1,NULL,2,9,1,'',0),(206,263,'GaneshaGold',15163,'15163','',2,1,NULL,10,10,1,'',0);
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
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
  `status` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '0关闭 1显示',
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
-- Table structure for table `game_ini_field`
--

DROP TABLE IF EXISTS `game_ini_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_ini_field` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL DEFAULT '0' COMMENT '父ID',
  `name` varchar(128) NOT NULL DEFAULT '' COMMENT '名称',
  `remark` varchar(128) NOT NULL DEFAULT '' COMMENT '备注',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态:1生效，0 待生效，2删除',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COMMENT='游戏ini文件类型';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_ini_field`
--

LOCK TABLES `game_ini_field` WRITE;
/*!40000 ALTER TABLE `game_ini_field` DISABLE KEYS */;
INSERT INTO `game_ini_field` VALUES (1,0,'图案连线','图案连线',1,'2024-03-20 02:31:47','2024-03-20 06:08:51'),(2,0,'下注挡位','下注挡位',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(3,0,'图案信息','图案信息',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(4,0,'图案权重','图案权重',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(5,0,'中奖配置','中奖配置',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(6,0,'奖池控制','奖池控制',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(7,0,'图案倍数','图案倍数',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(8,0,'样本生成器','样本生成器',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(9,0,'配牌器','配牌器',1,'2024-03-20 02:31:47','2024-03-20 02:31:47'),(10,1,'line_count','行数',1,'2024-03-20 04:44:10','2024-03-20 04:45:42'),(11,1,'col_count','列数',1,'2024-03-20 04:46:24','2024-03-20 04:47:18'),(12,2,'coin_config','对应客户端下注bet',1,'2024-03-20 04:48:11','2024-03-20 04:48:37'),(13,3,'icon_type_0','图案信息  （icon_type_ x 图案下标，递增不重复）',1,'2024-03-20 04:50:26','2024-03-20 04:50:43'),(14,3,'icon_type_1','图案信息1',1,'2024-03-20 04:53:23','2024-03-20 04:55:04'),(15,3,'icon_type_2','图案信息2',1,'2024-03-20 04:55:28','2024-03-20 04:55:28'),(16,3,'icon_type_3','图案信息3',1,'2024-03-20 04:56:34','2024-03-20 04:59:38'),(17,3,'icon_type_4','图案信息4',1,'2024-03-20 04:57:07','2024-03-20 04:57:07'),(18,3,'icon_type_5','图案信息5',1,'2024-03-20 04:58:31','2024-03-20 05:00:37'),(19,3,'icon_type_6','图案信息6',1,'2024-03-20 05:01:49','2024-03-20 05:01:49'),(20,3,'icon_type_7','图案信息7',1,'2024-03-20 05:02:11','2024-03-20 05:02:11'),(21,3,'icon_type_8','图案信息',1,'2024-03-20 05:02:41','2024-03-20 05:02:41'),(22,3,'icon_type_9','图案信息9',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(23,3,'icon_type_10','图案信息10',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(24,3,'icon_type_11','图案信息11',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(25,3,'icon_type_12','图案信息12',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(26,3,'icon_type_13','图案信息13',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(27,3,'icon_type_14','图案信息14',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(28,3,'icon_type_15','图案信息15',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(29,3,'icon_type_16','图案信息16',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(30,3,'icon_s_type_free','免费图案',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(31,3,'icon_s_type_jackpot','大奖图案',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(32,3,'icon_free_times','免费图案对应的免费次数',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(33,4,'col_weight_0','每条轴图案的权重(万分比)，数组下标对应icon_type_x',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(34,5,'line_win_lower_limit','最低需要单线连续图案数量，才算中奖',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(35,5,'icon_jackpot_lower_limit','jackpot出现次数，才算中jackpot',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(36,6,'jackpot_ratio_0','grand奖池比例',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(37,6,'jackpot_ratio_1','major奖池比例',1,'2024-03-20 05:17:54','2024-03-20 05:17:54'),(38,6,'jackpot_ratio_2','minor奖池比例',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(39,6,'jackpot_ratio_3','mini奖池比例',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(40,6,'jackpot_level_0','奖池控制',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(41,6,'jackpot_level_1','奖池控制',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(42,6,'jackpot_level_2','奖池控制',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(43,6,'jackpot_level_3','奖池控制',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(44,6,'bet_jackpot_level_0','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(45,6,'bet_jackpot_level_1','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(46,6,'bet_jackpot_level_2','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(47,6,'bet_jackpot_level_3','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(48,6,'bet_jackpot_level_4','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(49,6,'bet_jackpot_level_5','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(50,6,'bet_jackpot_level_6','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(51,6,'bet_jackpot_level_7','玩家下注对应奖池挡位（下注，所属奖池种类下标',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(52,6,'jackpot_pay_level_0','奖池种类下标对应不同奖池的概率',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(53,6,'jackpot_pay_level_1','奖池种类下标对应不同奖池的概率',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(54,6,'jackpot_pay_level_2','奖池种类下标对应不同奖池的概率',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(55,6,'jackpot_pay_level_3','奖池种类下标对应不同奖池的概率',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(56,7,'icon_mul_0','图案倍数',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(57,8,'sample_rtp_random_degree','随机次数',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(58,8,'sample_bet_sum','下注金额范围， 会影响jackpot中奖概率',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(59,9,'icon_type_bind','元素对应图案信息 icon_type_x',1,'2024-03-20 05:49:37','2024-03-20 05:49:37'),(60,4,'col_weight_1','每条轴图案的权重(万分比)，数组下标对应icon_type_x',1,'2024-03-20 05:52:44','2024-03-20 05:52:44');
/*!40000 ALTER TABLE `game_ini_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_ini_record`
--

DROP TABLE IF EXISTS `game_ini_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_ini_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL DEFAULT '0' COMMENT '游戏ID',
  `field_id` int(11) NOT NULL DEFAULT '0' COMMENT ' field id',
  `value` varchar(128) NOT NULL DEFAULT '0' COMMENT '值',
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '状态:1生效，0 待生效，2删除',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COMMENT='游戏配置记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_ini_record`
--

LOCK TABLES `game_ini_record` WRITE;
/*!40000 ALTER TABLE `game_ini_record` DISABLE KEYS */;
INSERT INTO `game_ini_record` VALUES (1,229,10,'88',2,'2024-03-20 07:56:51','2024-04-01 08:49:35'),(2,229,11,'7',1,'2024-03-20 07:56:51','2024-03-20 11:51:40'),(3,229,12,'[10, 20, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 700, 800, 1000, 1500, 2000, 3000, 5000, 6000, 8000]',1,'2024-03-20 08:38:18','2024-03-20 11:57:33'),(4,229,13,'free x5',1,'2024-03-20 08:38:58','2024-03-21 02:12:55'),(5,229,14,'4.0',1,'2024-03-20 08:39:28','2024-03-21 02:13:09'),(6,229,15,'800.0',1,'2024-03-20 08:40:04','2024-03-21 02:13:25'),(7,229,16,'6.0',1,'2024-03-20 08:41:05','2024-03-21 02:14:13'),(8,229,34,'3',1,'2024-03-20 09:53:53','2024-03-21 02:19:44'),(9,229,35,'3',1,'2024-03-20 09:54:13','2024-03-21 02:19:57'),(12,229,56,'[0, 0.4, 80, 0.6, 20, 1.2, 8, 0.8, 0, 10, 4, 15, 200, 0.2, 40, 2]',1,'2024-03-20 09:58:23','2024-03-21 02:32:01'),(13,229,33,'[10,600,500,500,400,300,100,50,40,30,20,10,10,10,5,3,1]',1,'2024-03-21 02:13:52','2024-03-21 02:13:52'),(14,229,17,'200.0',1,'2024-03-21 02:14:27','2024-03-21 02:14:27'),(15,229,18,'12.0',1,'2024-03-21 02:14:52','2024-03-21 02:14:52'),(16,229,19,'80.0',1,'2024-03-21 02:15:05','2024-03-21 02:15:05'),(17,229,20,'8.0',1,'2024-03-21 02:15:34','2024-03-21 02:15:34'),(18,229,21,'free x10 ',1,'2024-03-21 02:15:53','2024-03-21 02:15:53'),(19,229,22,'100.0 ',1,'2024-03-21 02:16:12','2024-03-21 02:16:12'),(20,229,23,'40.0',1,'2024-03-21 02:16:27','2024-03-21 02:16:27'),(21,229,24,'150.0',1,'2024-03-21 02:17:02','2024-03-21 02:17:02'),(22,229,25,'2000.0',1,'2024-03-21 02:17:19','2024-03-21 02:17:19'),(23,229,26,'2.0',1,'2024-03-21 02:17:36','2024-03-21 02:17:36'),(24,229,27,'400.0',1,'2024-03-21 02:17:52','2024-03-21 02:17:52'),(25,229,28,'20.0',1,'2024-03-21 02:18:06','2024-03-21 02:18:06'),(26,229,29,'jackpot',1,'2024-03-21 02:18:31','2024-03-21 02:18:31'),(27,229,30,'[0,8]',1,'2024-03-21 02:18:50','2024-03-21 02:18:50'),(28,229,31,'16',1,'2024-03-21 02:19:04','2024-03-21 02:19:04'),(29,229,32,'{\"0\": 5, \"8\": 10}',1,'2024-03-21 02:19:21','2024-03-21 02:19:21'),(30,229,36,'65',1,'2024-03-21 02:20:53','2024-03-21 02:20:53'),(31,229,37,'20',1,'2024-03-21 02:21:08','2024-03-21 02:21:08'),(32,229,38,'10',1,'2024-03-21 02:21:45','2024-03-21 02:21:45'),(33,229,39,'5',1,'2024-03-21 02:22:00','2024-03-21 02:22:00'),(34,229,40,'1000000,10',1,'2024-03-21 02:23:00','2024-03-21 02:23:00'),(35,229,41,'2000000,30',1,'2024-03-21 02:23:13','2024-03-21 02:23:13'),(36,229,42,'5000000,50',1,'2024-03-21 02:23:36','2024-03-21 02:23:36'),(37,229,43,'8000000,80',1,'2024-03-21 02:30:53','2024-03-21 02:30:53'),(38,229,44,'5000,0',1,'2024-03-21 02:31:18','2024-03-21 02:31:18'),(39,229,52,'[100,0,0,0]',1,'2024-03-21 02:31:39','2024-03-21 02:31:39'),(40,229,57,'1000',1,'2024-03-21 02:32:16','2024-03-21 02:32:16'),(41,229,58,'[40,1000]',1,'2024-03-21 02:32:35','2024-03-21 02:32:35'),(42,268,59,'1,1,1,1,1,1,1,1,1',1,'2024-03-21 06:33:17','2024-03-21 06:34:13');
/*!40000 ALTER TABLE `game_ini_record` ENABLE KEYS */;
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
  `gport` varchar(100) NOT NULL DEFAULT '',
  `num` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` char(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_onlinenum`
--

LOCK TABLES `game_onlinenum` WRITE;
/*!40000 ALTER TABLE `game_onlinenum` DISABLE KEYS */;
INSERT INTO `game_onlinenum` VALUES (1,39,'13804',5,'1637381642'),(2,41,'13702',10,'1637381643'),(3,25,'14103',2,'1637381643'),(4,23,'14101',4,'1637381643'),(5,26,'14104',3,'1637381643'),(6,46,'16003',10,'1637381644'),(7,42,'13703',5,'1637381644'),(8,47,'16004',10,'1637381644'),(9,24,'14102',3,'1637381645'),(10,54,'16006',0,'1637381645'),(11,35,'13404',469,'1637381645'),(12,33,'13402',1365,'1637381645'),(13,86,'16001',0,'1637381646'),(14,34,'13403',525,'1637381646'),(15,48,'16005',10,'1637381646'),(16,27,'14201',10,'1637381647'),(17,90,'16008',10,'1637381647'),(18,84,'15200',0,'1637381647'),(19,43,'13704',5,'1637381647'),(20,85,'15201',0,'1637381669'),(21,28,'14202',10,'1637381669'),(22,37,'13802',10,'1637381670'),(23,30,'14204',5,'1637381670'),(24,87,'16002',0,'1637381670'),(25,40,'13701',11,'1637381671'),(26,32,'13401',2086,'1637381671'),(27,36,'13801',10,'1637381671'),(28,38,'13803',5,'1637381671'),(29,39,'13804',5,'1637381701'),(30,41,'13702',10,'1637381702'),(31,25,'14103',2,'1637381702'),(32,23,'14101',4,'1637381702'),(33,26,'14104',3,'1637381702'),(34,46,'16003',10,'1637381703'),(35,42,'13703',5,'1637381703'),(36,47,'16004',10,'1637381703'),(37,24,'14102',3,'1637381703'),(38,54,'16006',0,'1637381704'),(39,35,'13404',470,'1637381704'),(40,33,'13402',1366,'1637381704'),(41,86,'16001',0,'1637381705'),(42,48,'16005',10,'1637381705'),(43,34,'13403',525,'1637381705'),(44,27,'14201',10,'1637381705'),(45,90,'16008',10,'1637381706'),(46,84,'15200',0,'1637381706'),(47,43,'13704',5,'1637381706'),(48,85,'15201',0,'1637381707'),(49,29,'14203',5,'1637381707'),(50,32,'13401',2086,'1637381707'),(51,87,'16002',0,'1637381707'),(52,28,'14202',10,'1637381708'),(53,37,'13802',10,'1637381708'),(54,30,'14204',5,'1637381708'),(55,40,'13701',11,'1637381709'),(56,36,'13801',10,'1637381709'),(57,38,'13803',5,'1637381709'),(58,39,'13804',5,'1637381761'),(59,41,'13702',10,'1637381762'),(60,25,'14103',2,'1637381762'),(61,23,'14101',4,'1637381762'),(62,26,'14104',3,'1637381762'),(63,46,'16003',10,'1637381763'),(64,42,'13703',5,'1637381763'),(65,47,'16004',10,'1637381763'),(66,24,'14102',3,'1637381764'),(67,54,'16006',0,'1637381764'),(68,33,'13402',1366,'1637381764'),(69,35,'13404',470,'1637381764'),(70,86,'16001',0,'1637381765'),(71,34,'13403',524,'1637381765'),(72,48,'16005',10,'1637381765'),(73,27,'14201',10,'1637381766'),(74,90,'16008',10,'1637381766'),(75,84,'15200',0,'1637381766'),(76,85,'15201',0,'1637381766'),(77,43,'13704',5,'1637381767'),(78,29,'14203',5,'1637381767'),(79,32,'13401',2086,'1637381767'),(80,87,'16002',0,'1637381768'),(81,28,'14202',10,'1637381768'),(82,37,'13802',10,'1637381768'),(83,30,'14204',5,'1637381769'),(84,40,'13701',11,'1637381769'),(85,36,'13801',10,'1637381769'),(86,38,'13803',5,'1637381770');
/*!40000 ALTER TABLE `game_onlinenum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issue`
--

DROP TABLE IF EXISTS `issue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '内容',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COMMENT='常见问题回答配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue`
--

LOCK TABLES `issue` WRITE;
/*!40000 ALTER TABLE `issue` DISABLE KEYS */;
/*!40000 ALTER TABLE `issue` ENABLE KEYS */;
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
  `isclose` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `score` bigint(20) unsigned DEFAULT '0',
  `customer_type` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `avatar` varchar(100) NOT NULL DEFAULT '',
  `customer_url` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(50) DEFAULT NULL COMMENT '邮箱',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_list`
--

LOCK TABLES `kefu_list` WRITE;
/*!40000 ALTER TABLE `kefu_list` DISABLE KEYS */;
INSERT INTO `kefu_list` VALUES (8,'官方客服8','','',0,0,1,'/uploads/20231121/ef3071e9a43152ad27ca02cd31642141.jpg','','jackpot.hit.game@gmail.com'),(9,'官方客服9','','',0,0,1,'/uploads/20231214/43cc8deae4e91fe8286452aeab38468c.png','','jackpot.hit.game@gmail.com');
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '1user send 2kefu send',
  PRIMARY KEY (`id`),
  KEY `kfid` (`kfid`) USING BTREE,
  KEY `uid` (`uid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kefu_msg`
--

LOCK TABLES `kefu_msg` WRITE;
/*!40000 ALTER TABLE `kefu_msg` DISABLE KEYS */;
INSERT INTO `kefu_msg` VALUES (1,1,'0001',15711,'','感谢您的联系','1673177842',2),(2,1,'0001',15711,'','1111','1673177845',2),(3,1,'0001',15711,'','你好','1673177850',2),(4,1,'0001',15711,'','你好222222222222','1673177893',2);
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
-- Table structure for table `laba_gambling_game_log`
--

DROP TABLE IF EXISTS `laba_gambling_game_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laba_gambling_game_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int(10) unsigned NOT NULL DEFAULT '0',
  `server_id` int(10) unsigned NOT NULL DEFAULT '0',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 增加 1 减少',
  `money` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laba_gambling_game_log`
--

LOCK TABLES `laba_gambling_game_log` WRITE;
/*!40000 ALTER TABLE `laba_gambling_game_log` DISABLE KEYS */;
INSERT INTO `laba_gambling_game_log` VALUES (1,147,15047,0,10.00),(2,147,15047,0,10.00),(3,147,15047,0,1.00),(4,147,15047,0,1.00),(5,270,15170,1,10000.00),(6,270,15170,1,408580.00),(7,270,15170,1,35000.00),(8,103,15003,0,100.00),(9,276,15176,1,97238.00),(10,276,15176,1,97238.00),(11,268,15168,0,5000.00),(12,268,15168,0,600000.00),(13,275,15175,0,10000000.00),(14,275,15175,0,10000000.00);
/*!40000 ALTER TABLE `laba_gambling_game_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_detail`
--

DROP TABLE IF EXISTS `language_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL DEFAULT 'en' COMMENT '编码',
  `name` varchar(64) NOT NULL DEFAULT '英语' COMMENT '语言名称',
  `remark` varchar(256) NOT NULL DEFAULT '' COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COMMENT='支持语言';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_detail`
--

LOCK TABLES `language_detail` WRITE;
/*!40000 ALTER TABLE `language_detail` DISABLE KEYS */;
INSERT INTO `language_detail` VALUES (1,'en','英语','英语'),(2,'zh','中文','中文'),(3,'pt','葡萄牙语','葡萄牙语');
/*!40000 ALTER TABLE `language_detail` ENABLE KEYS */;
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
-- Table structure for table `order_record_detail`
--

DROP TABLE IF EXISTS `order_record_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_record_detail` (
  `order_id` varchar(128) NOT NULL DEFAULT '' COMMENT '订单ID',
  `mer_order_no` varchar(128) NOT NULL DEFAULT '' COMMENT '系统提交订单号',
  `currency` varchar(32) NOT NULL DEFAULT 'BRL' COMMENT '货币类型: CNY 人民币 BRL 巴西雷亚尔',
  `channel_type` varchar(64) NOT NULL DEFAULT 'betcatpay' COMMENT '支付渠道',
  `amount` varchar(128) NOT NULL DEFAULT '0.00' COMMENT '支付金额',
  `request_detail` text COMMENT '生单参数',
  `response_detail` text NOT NULL COMMENT '生单请求回复数据',
  `pay_order_no` varchar(128) NOT NULL DEFAULT '' COMMENT '支付平台流水号',
  `pay_url` varchar(256) NOT NULL DEFAULT '' COMMENT '支付链接',
  `notify_url` varchar(128) NOT NULL DEFAULT '' COMMENT '回调通知链接',
  `call_back_nums` int(11) NOT NULL DEFAULT '0' COMMENT '回调通知次数',
  `order_status` int(11) NOT NULL DEFAULT '0' COMMENT '订单状态: 0生成订单，1支付中，2支付未通知，3支付已通知，-1交易失败，-2交易过期\n，-3交易退还，-4交易异常',
  `max_notify_num` int(11) NOT NULL DEFAULT '3' COMMENT '最大通知次数',
  `notify_status` int(11) NOT NULL DEFAULT '0' COMMENT '通知状态：0: 待通知, 1已通知',
  `msg` varchar(256) NOT NULL DEFAULT '' COMMENT '提示信息',
  `order_type` int(11) NOT NULL DEFAULT '0' COMMENT '支付类型: 0 代收，1 代付',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `uid` varchar(128) NOT NULL DEFAULT '' COMMENT '用户ID',
  `product_id` varchar(128) NOT NULL DEFAULT '' COMMENT '商品ID',
  `receipt_url` varchar(256) NOT NULL DEFAULT '' COMMENT '凭证信息',
  `payer` varchar(256) NOT NULL DEFAULT '' COMMENT '支付人信息',
  `pay_time` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `channel_order` (`mer_order_no`,`channel_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付流水';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_record_detail`
--

LOCK TABLES `order_record_detail` WRITE;
/*!40000 ALTER TABLE `order_record_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_record_detail` ENABLE KEYS */;
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '1：微信支付；2：支付宝',
  `osn` varchar(255) NOT NULL DEFAULT '',
  `osnjz` varchar(255) NOT NULL DEFAULT '',
  `createtime` char(10) NOT NULL DEFAULT '0',
  `paytime` char(10) NOT NULL DEFAULT '0',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0待付款  1已付款 2已关闭',
  `payresmsg` text,
  `prepayresmsg` text,
  `failpayresmsg` text,
  `payendtime` char(10) NOT NULL DEFAULT '0',
  `callbacknum` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `payscale` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `osn` (`osn`),
  KEY `status` (`status`) USING BTREE,
  KEY `paytime` (`paytime`) USING BTREE
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
-- Table structure for table `recharge_accumulate_log`
--

DROP TABLE IF EXISTS `recharge_accumulate_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recharge_accumulate_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(10) unsigned NOT NULL DEFAULT '0',
  `userid` int(10) unsigned NOT NULL DEFAULT '0',
  `createtime` datetime DEFAULT '2000-01-01 00:00:00',
  `recharge_money` decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '赠送规则上限值（元）',
  `total_fee` decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '充值总金额',
  `give` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '赠送金额（元）',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '类型（1充值赠送金额 2充值赠送宝箱）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='累计充值赠送记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recharge_accumulate_log`
--

LOCK TABLES `recharge_accumulate_log` WRITE;
/*!40000 ALTER TABLE `recharge_accumulate_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `recharge_accumulate_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recharge_give_log`
--

DROP TABLE IF EXISTS `recharge_give_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recharge_give_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL DEFAULT '0',
  `recharge_money` decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '充值金额（元）',
  `give` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '赠送金额（元）',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '类型（1充值赠送金额 2充值赠送宝箱）',
  `createtime` datetime NOT NULL DEFAULT '2000-01-01 00:00:00' COMMENT '创建时间',
  `deleted_at` bigint(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COMMENT='充值赠送日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recharge_give_log`
--

LOCK TABLES `recharge_give_log` WRITE;
/*!40000 ALTER TABLE `recharge_give_log` DISABLE KEYS */;
INSERT INTO `recharge_give_log` VALUES (1,19748,20.00,10.00,1,'2023-11-22 11:05:05',0),(2,19748,20.00,10.00,1,'2023-11-22 11:05:08',0),(3,19751,5.00,10.00,1,'2023-11-22 11:22:00',0),(4,19751,5.00,10.00,1,'2023-11-22 11:22:03',0),(5,19751,20.00,10.00,1,'2023-11-22 11:22:45',0),(6,19751,20.00,10.00,1,'2023-11-22 11:22:50',0),(7,20032,2.00,10.00,1,'2023-11-28 14:08:06',0),(8,20032,2.00,10.00,1,'2023-11-28 14:08:12',0),(9,20032,2.00,10.00,1,'2023-11-28 14:08:15',0);
/*!40000 ALTER TABLE `recharge_give_log` ENABLE KEYS */;
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=436 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog`
--

LOCK TABLES `rechargelog` WRITE;
/*!40000 ALTER TABLE `rechargelog` DISABLE KEYS */;
INSERT INTO `rechargelog` VALUES (159,1,15105,'1666259456',10000000,100000,10100000,1),(160,1,15118,'1666336225',99999999,100000,100099999,1),(161,1,15118,'1666336237',99999999,100000,100099999,1),(162,1,15123,'1666355436',750000,3000,753000,1),(163,1,15123,'1666357775',750000,6000,756000,1),(164,1,15123,'1666530319',1000000,8000,1008000,1),(165,15105,15106,'1666677362',1,100000,100001,1),(166,15105,15105,'1666677362',1,10100000,10099999,0),(167,15105,15106,'1666677366',1,100001,100002,1),(168,15105,15105,'1666677366',1,10099999,10099998,0),(169,15105,15106,'1666677370',1,100002,100003,1),(170,15105,15105,'1666677370',1,10099998,10099997,0),(171,15105,15106,'1666677373',1,100003,100004,1),(172,15105,15105,'1666677373',1,10099997,10099996,0),(173,15105,15106,'1666677376',1,100004,100005,1),(174,15105,15105,'1666677376',1,10099996,10099995,0),(175,15105,15106,'1666677379',1,100005,100006,1),(176,15105,15105,'1666677380',1,10099995,10099994,0),(177,15105,15106,'1666677383',1,100006,100007,1),(178,15105,15105,'1666677383',1,10099994,10099993,0),(179,15105,15106,'1666677386',1,100007,100008,1),(180,15105,15105,'1666677386',1,10099993,10099992,0),(181,15105,15106,'1666677389',1,100008,100009,1),(182,15105,15105,'1666677389',1,10099992,10099991,0),(183,15105,15106,'1666677392',1,100009,100010,1),(184,15105,15105,'1666677392',1,10099991,10099990,0),(185,15105,15106,'1666677395',1,100010,100011,1),(186,15105,15105,'1666677395',1,10099990,10099989,0),(187,1,15170,'1666855201',100000,380,100380,1),(188,1,15182,'1666896454',1,100000,100001,1),(189,1,15180,'1666896460',100,79884,79984,1),(190,15105,15105,'1667379328',100020,10099989,10200009,1),(191,15105,15106,'1667379407',100000,100011,11,0),(192,15105,15105,'1667379407',100000,10200009,10300009,1),(193,15105,15106,'1667381067',11,11,0,0),(194,15105,15105,'1667381067',11,10300009,10300020,1),(195,15105,15106,'1667381280',100,0,100,1),(196,15105,15105,'1667381280',100,10300020,10299920,0),(197,15105,15106,'1667381391',10300090,100,10300190,1),(198,1,15210,'1667406794',1000000,0,1000000,1),(199,15105,15106,'1667553956',10,10300190,10300180,0),(200,15105,15105,'1667553956',10,10299920,10299930,1),(201,15105,15106,'1667553996',10300180,10300180,0,0),(202,15105,15105,'1667553996',10300180,10299930,20600110,1),(203,15105,15109,'1667554097',10,100000,100010,1),(204,15105,15105,'1667554097',10,20600110,20600100,0),(205,15105,15109,'1667554109',10,100010,100000,0),(206,15105,15105,'1667554109',10,20600100,20600110,1),(207,15105,15106,'1667554724',10000,0,10000,1),(208,15105,15105,'1667554724',10000,20600110,20590110,0),(209,15105,15106,'1667554984',1000,10000,11000,1),(210,15105,15105,'1667554984',1000,20590110,20589110,0),(211,15105,15106,'1667564088',20,11000,11020,1),(212,15105,15105,'1667564088',20,20589110,20589090,0),(213,15105,15106,'1667564095',2000,11020,13020,1),(214,15105,15105,'1667564095',2000,20589090,20587090,0),(215,15105,15106,'1667564095',2000,13020,15020,1),(216,15105,15105,'1667564095',2000,20587090,20585090,0),(217,15105,15106,'1667564104',2000,15020,17020,1),(218,15105,15105,'1667564104',2000,20585090,20583090,0),(219,15105,15106,'1667564104',2000,17020,19020,1),(220,15105,15105,'1667564104',2000,20583090,20581090,0),(221,15105,15106,'1667564170',20,19020,19040,1),(222,15105,15105,'1667564170',20,20581090,20581070,0),(223,15105,15106,'1667564170',20,19040,19060,1),(224,15105,15105,'1667564170',20,20581070,20581050,0),(225,15105,15106,'1667564170',20,19060,19080,1),(226,15105,15105,'1667564170',20,20581050,20581030,0),(227,15105,15106,'1667564177',2000,19080,21080,1),(228,15105,15105,'1667564177',2000,20581030,20579030,0),(229,15105,15106,'1667564177',2000,21080,23080,1),(230,15105,15105,'1667564177',2000,20579030,20577030,0),(231,15105,15106,'1667564177',2000,23080,25080,1),(232,15105,15105,'1667564177',2000,20577030,20575030,0),(233,15105,15106,'1667564218',2000,25080,27080,1),(234,15105,15105,'1667564218',2000,20575030,20573030,0),(235,15105,15106,'1667564218',2000,27080,29080,1),(236,15105,15105,'1667564218',2000,20573030,20571030,0),(237,15105,15106,'1667564218',2000,29080,31080,1),(238,15105,15105,'1667564218',2000,20571030,20569030,0),(239,15105,15106,'1667564237',2000,31080,33080,1),(240,15105,15105,'1667564237',2000,20569030,20567030,0),(241,15105,15106,'1667564237',2000,33080,35080,1),(242,15105,15105,'1667564237',2000,20567030,20565030,0),(243,15105,15106,'1667564237',2000,35080,37080,1),(244,15105,15105,'1667564237',2000,20565030,20563030,0),(245,15105,15106,'1667564244',2000,37080,39080,1),(246,15105,15105,'1667564244',2000,20563030,20561030,0),(247,15105,15106,'1667564244',2000,39080,41080,1),(248,15105,15105,'1667564244',2000,20561030,20559030,0),(249,15105,15106,'1667564244',2000,41080,43080,1),(250,15105,15105,'1667564244',2000,20559030,20557030,0),(251,15105,15106,'1667564293',2000,43080,45080,1),(252,15105,15105,'1667564293',2000,20557030,20555030,0),(253,15105,15106,'1667564293',2000,45080,47080,1),(254,15105,15105,'1667564293',2000,20555030,20553030,0),(255,15105,15106,'1667564319',2000,47080,49080,1),(256,15105,15105,'1667564319',2000,20553030,20551030,0),(257,15105,15106,'1667564319',2000,49080,51080,1),(258,15105,15105,'1667564319',2000,20551030,20549030,0),(259,15105,15106,'1667564445',2000,51080,53080,1),(260,15105,15105,'1667564445',2000,20549030,20547030,0),(261,15105,15106,'1667564445',2000,53080,55080,1),(262,15105,15105,'1667564445',2000,20547030,20545030,0),(263,15105,15106,'1667564445',2000,55080,57080,1),(264,15105,15105,'1667564445',2000,20545030,20543030,0),(265,1,15318,'1668062037',10000,100000,110000,1),(266,1,15318,'1668063696',12300,100000,112300,1),(267,15105,15104,'1668064107',11111,99000,110111,1),(268,15105,15105,'1668064107',11111,20543030,20531919,0),(269,1,15249,'1668068054',2322200,36733225,39055425,1),(270,1,15249,'1668068059',2322200,36733225,39055425,1),(271,1,15318,'1668068061',11100,100000,111100,1),(272,1,15322,'1668071220',10000,0,10000,1),(273,1,15322,'1668071276',10000,0,10000,1),(274,1,15324,'1668071354',10000,100000,110000,1),(275,1,15324,'1668071382',100000,100000,200000,1),(276,1,15324,'1668071408',500000,100000,600000,1),(277,1,15324,'1668071834',5000000,69995,5069995,1),(278,1,15249,'1668077660',456600,4622295,5078895,1),(279,1,15321,'1668089335',100000,100000,200000,1),(280,1,15302,'1668089486',100000,100000,200000,1),(281,1,15320,'1668089623',10000,510,10510,1),(282,1,15320,'1668089692',1000000,10510,1010510,1),(283,1,15320,'1668091202',1965,10196572,10194607,0),(284,1,15320,'1668091217',196500,10196572,10000072,0),(285,1,15320,'1668091252',196500,10196572,10000072,0),(286,1,15320,'1668091306',801600,9801607,9000007,0),(287,1,15320,'1668091401',5000,9000007,8995007,0),(288,1,15320,'1668091463',500000,8995007,8495007,0),(289,1,15320,'1668091490',495000,8495007,8000007,0),(290,1,15320,'1668091527',1000000,8000007,7000007,0),(291,1,15320,'1668091629',1000000,7000007,6000007,0),(292,1,15320,'1668092371',3000000,0,993007,1),(293,1,15320,'1668092403',100000,0,0,1),(294,1,15320,'1668092411',1000000,0,0,0),(295,15105,15106,'1668092833',1,57080,57079,0),(296,15105,15105,'1668092833',1,20531919,20531920,1),(297,15105,15106,'1668092840',1111,57079,55968,0),(298,15105,15105,'1668092840',1111,20531920,20533031,1),(299,15105,15106,'1668092847',111,55968,56079,1),(300,15105,15105,'1668092847',111,20533031,20532920,0),(301,15105,15105,'1668093176',100000,20532920,20632920,1),(302,15105,15105,'1668093185',100000,20632920,20732920,1),(303,15105,15105,'1668093203',100000,20732920,20832920,1),(304,15105,15328,'1668093972',1000,0,0,1),(305,15105,15105,'1668093972',1000,20832920,20831920,0),(306,15105,15106,'1668094037',10000,56079,46079,0),(307,15105,15105,'1668094037',10000,20831920,20841920,1),(308,15105,15106,'1668094120',60,46079,46019,0),(309,15105,15105,'1668094120',60,20841920,20841980,1),(310,15105,15106,'1668094125',60,46019,45959,0),(311,15105,15105,'1668094125',60,20841980,20842040,1),(312,15105,15106,'1668094132',60000,45959,105959,1),(313,15105,15105,'1668094132',60000,20842040,20782040,0),(314,15105,15328,'1668094177',1000000,0,792500,1),(315,15105,15105,'1668094177',1000000,20782040,19782040,0),(316,1,15331,'1668104103',1,100000,100001,1),(317,1,15331,'1668104155',100001,100001,0,0),(318,1,15331,'1668104162',100001,0,100001,1),(319,1,15331,'1668104170',100002,100001,200003,1),(320,1,15331,'1668104263',1533122222222,200003,1533122422225,1),(321,1,15331,'1668149362',153310000000,2147683650,155457683650,1),(322,1,15331,'1668149479',10000000000000,4295167297,10004295167297,1),(323,1,15331,'1668149624',1111,4295167297,4295168408,1),(324,1,15249,'1668259915',344400,24311134,24655534,1),(325,1,15249,'1668259921',2322200,24655534,26977734,1),(326,1,15348,'1668264914',100000,0,100000,1),(327,1,15361,'1668401126',99500,99600,100,0),(328,1,15361,'1668401134',199999,100,200099,1),(329,1,15348,'1668411291',45400,12290,57690,1),(330,1,15299,'1669739032',10000,0,10000,1),(331,1,15299,'1669739084',1000000,10000,1010000,1),(332,1,15469,'1670004262',10000,100000,110000,1),(333,1,15137,'1670221411',10000,18341,28341,1),(334,1,15137,'1670221437',10000000,28341,10028341,1),(335,1,15542,'1670590403',9999999,321480,10321479,1),(336,1,15542,'1670591636',1111111,10321479,11432590,1),(337,1,15581,'1671023116',50000,100000,150000,1),(338,1,15581,'1671023245',50000,150000,200000,1),(339,1,15581,'1671023318',5000000,200000,5200000,1),(340,1,15347,'1671702714',9000000000,100000,9000100000,1),(341,1,15650,'1671703212',1000000000,100000,1000100000,1),(342,1,15668,'1672331866',1000000,0,1000000,1),(343,1,15687,'1672826987',12304000,100000,12404000,1),(344,1,15687,'1672827484',10550000,12404000,22954000,1),(345,1,15687,'1672827637',12314500,22954000,35268500,1),(346,1,15687,'1672827693',100000000,35268500,135268500,1),(347,1,15687,'1672827715',300000000,135268500,435268500,1),(348,1,15760,'1673718630',99999999999,562,100000000561,1),(349,1,15161,'1674290592',100000,108625,208625,1),(350,1,15654,'1675503515',2000,610,2610,1),(351,1,15420,'1675506422',1000,100000,101000,1),(352,1,15950,'1676031381',100000,93560,193560,1),(353,1,15950,'1676031382',100000,193560,293560,1),(354,1,15950,'1676031452',99999999,293560,100293559,1),(355,1,16121,'1677809934',100,100000,100100,1),(356,1,16260,'1678973760',1000,100000,101000,1),(357,1,16260,'1678973776',10100,101000,90900,0),(358,1,16223,'1679031053',100000,0,100000,1),(359,1,16274,'1679134483',1000000000,1427,1000001427,1),(360,1,16320,'1679565356',30000000,103400,30103400,1),(361,1,16320,'1679565612',5000000,30103400,35103400,1),(362,1,16360,'1679991984',1000000,100000,1100000,1),(363,1,16405,'1680332250',1000,101218,102218,1),(364,1,16405,'1680332275',5000,102218,107218,1),(365,1,16405,'1680332294',8000000,107218,8107218,1),(366,1,16421,'1681921010',1000000000,952,1000000952,1),(367,1,16531,'1682069560',5,100000,99995,0),(368,1,16531,'1682069653',5,99995,99990,0),(369,1,16622,'1682094468',10000000,100000,10100000,1),(370,1,16684,'1683178554',11890,111890,100000,0),(371,1,16717,'1683527803',1000000,0,1000000,1),(372,1,16792,'1683831194',100000,0,100000,1),(373,1,16792,'1683831564',10000,76586,86586,1),(374,1,16792,'1683832127',1000,286,1286,1),(375,1,16792,'1683832145',100000,1286,101286,1),(376,1,16792,'1683832255',1000000,101286,1101286,1),(377,1,16792,'1683834361',100000000,663777,100663777,1),(378,1,16792,'1683834394',600000000,100663777,700663777,1),(379,1,16888,'1684561931',1000000,0,1000000,1),(380,1,16892,'1684580520',10000000,436,10000436,1),(381,1,16878,'1684861079',10000000,240,10000240,1),(382,1,16957,'1685171603',1000000,994,1000994,1),(383,1,17117,'1686194760',9999999,100000,10099999,1),(384,1,17117,'1686196073',9999999,8579392,18579391,1),(385,1,17193,'1687454368',185640,19563998,19378358,0),(386,1,17193,'1687454381',193784,19378359,19184575,0),(387,1,17193,'1687454394',19184576,19184576,0,0),(388,1,17193,'1687454399',100000,0,100000,1),(389,1,17193,'1687508727',1000000,0,1000000,1),(390,1,17261,'1687879612',1000000000,0,1000000000,1),(391,1,17431,'1689044883',999999999,100000,1000099999,1),(392,1,17432,'1689045405',99999,100000,199999,1),(393,1,17788,'1690882829',100,0,100,1),(394,1,17807,'1690966407',100000,99500,199500,1),(395,1,17807,'1690967180',10000000,1500,10001500,1),(396,1,17868,'1691402687',80000,308,80308,1),(397,1,17942,'1691775598',900000,59994,959994,1),(398,1,18179,'1692961050',1000000000,100000,1000100000,1),(399,1,18238,'1693199798',99999999,100000,100099999,1),(400,1,18466,'1694184207',1000,99846,100846,1),(401,1,18466,'1694184231',1000000,100846,1100846,1),(402,1,18466,'1694184575',10000000000,846,10000000846,1),(403,1,18617,'1694869543',10000000,70,10000070,1),(404,1,18626,'1694957804',99999999,100000,100099999,1),(405,1,15113,'1696246744',100000,0,100000,1),(406,15106,18771,'1696251071',60000,100000,160000,1),(407,15106,15106,'1696251071',60000,100100,40100,0),(408,15106,18771,'1696251357',160000,160000,0,0),(409,15106,15106,'1696251357',160000,40100,200100,1),(410,1,18508,'1696258204',140000,99900,239900,1),(411,1,15106,'1696259103',1000000,0,1000000,1),(412,15106,18771,'1696259301',100000,10,100010,1),(413,15106,15106,'1696259301',100000,1000010,900010,0),(414,1,18771,'1696266897',10000000,3802233,13802233,1),(415,1,18771,'1696266932',1566666,13802233,15368899,1),(416,1,18771,'1696266990',1600000,15368899,13768899,0),(417,1,18835,'1696668360',100000000,100750,100100750,1),(418,1,18838,'1696843664',999999999,99798,1000099797,1),(419,1,18955,'1697701632',1000000000,0,1000000000,1),(420,1,20032,'1701152133',200,304000,304200,1),(421,1,20032,'1701152141',200,304200,304400,1),(422,1,20032,'1701152790',10000,304400,314400,1),(423,1,20054,'1701255825',90000,100000,190000,1),(424,1,20054,'1701255872',900000,190000,1090000,1),(425,1,20055,'1701256214',999999999,100000,1000099999,1),(426,1,18838,'1701331856',999999999,2339,1000002338,1),(427,1,20072,'1701333025',9999999999,100000,10000099999,1),(428,1,20100,'1701486952',10000,100000,110000,1),(429,1,20100,'1701486987',90000,110000,200000,1),(430,1,20100,'1701488034',200000,200,200200,1),(431,1,20102,'1702197829',10000000,50,10000050,1),(432,1,20102,'1702197873',122222222222,10000050,122232222272,1),(433,16110,20774,'1703507282',100000,100000,0,0),(434,16110,16110,'1703507283',100000,143343,243343,1),(435,18773,20947,'1704795429',10,110000,110010,1);
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rechargelog_kefu`
--

LOCK TABLES `rechargelog_kefu` WRITE;
/*!40000 ALTER TABLE `rechargelog_kefu` DISABLE KEYS */;
INSERT INTO `rechargelog_kefu` VALUES (1,18773,1,'1704536196',11111,100001934,100013045,1),(2,18773,1,'1704536211',111111,100013045,100124156,1),(3,18773,1,'1704799284',1,100124156,100124157,1),(4,18773,1,'1704799299',1,100124157,100124158,1);
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
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
  `type` tinyint(3) unsigned DEFAULT '0' COMMENT '0 -  1 +',
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
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '0 -  1 +',
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
-- Table structure for table `system_auth`
--

DROP TABLE IF EXISTS `system_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_auth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT '' COMMENT '权限名称',
  `utype` varchar(50) DEFAULT '' COMMENT '身份权限',
  `desc` varchar(500) DEFAULT '' COMMENT '备注说明',
  `sort` int(11) DEFAULT '0' COMMENT '排序权重',
  `status` int(11) DEFAULT '1' COMMENT '权限状态(1使用,0禁用)',
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_system_auth_status` (`status`),
  KEY `idx_system_auth_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统-权限';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_auth`
--

LOCK TABLES `system_auth` WRITE;
/*!40000 ALTER TABLE `system_auth` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_auth_node`
--

DROP TABLE IF EXISTS `system_auth_node`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_auth_node` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `auth` int(11) DEFAULT '0' COMMENT '角色',
  `node` varchar(200) DEFAULT '' COMMENT '节点',
  PRIMARY KEY (`id`),
  KEY `idx_system_auth_node_auth` (`auth`),
  KEY `idx_system_auth_node_node` (`node`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统-授权';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_auth_node`
--

LOCK TABLES `system_auth_node` WRITE;
/*!40000 ALTER TABLE `system_auth_node` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_auth_node` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_menu`
--

DROP TABLE IF EXISTS `system_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pid` int(11) DEFAULT '0' COMMENT '上级ID',
  `title` varchar(100) DEFAULT '' COMMENT '菜单名称',
  `icon` varchar(100) DEFAULT '' COMMENT '菜单图标',
  `node` varchar(100) DEFAULT '' COMMENT '节点代码',
  `url` varchar(400) DEFAULT '' COMMENT '链接节点',
  `params` varchar(500) DEFAULT '' COMMENT '链接参数',
  `target` varchar(20) DEFAULT '_self' COMMENT '打开方式',
  `sort` int(11) DEFAULT '0' COMMENT '排序权重',
  `status` int(11) DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否菜单（1=菜单  0=按钮）',
  `deleted_at` bigint(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_system_menu_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统-菜单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_menu`
--

LOCK TABLES `system_menu` WRITE;
/*!40000 ALTER TABLE `system_menu` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_recharge_gift`
--

DROP TABLE IF EXISTS `system_recharge_gift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_recharge_gift` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recharge_money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '充值金额',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '类型（1充值直接赠送 2充值累计值多少才赠送）',
  `gift_money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '赠送金额',
  `create_at` datetime DEFAULT NULL COMMENT '创建时间',
  `update_at` datetime DEFAULT NULL COMMENT '更新时间',
  `delete_at` bigint(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_system_data_name` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COMMENT='系统-充值-赠送配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_recharge_gift`
--

LOCK TABLES `system_recharge_gift` WRITE;
/*!40000 ALTER TABLE `system_recharge_gift` DISABLE KEYS */;
INSERT INTO `system_recharge_gift` VALUES (1,30.00,1,10.00,'2023-10-08 13:23:41',NULL,1698832586),(2,50.00,1,10.00,'2023-10-08 13:24:03',NULL,1698832608),(3,100.00,1,10.00,'2023-10-08 13:24:13',NULL,1698832610),(4,200.00,1,10.00,'2023-10-08 13:24:21',NULL,1698832612),(5,500.00,1,10.00,'2023-10-08 13:25:03',NULL,1698832614),(6,1000.00,1,10.00,'2023-10-08 13:25:11',NULL,1698832637),(7,2000.00,1,10.00,'2023-10-08 13:25:18',NULL,1698832636),(8,3000.00,1,10.00,'2023-10-08 13:25:52',NULL,1696742768),(9,300.00,1,10.00,'2023-10-08 13:26:16',NULL,1698832634),(10,3000.00,1,1000.00,'2023-11-01 17:56:05',NULL,1698832633),(11,30.00,1,10.00,'2023-11-01 17:58:35',NULL,1698832739),(12,30000.00,1,1000.00,'2023-11-01 17:59:12',NULL,1698832775),(13,30000.00,1,10000.00,'2023-11-01 17:59:46',NULL,1698832802),(14,30.00,1,10.00,'2023-11-01 18:00:24',NULL,0),(15,20.00,1,5.00,'2023-11-29 16:59:25',NULL,0),(16,3.00,1,2.00,'2023-12-10 16:39:29',NULL,0),(17,100.00,2,2.00,'2024-01-06 18:20:09',NULL,0),(18,100.00,1,10.00,'2024-01-09 19:50:37',NULL,1704801146);
/*!40000 ALTER TABLE `system_recharge_gift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_treasure_box`
--

DROP TABLE IF EXISTS `system_treasure_box`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_treasure_box` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recharge_money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '充值金额',
  `box_money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '宝箱面额',
  `create_at` datetime DEFAULT NULL COMMENT '创建时间',
  `update_at` datetime DEFAULT NULL COMMENT '更新时间',
  `delete_at` bigint(20) NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COMMENT='系统-充值-宝箱自定义配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_treasure_box`
--

LOCK TABLES `system_treasure_box` WRITE;
/*!40000 ALTER TABLE `system_treasure_box` DISABLE KEYS */;
INSERT INTO `system_treasure_box` VALUES (1,50.00,10.00,'2023-12-14 23:23:03',NULL,0),(2,1000.00,100.00,'2024-01-09 19:52:50',NULL,0);
/*!40000 ALTER TABLE `system_treasure_box` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `aid` (`aid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8 COMMENT='uid与aid关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uidglaid`
--

LOCK TABLES `uidglaid` WRITE;
/*!40000 ALTER TABLE `uidglaid` DISABLE KEYS */;
INSERT INTO `uidglaid` VALUES (1,16116,16110,'1677759977'),(2,16117,16110,'1677760474'),(3,16372,16110,'1680085338'),(4,16452,15099,'1680752248'),(5,16456,15099,'1680753748'),(6,16598,16589,'1681960912'),(7,16795,16792,'1683830049'),(8,17036,16110,'1685520322'),(9,17058,16110,'1685689978'),(10,17060,17058,'1685690767'),(11,17061,17060,'1685690835'),(12,17062,17061,'1685690989'),(13,17063,17062,'1685691030'),(14,17391,17305,'1688797981'),(15,18626,16110,'1694957715'),(16,18658,18656,'1695185521'),(17,18659,18656,'1695185739'),(18,18901,18191,'1697004386'),(19,18976,18925,'1697985931'),(20,19080,18191,'1698799088'),(21,19153,19131,'1698978600'),(22,19197,18191,'1699022401'),(23,20597,20333,'1703253132'),(24,20598,20333,'1703253260'),(25,20599,20333,'1703253397'),(26,20774,16110,'1703506311'),(27,20775,16110,'1703507774');
/*!40000 ALTER TABLE `uidglaid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
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
  `fromtype` tinyint(3) unsigned DEFAULT '1' COMMENT '1-5',
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
-- Table structure for table `user_exchange`
--

DROP TABLE IF EXISTS `user_exchange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_exchange` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(60) DEFAULT NULL COMMENT '订单号',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `bank_number` varchar(100) DEFAULT NULL COMMENT '银行卡号',
  `real_name` varchar(10) DEFAULT NULL COMMENT '真实名称',
  `bank_open` varchar(255) DEFAULT NULL COMMENT '银行开户行',
  `money` decimal(10,2) DEFAULT NULL COMMENT '金额',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态 0 待审核 1 已通过 2 已拒绝',
  `created_uid` int(11) DEFAULT NULL COMMENT '操作人',
  `created_at` datetime DEFAULT NULL COMMENT '添加时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`) USING BTREE,
  KEY `created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8 COMMENT='用户兑换表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_exchange`
--

LOCK TABLES `user_exchange` WRITE;
/*!40000 ALTER TABLE `user_exchange` DISABLE KEYS */;
INSERT INTO `user_exchange` VALUES (1,'2022111014185816680611384924',10011261,'11222333','11112','123456',111100.00,0,NULL,'2022-11-10 14:18:58',NULL),(2,'2022111014185916680611396260',10011261,'11222333','11112','123456',111100.00,0,NULL,'2022-11-10 14:18:59',NULL),(3,'2022111014192216680611626773',10011261,'11222333','11112','123456',111100.00,0,NULL,'2022-11-10 14:19:22',NULL),(4,'2022111014193616680611768025',10011261,'11222333','11112','123456',111100.00,0,NULL,'2022-11-10 14:19:36',NULL),(5,'2022111014201216680612127850',10011261,'11222333','11112','123456',111100.00,0,NULL,'2022-11-10 14:20:12',NULL),(6,'2022111014264816680616083504',15318,'sadasda','111122','111111',10000.00,2,1,'2022-11-10 14:26:48','2022-11-10 14:33:57'),(7,'2022111014351216680621126680',15318,'sadasda','111122','111111',30000.00,1,1,'2022-11-10 14:35:12','2022-11-10 14:36:12'),(8,'2022111014583116680635115474',15318,'sadasda','111122','111111',30000.00,0,NULL,'2022-11-10 14:58:31',NULL),(9,'2022111015011316680636737074',15318,'sadasda','111122','111111',12300.00,2,1,'2022-11-10 15:01:13','2022-11-10 15:01:36'),(10,'2022111015324816680655683610',15318,'sadasda','111122','111111',11100.00,2,1,'2022-11-10 15:32:48','2022-11-10 16:14:21'),(11,'2022111016123616680679562676',15249,'1111','123','2233',2322200.00,2,1,'2022-11-10 16:12:36','2022-11-12 21:32:01'),(12,'2022111016123616680679562692',15249,'1111','123','2233',2322200.00,2,1,'2022-11-10 16:12:36','2022-11-10 16:14:19'),(13,'2022111016123916680679596474',15249,'1111','123','2233',2322200.00,0,NULL,'2022-11-10 16:12:39',NULL),(14,'2022111016124216680679623133',15249,'1111','123','2233',2322200.00,2,1,'2022-11-10 16:12:42','2022-11-10 16:14:14'),(15,'2022111016124716680679672824',15249,'1111','123','2233',2322200.00,1,1,'2022-11-10 16:12:47','2022-11-10 16:13:18'),(16,'2022111016435616680698361830',15249,'1111','123','2233',344400.00,2,1,'2022-11-10 16:43:56','2022-11-12 21:31:55'),(17,'2022111016450316680699036019',15249,'1111','123','2233',22222200.00,0,NULL,'2022-11-10 16:45:03',NULL),(18,'2022111017465116680736112985',15249,'1111','123','2233',2344500.00,0,NULL,'2022-11-10 17:46:51',NULL),(19,'2022111017472516680736451865',15249,'1111','123','2233',234400.00,0,NULL,'2022-11-10 17:47:25',NULL),(20,'2022111018521616680775362589',15249,'1111','123','2233',3444400.00,0,NULL,'2022-11-10 18:52:16',NULL),(21,'2022111018533316680776133220',15249,'1111','123','2233',456600.00,0,NULL,'2022-11-10 18:53:33',NULL),(22,'2022111018533816680776185867',15249,'1111','123','2233',456600.00,2,1,'2022-11-10 18:53:38','2022-11-10 18:54:20'),(23,'2022111222531116682647915373',15249,'1111','123','2233',445500.00,0,NULL,'2022-11-12 22:53:11',NULL),(24,'2022111222542116682648611227',15348,'2','3','2',100000.00,2,1,'2022-11-12 22:54:21','2022-11-12 22:55:14'),(25,'2022111223054516682655452134',15331,'2','2','2',99999999.99,1,1,'2022-11-12 23:05:45','2022-11-12 23:07:03'),(26,'2022111223055816682655582603',15331,'2','2','2',99999999.99,1,1,'2022-11-12 23:05:58','2022-11-12 23:07:01'),(27,'2022111223062916682655895558',15331,'2','2','2',99999999.99,1,1,'2022-11-12 23:06:29','2022-11-12 23:06:59'),(28,'2022111223063916682655998720',15331,'2','2','2',99999999.99,1,1,'2022-11-12 23:06:39','2022-11-12 23:06:54'),(29,'2022111413233916684034198451',15348,'2','3','2',45400.00,0,NULL,'2022-11-14 13:23:39',NULL),(30,'2022111413234016684034204007',15348,'2','3','2',45400.00,2,1,'2022-11-14 13:23:40','2022-11-14 15:34:51'),(31,'2022112000192716688747672059',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:19:27',NULL),(32,'2022112000193016688747702192',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:19:30',NULL),(33,'2022112000193516688747758880',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:19:35',NULL),(34,'2022112000193916688747799243',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:19:39',NULL),(35,'2022112000210716688748674866',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:07',NULL),(36,'2022112000210716688748675211',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:07',NULL),(37,'2022112000210816688748687382',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:08',NULL),(38,'2022112000210916688748694665',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:09',NULL),(39,'2022112000211016688748702587',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:10',NULL),(40,'2022112000211916688748798468',15084,'1','1','1',10000.00,0,NULL,'2022-11-20 00:21:19',NULL),(41,'2022112000232116688750019733',15429,'1','1','1',20000.00,0,NULL,'2022-11-20 00:23:21',NULL),(42,'2022112000261316688751733402',15429,'1','1','1',20000.00,1,1,'2022-11-20 00:26:13','2023-01-09 11:58:27'),(43,'2022122819002416722252249918',15668,'1','1','1',100000.00,1,1,'2022-12-28 19:00:24','2023-01-06 18:32:31'),(44,'2023020417381616755034968799',15654,'2','4','3',2000.00,2,1,'2023-02-04 17:38:16','2023-02-04 17:38:35'),(45,'2023020418061316755051734303',15654,'2','4','3',1000.00,0,NULL,'2023-02-04 18:06:13',NULL),(46,'2023020418074316755052639711',15654,'2','4','3',200.00,0,NULL,'2023-02-04 18:07:43',NULL),(47,'2023020616134616756712261574',15451,'1','1','1',10000.00,0,NULL,'2023-02-06 16:13:46',NULL),(48,'2023020616365116756726117721',15451,'1','1','1',32300.00,0,NULL,'2023-02-06 16:36:51',NULL),(49,'2023022302341416770908546576',15232,'111','111','111',99999999.99,0,NULL,'2023-02-23 02:34:14',NULL),(50,'2023022323501716771674178459',15299,'231123132123','2311231321','2147483647',666600.00,0,NULL,'2023-02-23 23:50:17',NULL),(51,'2023022323502016771674205925',15299,'231123132123','2311231321','2147483647',666600.00,0,NULL,'2023-02-23 23:50:20',NULL),(52,'2023022407453616771959366895',15299,'231123132123','2311231321','2147483647',33232300.00,0,NULL,'2023-02-24 07:45:36',NULL),(53,'2023040213021016804117308762',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-02 13:02:10',NULL),(54,'2023040300234816804526282171',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-03 00:23:48',NULL),(55,'2023040300235016804526305055',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-03 00:23:50',NULL),(56,'2023040300500616804542066326',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-03 00:50:06',NULL),(57,'2023040316345716805108975721',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-03 16:34:57',NULL),(58,'2023040316351316805109135936',15001,'456456','46+465+','465',50000.00,0,NULL,'2023-04-03 16:35:13',NULL),(59,'2023041018471116811236318253',15057,'123','123','123',11100.00,0,NULL,'2023-04-10 18:47:11',NULL),(60,'2023042200023416820929549497',16510,'1','1','1',11100.00,0,NULL,'2023-04-22 00:02:34',NULL),(61,'2023042213484916821425296108',16510,'1','1','1',11100.00,0,NULL,'2023-04-22 13:48:49',NULL),(62,'2023052310530116848103817745',16878,'1','1','1',100000.00,0,NULL,'2023-05-23 10:53:01',NULL),(63,'2023092718283616958105163279',16140,'123','123','12312',1000.00,0,NULL,'2023-09-27 18:28:36',NULL),(64,'2023092718284916958105296462',16140,'123','123','12312',10000.00,0,NULL,'2023-09-27 18:28:49',NULL),(65,'2023092718324316958107635320',16140,'123','123','12312',200000.00,1,1,'2023-09-27 18:32:43','2023-10-02 20:30:55'),(66,'2023092723214116958281019781',16140,'123','123','12312',1000000.00,1,1,'2023-09-27 23:21:41','2023-10-02 20:30:51'),(67,'2023100500005016964352507692',18802,'1212','1212','121',100000.00,0,NULL,'2023-10-05 00:00:50',NULL),(68,'2023102321080716980664875266',16185,'sdfsdf','123123123','2213423',12300.00,0,NULL,'2023-10-23 21:08:07',NULL),(69,'2023102321103816980666386947',16185,'sdfsdf','123123123','2213423',15000.00,0,NULL,'2023-10-23 21:10:38',NULL);
/*!40000 ALTER TABLE `user_exchange` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'ym_manage'
--
/*!50003 DROP PROCEDURE IF EXISTS `InviteDetail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `InviteDetail`(_userId INT)
begin

	

    SET @totalRebate = 0;

    SET @todayRebate = 0;

    SET @yestRebate = 0;

    SET @totalNum = 0;

    SET @todayNum = 0;

    SET @yestNum = 0;

    SET @waitGetRebate = 0;

	

	select COALESCE(sum(rebate_glod), 0) into @totalRebate  from ym_manage.agent_rebate ar where ar.status = 1 and ar.invite_uid = _userId group by ar.invite_uid; 

	select COALESCE(sum(rebate_glod), 0) into @todayRebate  from ym_manage.agent_rebate ar where ar.invite_uid = _userId and  DATE(ar.created_at) = CURDATE() group by ar.invite_uid;

	select COALESCE(sum(rebate_glod), 0) into @yestRebate  from ym_manage.agent_rebate ar where ar.invite_uid = _userId and  DATE(ar.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) group by ar.invite_uid;

	select COALESCE(sum(`number`), 0) into @totalNum from ym_manage.account_invite_sends ais where ais.uid = _userId group by ais.uid;

	select COALESCE(sum(`number`), 0) into @todayNum from ym_manage.account_invite_sends ais where ais.uid = _userId and  DATE(ais.created_at) = CURDATE() group by ais.uid;

	select COALESCE(sum(`number`), 0) into @yestNum from ym_manage.account_invite_sends ais where ais.uid = _userId and DATE(ais.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) group by ais.uid;

	select COALESCE(sum(rebate_glod), 0) into @waitGetRebate  from ym_manage.agent_rebate ar where ar.status = 0 and ar.invite_uid = _userId group by ar.invite_uid; 



   select @totalRebate as totalRebate, @todayRebate as todayRebate, @yestRebate as yestRebate, @totalNum as totalNum, @todayNum as todayNum, @yestNum as yestNum, @waitGetRebate as waitGetRebate;

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

-- Dump completed on 2024-04-15 11:06:17
