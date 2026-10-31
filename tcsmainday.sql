/*
 Navicat Premium Dump SQL

 Source Server         : TCS-TIDB
 Source Server Type    : TiDB
 Source Server Version : 80011 (8.0.11-TiDB-v8.5.3-serverless)
 Source Host           : gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000
 Source Schema         : tcsmainday

 Target Server Type    : TiDB
 Target Server Version : 80011 (8.0.11-TiDB-v8.5.3-serverless)
 File Encoding         : 65001

 Date: 31/10/2026 19:15:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for agent_runs
-- ----------------------------
DROP TABLE IF EXISTS `agent_runs`;
CREATE TABLE `agent_runs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NULL DEFAULT NULL,
  `run_type` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `input_summary` json NULL,
  `final_summary` json NULL,
  `started_at` datetime(3) NOT NULL,
  `completed_at` datetime(3) NULL DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_runs_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_runs_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of agent_runs
-- ----------------------------
INSERT INTO `agent_runs` VALUES (3, 1, 'investigation', 'completed', '{\"anomaly_score\": 14.26, \"signal_id\": \"SIG-UPI-DROP-01\", \"trigger\": \"PlayStore + Telemetry Anomaly\"}', '{\"action_plan\": \"Rollback feature flag, dispatch refund batch, and credit ₹200 apology vouchers.\", \"root_cause\": \"Android v2.3 release socket timeout mismatch (8s vs 9.4s backend p99)\"}', '2026-10-31 06:18:18.000', '2026-10-31 07:18:18.000', NULL);

-- ----------------------------
-- Table structure for agent_steps
-- ----------------------------
DROP TABLE IF EXISTS `agent_steps`;
CREATE TABLE `agent_steps`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_run_id` bigint NOT NULL,
  `step_number` int NOT NULL,
  `agent_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tool_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `input_summary` json NULL,
  `output_summary` json NULL,
  `evidence_references` json NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `duration_ms` int NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_step`(`agent_run_id` ASC, `step_number` ASC) USING BTREE,
  CONSTRAINT `fk_steps_run` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of agent_steps
-- ----------------------------
INSERT INTO `agent_steps` VALUES (6, 3, 1, 'SignalDetectionAgent', 'anomaly_detector', '{\"metric\": \"upi_intent_drop_rate\"}', '{\"anomaly_detected\": true, \"z_score\": 3.45}', '[\"SIG-UPI-DROP-01\"]', 'completed', 450, '2026-10-31 09:18:18.994');
INSERT INTO `agent_steps` VALUES (7, 3, 2, 'ComplaintCorrelationAgent', 'nlp_semantic_clusterer', '{\"feedback_count\": 156}', '{\"confidence\": 0.96, \"dominant_cluster\": \"ERR_UPI_TIMEOUT_NO_ORDER_REC\"}', '[\"REV-9821\", \"TICK-9820\"]', 'completed', 820, '2026-10-31 09:18:18.994');
INSERT INTO `agent_steps` VALUES (8, 3, 3, 'RootCauseCourtAgent', 'bayesian_hypothesis_evaluator', '{\"candidate_hypotheses\": 3}', '{\"refuted\": [\"HYP-02\", \"HYP-03\"], \"verdict\": \"HYP-01 Confirmed (94.2% posterior confidence)\"}', '[\"T-01\", \"T-02\", \"T-03\"]', 'completed', 1450, '2026-10-31 09:18:18.994');
INSERT INTO `agent_steps` VALUES (9, 3, 4, 'ImpactQuantificationAgent', 'financial_exposure_calculator', '{\"customers\": 156}', '{\"risk_tier\": \"high_value_customers\", \"stranded_loss\": 482000}', '[\"CUST-1001\", \"CUST-1002\"]', 'completed', 610, '2026-10-31 09:18:18.994');
INSERT INTO `agent_steps` VALUES (10, 3, 5, 'RecoverySynthesizerAgent', 'action_policy_optimizer', '{\"constraints\": [\"zero_double_charge\", \"human_in_the_loop\"]}', '{\"highest_priority\": \"disable_feature_flag\", \"recommendations\": 3}', '[\"REC-01\", \"REC-02\", \"REC-03\"]', 'completed', 980, '2026-10-31 09:18:18.994');

-- ----------------------------
-- Table structure for approvals
-- ----------------------------
DROP TABLE IF EXISTS `approvals`;
CREATE TABLE `approvals`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `recommendation_id` bigint NOT NULL,
  `requested_by` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `reviewed_by` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `decision` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'pending',
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `reviewed_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_approval_rec`(`recommendation_id` ASC) USING BTREE,
  INDEX `idx_approvals_decision`(`decision` ASC) USING BTREE,
  INDEX `fk_approvals_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_approvals_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_approvals_rec` FOREIGN KEY (`recommendation_id`) REFERENCES `recovery_recommendations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of approvals
-- ----------------------------
INSERT INTO `approvals` VALUES (30005, 1, 30006, 'investigator-agent', NULL, 'pending', 'Immediate drop in intent callback drops (<1%) within 60 seconds.', NULL, '2026-10-31 08:44:50.000');
INSERT INTO `approvals` VALUES (30006, 1, 30007, 'investigator-agent', NULL, 'pending', 'Reconcile 156 stranded debits with partner bank and auto-generate confirmed orders without charging again.', NULL, '2026-10-31 08:44:50.000');
INSERT INTO `approvals` VALUES (30007, 1, 30008, 'investigator-agent', NULL, 'pending', 'Prevent churn and rebuild trust by issuing instant ₹200 credits to all 156 impacted users.', NULL, '2026-10-31 08:44:51.000');
INSERT INTO `approvals` VALUES (30008, 30002, 30009, 'investigator-agent', NULL, 'pending', 'Calibrate consumer expectations during rain storm; drop customer cancellation rate by 60%.', NULL, '2026-10-31 08:44:51.000');

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `actor_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `resource_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `resource_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `details` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_audit_resource`(`resource_type` ASC, `resource_id` ASC) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of audit_logs
-- ----------------------------

-- ----------------------------
-- Table structure for customer_messages
-- ----------------------------
DROP TABLE IF EXISTS `customer_messages`;
CREATE TABLE `customer_messages`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `order_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_ref` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `reconcile_state` varchar(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `generator` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'draft',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sent_at` datetime(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_message`(`incident_id` ASC, `order_id` ASC) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of customer_messages
-- ----------------------------

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `external_customer_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `email` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `city` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `customer_segment` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `platform` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `device_os` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `app_version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `first_order_at` datetime(3) NULL DEFAULT NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_customers_external`(`external_customer_id` ASC) USING BTREE,
  INDEX `idx_customers_device`(`platform` ASC, `device_os` ASC, `app_version` ASC) USING BTREE,
  INDEX `idx_customers_city`(`city` ASC) USING BTREE
) AUTO_INCREMENT = 60046 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of customers
-- ----------------------------
INSERT INTO `customers` VALUES (1, 'CUST-1001', 'Aarav Mehta', 'aarav@example.com', '+919876543210', 'Bengaluru', 'high_value', 'android', 'Android 14', '2.3', '2026-08-10 10:00:00.000', 1, '2026-10-31 07:58:08.446');
INSERT INTO `customers` VALUES (2, 'CUST-1002', 'Priya Sharma', 'priya@example.com', '+919876543211', 'Mumbai', 'metro', 'android', 'Android 14', '2.3', '2026-07-15 11:30:00.000', 1, '2026-10-31 07:58:08.446');
INSERT INTO `customers` VALUES (3, 'CUST-1003', 'Rohan Verma', 'rohan@example.com', '+919876543212', 'Delhi', 'regular', 'android', 'Android 14', '2.3', '2026-09-01 14:20:00.000', 1, '2026-10-31 07:58:08.446');
INSERT INTO `customers` VALUES (4, 'CUST-1004', 'Ananya Iyer', 'ananya@example.com', '+919876543213', 'Chennai', 'high_value', 'ios', 'iOS 18', '2.3', '2026-06-20 09:15:00.000', 1, '2026-10-31 07:58:08.446');
INSERT INTO `customers` VALUES (5, 'CUST-1005', 'Vikram Joshi', 'vikram@example.com', '+919876543214', 'Hyderabad', 'regular', 'android', 'Android 13', '2.2', '2026-08-25 16:45:00.000', 1, '2026-10-31 07:58:08.446');
INSERT INTO `customers` VALUES (30001, 'CUST-1006', 'Meera Nambiar', 'meera@example.com', '+919876543215', 'Kochi', 'high_value', 'ios', 'iOS 17.5', '2.3', '2026-05-12 12:00:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30002, 'CUST-1007', 'Karan Singhania', 'karan@example.com', '+919876543216', 'Pune', 'metro', 'android', 'Android 14', '2.3.1', '2026-04-18 18:30:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30003, 'CUST-1008', 'Sneha Kulkarni', 'sneha@example.com', '+919876543217', 'Pune', 'regular', 'web', 'Chrome 128', 'web-app', '2026-03-22 15:10:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30004, 'CUST-1009', 'Aditya Roy', 'aditya@example.com', '+919876543218', 'Kolkata', 'regular', 'android', 'Android 12', '2.1', '2026-02-14 09:40:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30005, 'CUST-1010', 'Deepika Nair', 'deepika@example.com', '+919876543219', 'Thiruvananthapuram', 'high_value', 'ios', 'iOS 18', '2.3', '2026-07-07 14:05:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30006, 'CUST-1011', 'Rahul Deshmukh', 'rahul.d@example.com', '+919876543220', 'Nagpur', 'regular', 'android', 'Android 14', '2.3', '2026-09-12 11:25:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30007, 'CUST-1012', 'Pooja Reddy', 'pooja@example.com', '+919876543221', 'Bengaluru', 'high_value', 'web', 'Safari 18', 'web-app', '2026-08-19 16:15:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30008, 'CUST-1013', 'Sameer Qureshi', 'sameer@example.com', '+919876543222', 'Lucknow', 'metro', 'android', 'Android 13', '2.3', '2026-09-29 13:50:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30009, 'CUST-1014', 'Kavita Patel', 'kavita@example.com', '+919876543223', 'Ahmedabad', 'metro', 'android', 'Android 14', '2.3', '2026-10-01 17:35:00.000', 1, '2026-10-31 14:02:41.853');
INSERT INTO `customers` VALUES (30010, 'CUST-1015', 'Nikhil Gupta', 'nikhil@example.com', '+919876543224', 'Jaipur', 'regular', 'android', 'Android 14', '2.3', '2026-10-05 10:45:00.000', 1, '2026-10-31 14:02:41.853');

-- ----------------------------
-- Table structure for decision_briefs
-- ----------------------------
DROP TABLE IF EXISTS `decision_briefs`;
CREATE TABLE `decision_briefs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `agent_run_id` bigint NULL DEFAULT NULL,
  `brief` json NOT NULL,
  `generator` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `grounding_passed` tinyint(1) NOT NULL DEFAULT 1,
  `usefulness_rating` tinyint NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_briefs_incident`(`incident_id` ASC) USING BTREE
) AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of decision_briefs
-- ----------------------------
INSERT INTO `decision_briefs` VALUES (1, 1, 3, '{\"recommended_action\": \"Authorize Feature Flag rollback and trigger auto-reconciliation job.\", \"risk_verdict\": \"Low reversibility risk. Expected customer recovery within 15 minutes.\", \"summary\": \"Actionable executive decision brief for incident commander and reliability engineers.\"}', 'synthesizer', 1, 5, '2026-10-31 09:18:19.333');

-- ----------------------------
-- Table structure for feedback
-- ----------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `source` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source_record_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` bigint NULL DEFAULT NULL,
  `order_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `channel` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `rating` tinyint NULL DEFAULT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `language` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'en',
  `category` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `sentiment` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `urgency` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `metadata` json NULL,
  `event_timestamp` datetime(3) NOT NULL,
  `processing_status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'pending',
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_feedback_idempotency`(`source` ASC, `source_record_id` ASC) USING BTREE,
  INDEX `idx_feedback_time`(`event_timestamp` ASC) USING BTREE,
  INDEX `idx_feedback_category`(`category` ASC, `event_timestamp` ASC) USING BTREE,
  INDEX `idx_feedback_status`(`processing_status` ASC) USING BTREE,
  INDEX `idx_feedback_customer`(`customer_id` ASC) USING BTREE,
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of feedback
-- ----------------------------
INSERT INTO `feedback` VALUES (30001, 'mobile_app', 'REV-9821', 1, 'ORD-4810', 'mobile_app', 1, 'My bank debited Rs 3,499 for groceries order via UPI on Android 14. The screen froze at payment verification and no order was generated!', 'en', 'payment', 'critical', 'critical', '{\"amount\": 3499, \"error\": \"TIMEOUT_504\", \"gateway\": \"UPI\"}', '2026-10-31 09:42:10.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30002, 'support_ticket', 'TICK-9820', 2, 'ORD-4811', 'support_ticket', 1, 'Paid through UPI QR on Android v2.3. HDFC sent SMS that payment of Rs 1,850 succeeded, but app shows empty cart and order failed.', 'en', 'payment', 'critical', 'critical', '{\"amount\": 1850, \"gateway\": \"UPI_QR\"}', '2026-10-31 09:38:22.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30003, 'google_forms', 'FORM-9819', 3, 'ORD-4812', 'google_forms', 1, 'App crashes during biometric UPI PIN confirmation screen. Money Rs 2,400 got deducted from GPay twice without food order!', 'en', 'payment', 'critical', 'high', '{\"amount\": 2400, \"gateway\": \"GPay\"}', '2026-10-31 09:31:05.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30004, 'website', 'WEB-9818', 4, 'ORD-5520', 'website', 4, 'Web checkout worked smoothly without issues, but heavy rain in Bengaluru delayed delivery by 25 mins.', 'en', 'delivery', 'neutral', 'low', '{\"weather\": \"rain\"}', '2026-10-31 09:22:45.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30005, 'social_media', 'SOC-9817', 5, 'ORD-4419', 'social_media', 1, '@RecoverIQ @Support App charged my UPI account Rs 5,200 for team lunch and no ticket booked! Please refund urgently!', 'en', 'payment', 'critical', 'critical', '{\"amount\": 5200}', '2026-10-31 09:15:30.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30006, 'mobile_app', 'REV-9816', 30001, 'ORD-4813', 'mobile_app', 5, 'Super prompt delivery and loved the fresh produce quality. The packaging was eco-friendly and neat.', 'en', 'general', 'positive', 'low', '{\"rating\": 5}', '2026-10-31 09:10:00.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30007, 'support_ticket', 'TICK-9815', 30002, 'ORD-4814', 'support_ticket', 1, 'Delivery boy got stuck in Koramangala waterlogging. Order is delayed by 55 mins and ice cream melted completely.', 'en', 'delivery', 'negative', 'high', '{\"delay_mins\": 55}', '2026-10-31 09:05:15.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30008, 'website', 'WEB-9814', 30003, 'ORD-4815', 'website', 5, 'Clean website interface, quick coupon apply, and immediate order placement. Great job engineering team!', 'en', 'general', 'positive', 'low', '{\"platform\": \"desktop_chrome\"}', '2026-10-31 08:58:30.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30009, 'mobile_app', 'REV-9813', 30004, 'ORD-4816', 'mobile_app', 2, 'Search takes forever to load Diwali gift hampers and shows zero results even though item is in stock in store.', 'en', 'product', 'negative', 'medium', '{\"query\": \"diwali hampers\"}', '2026-10-31 08:52:10.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30010, 'google_forms', 'FORM-9812', 30005, 'ORD-4817', 'google_forms', 5, 'ApplePay checkout on iOS was buttery smooth! Delivered in 14 minutes flat in Trivandrum.', 'en', 'general', 'positive', 'low', '{\"payment\": \"applepay\"}', '2026-10-31 08:44:00.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30011, 'mobile_app', 'REV-9811', 30006, 'ORD-4818', 'mobile_app', 1, 'PhonePe debited Rs 980 for breakfast order. Phone returned to merchant screen saying session expired! Money lost!', 'en', 'payment', 'critical', 'critical', '{\"amount\": 980, \"gateway\": \"PhonePe\"}', '2026-10-31 08:35:20.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30012, 'support_ticket', 'TICK-9810', 30007, 'ORD-4819', 'support_ticket', 4, 'Invoice PDF downloaded from website did not have GSTIN clearly visible. Please re-email the bill copy.', 'en', 'billing', 'neutral', 'low', '{\"document\": \"invoice\"}', '2026-10-31 08:29:40.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30013, 'social_media', 'SOC-9809', 30008, 'ORD-4820', 'social_media', 1, 'Terrible checkout glitch on Android app. Double charged for order ORD-4820. Fix your UPI payment gateway!', 'en', 'payment', 'critical', 'critical', '{\"double_charged\": true}', '2026-10-31 08:20:15.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30014, 'website', 'WEB-9808', 30009, 'ORD-4821', 'website', 5, 'Customer support resolved my address change within 2 minutes on chat. Excellent customer service!', 'en', 'support', 'positive', 'low', '{\"agent\": \"support_ai\"}', '2026-10-31 08:12:00.000', 'analyzed', 1, '2026-10-31 08:44:52.338');
INSERT INTO `feedback` VALUES (30015, 'mobile_app', 'REV-9807', 30010, 'ORD-4822', 'mobile_app', 1, 'Cred UPI transaction completed and money deducted from ICICI account, but cart remains in checkout step.', 'en', 'payment', 'critical', 'critical', '{\"amount\": 1640, \"gateway\": \"CRED_UPI\"}', '2026-10-31 08:05:00.000', 'analyzed', 1, '2026-10-31 08:44:52.338');

-- ----------------------------
-- Table structure for incident_evidence
-- ----------------------------
DROP TABLE IF EXISTS `incident_evidence`;
CREATE TABLE `incident_evidence`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `evidence_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source_table` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source_record_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `evidence_timestamp` datetime(3) NULL DEFAULT NULL,
  `relevance_score` decimal(5, 4) NULL DEFAULT NULL,
  `supports_hypothesis` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `metadata` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_evidence_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_evidence_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of incident_evidence
-- ----------------------------
INSERT INTO `incident_evidence` VALUES (13, 1, 'telemetry_log', 'operational_events', 'EVT-90412', 'Payment gateway intent socket timeout aborted order pipeline with HTTP 504', '2026-10-31 06:18:18.000', 0.9800, '1', '{\"latency_ms\": 8002, \"subsystem\": \"upi-gateway\"}', '2026-10-31 09:18:18.546');
INSERT INTO `incident_evidence` VALUES (14, 1, 'customer_feedback', 'feedback', 'REV-9821', 'Aarav Mehta: Bank debited Rs 3,499 via UPI on Android 14, screen froze with no order confirmation', '2026-10-31 07:18:18.000', 0.9600, '1', '{\"customer_id\": \"CUST-1001\", \"sentiment\": \"critical\"}', '2026-10-31 09:18:18.546');
INSERT INTO `incident_evidence` VALUES (15, 1, 'release_commit', 'git_log', 'COMMIT-8812a', 'PR #418: Reduced IntentClient timeout from 30s to 8s in v2.3 release build', '2026-10-30 21:18:18.000', 0.9400, '1', '{\"author\": \"release-bot\", \"pr_number\": 418}', '2026-10-31 09:18:18.546');
INSERT INTO `incident_evidence` VALUES (16, 1, 'network_trace', 'ingress_gateway', 'TRACE-7719', 'Partner bank callback succeeded in 9.2s after client connection socket closed at 8.0s', '2026-10-31 07:18:18.000', 0.9900, '1', '{\"bank_ack\": 200, \"client_ack\": \"ECONNABORTED\"}', '2026-10-31 09:18:18.546');

-- ----------------------------
-- Table structure for incident_reassessments
-- ----------------------------
DROP TABLE IF EXISTS `incident_reassessments`;
CREATE TABLE `incident_reassessments`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `agent_run_id` bigint NULL DEFAULT NULL,
  `trigger_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `diff` json NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_reassess_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_reassess_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of incident_reassessments
-- ----------------------------

-- ----------------------------
-- Table structure for incident_segments
-- ----------------------------
DROP TABLE IF EXISTS `incident_segments`;
CREATE TABLE `incident_segments`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `dimension` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `segment_value` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `affected_customers` int NOT NULL,
  `total_customers` int NOT NULL,
  `issue_rate` decimal(10, 6) NOT NULL,
  `comparison_rate` decimal(10, 6) NOT NULL,
  `lift_ratio` decimal(12, 4) NULL DEFAULT NULL,
  `p_value` double NULL DEFAULT NULL,
  `significant` tinyint(1) NOT NULL DEFAULT 0,
  `limitations` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_segments_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_segments_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of incident_segments
-- ----------------------------
INSERT INTO `incident_segments` VALUES (30013, 1, 'app_version', 'Android v2.3', 156, 14200, 0.010900, 0.000700, 14.8000, 0.0001, 1, NULL, '2026-10-31 08:44:49.120');
INSERT INTO `incident_segments` VALUES (30014, 1, 'device_os', 'Android 14', 142, 28500, 0.004900, 0.000400, 11.2000, 0.0001, 1, NULL, '2026-10-31 08:44:49.120');
INSERT INTO `incident_segments` VALUES (30015, 1, 'payment_gateway', 'UPI_INTENT', 156, 45000, 0.003400, 0.000400, 8.4000, 0.0001, 1, NULL, '2026-10-31 08:44:49.120');
INSERT INTO `incident_segments` VALUES (30016, 30002, 'city', 'Bengaluru South', 342, 18900, 0.018000, 0.002600, 6.7000, 0.0001, 1, NULL, '2026-10-31 08:44:49.120');

-- ----------------------------
-- Table structure for incidents
-- ----------------------------
DROP TABLE IF EXISTS `incidents`;
CREATE TABLE `incidents`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_number` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `issue_category` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'detected',
  `severity` decimal(6, 4) NULL DEFAULT NULL,
  `severity_inputs` json NULL,
  `confidence_score` decimal(5, 4) NULL DEFAULT NULL,
  `first_detected_at` datetime(3) NOT NULL,
  `last_updated_at` datetime(3) NOT NULL,
  `affected_customer_count` int NOT NULL DEFAULT 0,
  `estimated_business_impact` decimal(14, 2) NULL DEFAULT NULL,
  `root_cause_verdict` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `resolution_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `partially_analyzed` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` json NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `closed_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_incident_number`(`incident_number` ASC) USING BTREE,
  INDEX `idx_incidents_status`(`status` ASC) USING BTREE
) AUTO_INCREMENT = 60013 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of incidents
-- ----------------------------
INSERT INTO `incidents` VALUES (1, 'RIQ-2026-0027', 'Payment failures: UPI money debited without order generation on Android v2.3', 'Customers on Android v2.3 experience dropped deep-links upon returning from UPI intent banking apps. Funds are debited from bank account, but checkout callback times out resulting in stranded transactions without order confirmation.', 'payment', 'awaiting_approval', 0.0920, '{\"affected_customers_share\": 0.02684, \"confidence\": 0.95, \"growth_factor\": 3.607, \"harm_weight\": 1}', 0.9500, '2026-10-31 08:15:00.000', '2026-10-31 09:45:00.000', 156, 482000.00, 'Deep-link callback unregistering in Android Activity onStop lifecycle in release build v2.3.', 'Rollback timeout flag, force OTA patch v2.3.1, trigger auto-reconciliation refund job, and credit ₹200 voucher.', 1, '{\"court\": {\"funnel\": {\"breakpoint\": \"Deep-Link Callback Handshake on Android v2.3\", \"stages\": [{\"count\": 12450, \"drop_rate\": 0.02, \"name\": \"Cart Checkout Initiated\"}, {\"count\": 9820, \"drop_rate\": 0.01, \"name\": \"UPI Intent App Redirected\"}, {\"count\": 9720, \"drop_rate\": 0, \"name\": \"Bank Account Debited (SMS)\"}, {\"breakpoint\": true, \"count\": 9564, \"drop_rate\": 0.016, \"name\": \"Deep-Link Callback Handshake\"}, {\"count\": 9564, \"drop_rate\": 0, \"name\": \"Order Generated & Confirmed\"}], \"telemetry_available\": true}, \"posterior_probability\": 0.942, \"verdict\": \"HYP-01 Confirmed: Android v2.3 client socket timeout mismatch (8s vs 9.4s)\"}, \"explanation\": [\"Root Cause Court evaluated 3 rival hypotheses using Bayesian evidentiary likelihood.\", \"Lifecycle tracing proved Android v2.3 release binary drops intent callbacks during activity transition.\", \"Reconciliation batch verified 100% of the 156 stranded debits against partner bank settlement ledger.\"], \"fix_deployed\": false, \"impact\": {\"direct_customer_loss\": 202440, \"estimated_financial_loss\": 482000, \"reconciliation\": {\"overdue\": [{\"amount\": 3499, \"bank_ref\": \"HDFC-UPI-98124\", \"customer_name\": \"Aarav Mehta\", \"order_id\": \"ORD-4810\", \"status\": \"stranded_debit\"}, {\"amount\": 1850, \"bank_ref\": \"ICICI-UPI-41829\", \"customer_name\": \"Priya Sharma\", \"order_id\": \"ORD-4811\", \"status\": \"stranded_debit\"}, {\"amount\": 2400, \"bank_ref\": \"SBI-UPI-10928\", \"customer_name\": \"Rohan Verma\", \"order_id\": \"ORD-4812\", \"status\": \"stranded_debit\"}, {\"amount\": 5200, \"bank_ref\": \"AXIS-UPI-55219\", \"customer_name\": \"Vikram Joshi\", \"order_id\": \"ORD-4419\", \"status\": \"stranded_debit\"}], \"states\": {\"auto_reconcilable\": 156, \"bank_settled_uncredited\": 156, \"requires_manual_audit\": 0, \"total_stranded_transactions\": 156}, \"telemetry_available\": true}}, \"shared_components\": [{\"component\": \"UPI Intent Listener Activity\", \"impact\": \"Crash/Drop on Stop\", \"status\": \"hotfix_available\"}, {\"component\": \"Partner Ingress Webhook\", \"impact\": \"9.4s Latency Exceeds 8s Timeout\", \"status\": \"within_sla\"}, {\"component\": \"Order Rehydration Batch Pipeline\", \"impact\": \"Staged for 156 Orders\", \"status\": \"ready\"}], \"telemetry_available\": true, \"window_start\": \"2026-10-31T07:45:00Z\"}', 1, NULL, '2026-10-31 07:58:08.812');
INSERT INTO `incidents` VALUES (30002, 'RIQ-2026-0028', 'Delivery SLA breach: Peak rain delivery delays across South Bengaluru hubs', 'Severe weather events causing 45-minute order dispatch delays across Koramangala and HSR Layout delivery hubs. High cancellation velocity before rider pickup.', 'delivery', 'mitigating', 0.0640, NULL, 0.8850, '2026-10-31 10:02:41.000', '2026-10-31 14:02:41.000', 342, 184500.00, 'Extreme weather surge and fleet shortfall in southern sector.', 'Dynamic ETA buffer extended to +25 mins and surge radius throttled to prioritize high-value cart fulfillments.', 0, '{\"explanation\": [\"Automated root-cause court evaluated 3 competitive causal hypotheses.\", \"Causal test T-01 confirmed 100% reproduction of deep-link drops on Android v2.3 release binary.\", \"Stranded financial exposure quantified at Rs 1,84,500 across 342 customers.\"], \"telemetry_available\": true, \"window_start\": \"2026-10-31T04:32:41.874Z\"}', 1, NULL, '2026-10-31 14:02:41.875');
INSERT INTO `incidents` VALUES (30003, 'RIQ-2026-0029', 'Search indexing latency: Fresh catalog price changes delayed by 40 minutes', 'Elasticsearch read replica sync lag during flash inventory refreshes causing cart price mismatch warnings at checkout stage.', 'product', 'investigating', 0.0410, NULL, 0.7920, '2026-10-31 10:02:41.000', '2026-10-31 14:02:41.000', 89, 62000.00, 'Kafka consumer lag on catalog-pricing topic exceeding 12,000 offsets.', 'Scale catalog sync worker deployment to 8 pods and flush intermediate Redis cache.', 0, '{\"explanation\": [\"Automated root-cause court evaluated 3 competitive causal hypotheses.\", \"Causal test T-01 confirmed 100% reproduction of deep-link drops on Android v2.3 release binary.\", \"Stranded financial exposure quantified at Rs 62,000 across 89 customers.\"], \"telemetry_available\": true, \"window_start\": \"2026-10-31T04:32:41.877Z\"}', 1, NULL, '2026-10-31 14:02:41.877');
INSERT INTO `incidents` VALUES (30004, 'RIQ-2026-0026', 'iOS Checkout ApplePay session handshake timeout on iOS 18 beta', 'Users on iOS 18 beta experienced passkit session token invalidation during multi-factor biometric authentication.', 'payment', 'resolved', 0.0350, NULL, 0.9600, '2026-10-31 10:02:41.000', '2026-10-31 14:02:41.000', 45, 78000.00, 'ApplePay token domain verification certificate renewal mismatch.', 'Renewed merchant domain certificate and deployed configuration hotfix.', 0, '{\"explanation\": [\"Automated root-cause court evaluated 3 competitive causal hypotheses.\", \"Causal test T-01 confirmed 100% reproduction of deep-link drops on Android v2.3 release binary.\", \"Stranded financial exposure quantified at Rs 78,000 across 45 customers.\"], \"telemetry_available\": true, \"window_start\": \"2026-10-31T04:32:41.880Z\"}', 1, NULL, '2026-10-31 14:02:41.880');

-- ----------------------------
-- Table structure for ingestion_jobs
-- ----------------------------
DROP TABLE IF EXISTS `ingestion_jobs`;
CREATE TABLE `ingestion_jobs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `source` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'pending',
  `total_records` int NOT NULL DEFAULT 0,
  `processed_records` int NOT NULL DEFAULT 0,
  `failed_records` int NOT NULL DEFAULT 0,
  `duplicate_records` int NOT NULL DEFAULT 0,
  `attempts` int NOT NULL DEFAULT 0,
  `error_summary` json NULL,
  `payload` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` datetime(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_jobs_status`(`status` ASC, `created_at` ASC) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of ingestion_jobs
-- ----------------------------

-- ----------------------------
-- Table structure for investigation_tests
-- ----------------------------
DROP TABLE IF EXISTS `investigation_tests`;
CREATE TABLE `investigation_tests`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `hypothesis_id` bigint NOT NULL,
  `test_name` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `result` json NULL,
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_test`(`hypothesis_id` ASC, `test_name` ASC) USING BTREE,
  INDEX `idx_tests_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_tests_hypothesis` FOREIGN KEY (`hypothesis_id`) REFERENCES `root_cause_hypotheses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_tests_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of investigation_tests
-- ----------------------------
INSERT INTO `investigation_tests` VALUES (30013, 1, 30007, 'T-01: Lifecycle Drop Trace', 'passed', '{\"passed\": true, \"sample_size\": 156, \"score\": 0.98}', 'Confirmed 100% reproduction of intent callback dropped during external UPI redirect.', '2026-10-31 09:18:18.204');
INSERT INTO `investigation_tests` VALUES (30014, 1, 30007, 'T-02: Socket Timeout Inspection', 'passed', '{\"backend_p99\": \"9.4s\", \"client_timeout\": \"8s\", \"passed\": true}', 'v2.3 client configured 8s timeout whereas 99th percentile backend webhook takes 9.4s under load.', '2026-10-31 09:18:18.204');
INSERT INTO `investigation_tests` VALUES (30015, 1, 30007, 'T-03: Telemetry Error Correlation', 'passed', '{\"lift\": 14.8, \"p_value\": 0.0001, \"passed\": true}', 'p < 0.0001 correlation with Android 14 release v2.3 binary SHA signature.', '2026-10-31 09:18:18.204');
INSERT INTO `investigation_tests` VALUES (30016, 1, 30008, 'T-04: Partner Gateway Audit', 'failed', '{\"gateway_health\": \"99.8% OK\", \"passed\": false}', 'Refuted: Bank gateway returned 200 OK within 800ms for 99.8% of synthetic probes.', '2026-10-31 09:18:18.324');

-- ----------------------------
-- Table structure for issue_clusters
-- ----------------------------
DROP TABLE IF EXISTS `issue_clusters`;
CREATE TABLE `issue_clusters`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NULL DEFAULT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `cluster_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `feedback_count` int NOT NULL DEFAULT 0,
  `severity_score` decimal(6, 4) NULL DEFAULT NULL,
  `first_seen_at` datetime(3) NULL DEFAULT NULL,
  `last_seen_at` datetime(3) NULL DEFAULT NULL,
  `metadata` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_clusters_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_clusters_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60003 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of issue_clusters
-- ----------------------------
INSERT INTO `issue_clusters` VALUES (30009, 1, 'UPI Intent Deep-Link Loss on Android v2.3', 'Money debited from user bank, app fails to receive payment confirmation callback on returning from GPay/PhonePe.', 'ERR_UPI_INTENT_DROP', 156, 0.0920, '2026-10-31 04:44:48.000', '2026-10-31 08:44:48.000', '{\"error_code\": \"INTENT_CALLBACK_TIMEOUT\", \"segment\": \"android_v2.3\"}', '2026-10-31 08:44:48.804');
INSERT INTO `issue_clusters` VALUES (30010, 30002, 'Food Delivery Rider ETA Buffer Breach', 'Heavy rainfall causing riders to cancel dispatch; orders delayed beyond acceptable customer threshold.', 'ERR_RAIN_DELIVERY_DELAY', 342, 0.0640, '2026-10-31 05:44:48.000', '2026-10-31 08:44:48.000', '{\"hub\": \"South_BLR\", \"weather\": \"heavy_rain\"}', '2026-10-31 08:44:48.804');

-- ----------------------------
-- Table structure for kg_edges
-- ----------------------------
DROP TABLE IF EXISTS `kg_edges`;
CREATE TABLE `kg_edges`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `src_id` bigint NOT NULL,
  `dst_id` bigint NOT NULL,
  `edge_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `fact_kind` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `props` json NULL,
  `evidence_ids` json NULL,
  `run_id` bigint NOT NULL,
  `superseded_by` bigint NULL DEFAULT NULL,
  `superseded_at_run` bigint NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_kg_edges_incident`(`incident_id` ASC, `run_id` ASC) USING BTREE,
  INDEX `idx_kg_edges_pair`(`src_id` ASC, `dst_id` ASC, `edge_type` ASC) USING BTREE,
  INDEX `fk_kg_edges_dst`(`dst_id` ASC) USING BTREE,
  CONSTRAINT `fk_kg_edges_dst` FOREIGN KEY (`dst_id`) REFERENCES `kg_nodes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_kg_edges_src` FOREIGN KEY (`src_id`) REFERENCES `kg_nodes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of kg_edges
-- ----------------------------

-- ----------------------------
-- Table structure for kg_nodes
-- ----------------------------
DROP TABLE IF EXISTS `kg_nodes`;
CREATE TABLE `kg_nodes`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NULL DEFAULT NULL,
  `node_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `natural_key` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `props` json NULL,
  `fact_kind` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source_table` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `source_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `confidence` decimal(5, 4) NULL DEFAULT NULL,
  `run_id` bigint NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_kg_node`(`node_type` ASC, `natural_key` ASC) USING BTREE,
  INDEX `idx_kg_nodes_incident`(`incident_id` ASC) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of kg_nodes
-- ----------------------------

-- ----------------------------
-- Table structure for kpi_definitions
-- ----------------------------
DROP TABLE IF EXISTS `kpi_definitions`;
CREATE TABLE `kpi_definitions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `unit` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `target_value` decimal(12, 4) NOT NULL,
  `comparison_operator` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `monitoring_window_minutes` int NOT NULL,
  `required_for_resolution` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `domain` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT 'payments',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_kpi_name`(`name` ASC) USING BTREE
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of kpi_definitions
-- ----------------------------
INSERT INTO `kpi_definitions` VALUES (1, 'payment_failure_rate', 'Percentage of payment attempts that fail', 'percent', 2.0000, '<', 60, 1, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (2, 'payment_no_order_rate', 'Percentage of captured payments with no order created', 'percent', 0.5000, '<', 60, 1, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (3, 'complaint_volume_delta', 'Change in complaint volume vs baseline window', 'percent', 10.0000, '<', 120, 1, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (4, 'refund_completion_time_p95', '95th-percentile refund completion time (hours)', 'hours', 24.0000, '<=', 120, 0, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (5, 'affected_customer_contact', 'Percentage of affected customers contacted', 'percent', 90.0000, '>=', 180, 0, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (6, 'repeat_complaint_rate', 'Percentage of affected customers submitting repeat feedback', 'percent', 5.0000, '<', 120, 1, '2026-10-31 07:14:52.748', 'payments');
INSERT INTO `kpi_definitions` VALUES (30001, 'payment_without_order_rate', 'Share of captured payments with no order created', 'percent', 0.5000, '<=', 120, 1, '2026-10-31 09:13:20.952', 'payments');
INSERT INTO `kpi_definitions` VALUES (30002, 'complaint_volume', 'Complaints per hour in the incident category', 'per_hour', 3.0000, '<=', 120, 1, '2026-10-31 09:13:21.162', 'payments');
INSERT INTO `kpi_definitions` VALUES (30003, 'successful_order_completion_rate', 'Share of orders completed', 'percent', 93.0000, '>=', 120, 1, '2026-10-31 09:13:21.325', 'payments');
INSERT INTO `kpi_definitions` VALUES (30004, 'complaint_rate_new_batches', 'Complaints per 100 units for new batches', 'per_100_units', 1.5000, '<=', 120, 1, '2026-10-31 09:13:21.486', 'product');
INSERT INTO `kpi_definitions` VALUES (30005, 'not_charging_return_share', 'Not charging share of returns', 'percent', 8.0000, '<=', 120, 1, '2026-10-31 09:13:21.635', 'product');
INSERT INTO `kpi_definitions` VALUES (30006, 'replacement_acceptance_rate', 'Customers accepting a replacement', 'percent', 60.0000, '>=', 120, 1, '2026-10-31 09:13:21.790', 'product');

-- ----------------------------
-- Table structure for kpi_measurements
-- ----------------------------
DROP TABLE IF EXISTS `kpi_measurements`;
CREATE TABLE `kpi_measurements`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `kpi_definition_id` bigint NOT NULL,
  `measured_value` decimal(12, 4) NOT NULL,
  `measured_at` datetime(3) NOT NULL,
  `metadata` json NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_kpi_point`(`incident_id` ASC, `kpi_definition_id` ASC, `measured_at` ASC) USING BTREE,
  INDEX `fk_kpi_definition`(`kpi_definition_id` ASC) USING BTREE,
  CONSTRAINT `fk_kpi_definition` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_definitions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_kpi_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of kpi_measurements
-- ----------------------------
INSERT INTO `kpi_measurements` VALUES (1, 1, 5, 0.0820, '2026-10-31 08:20:29.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (2, 1, 5, 0.0450, '2026-10-31 08:50:29.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (3, 1, 5, 0.0080, '2026-10-31 09:20:29.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (4, 1, 30004, 0.0820, '2026-10-31 08:20:29.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (5, 1, 30004, 0.0450, '2026-10-31 08:50:29.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (6, 1, 30004, 0.0080, '2026-10-31 09:20:29.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (7, 1, 30002, 0.0820, '2026-10-31 08:20:29.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (8, 1, 30002, 0.0450, '2026-10-31 08:50:29.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (9, 1, 30002, 0.0080, '2026-10-31 09:20:29.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (10, 1, 3, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (11, 1, 3, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (12, 1, 3, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (13, 1, 30005, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (14, 1, 30005, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (15, 1, 30005, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (16, 1, 1, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (17, 1, 1, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (18, 1, 1, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (19, 1, 2, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (20, 1, 2, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (21, 1, 2, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (22, 1, 30001, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (23, 1, 30001, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (24, 1, 30001, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (25, 1, 4, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (26, 1, 4, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (27, 1, 4, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (28, 1, 6, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (29, 1, 6, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (30, 1, 6, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (31, 1, 30006, 0.0820, '2026-10-31 08:20:30.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (32, 1, 30006, 0.0450, '2026-10-31 08:50:30.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (33, 1, 30006, 0.0080, '2026-10-31 09:20:30.000', '{\"phase\": \"recovering\"}');
INSERT INTO `kpi_measurements` VALUES (34, 1, 30003, 0.0820, '2026-10-31 08:20:31.000', '{\"phase\": \"incident\"}');
INSERT INTO `kpi_measurements` VALUES (35, 1, 30003, 0.0450, '2026-10-31 08:50:31.000', '{\"phase\": \"action_staged\"}');
INSERT INTO `kpi_measurements` VALUES (36, 1, 30003, 0.0080, '2026-10-31 09:20:31.000', '{\"phase\": \"recovering\"}');

-- ----------------------------
-- Table structure for operational_events
-- ----------------------------
DROP TABLE IF EXISTS `operational_events`;
CREATE TABLE `operational_events`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `event_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `event_timestamp` datetime(3) NOT NULL,
  `customer_id` bigint NULL DEFAULT NULL,
  `order_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `payment_status` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `payment_method` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `amount` decimal(12, 2) NULL DEFAULT NULL,
  `platform` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `device_os` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `app_version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `city` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `bank` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `payment_gateway` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `psp_app` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `os` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `os_version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `device_model` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `network_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `http_status` smallint NULL DEFAULT NULL,
  `latency_ms` int NULL DEFAULT NULL,
  `error_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `metadata` json NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_events_type_time`(`event_type` ASC, `event_timestamp` ASC) USING BTREE,
  INDEX `idx_events_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_events_time`(`event_timestamp` ASC) USING BTREE,
  INDEX `fk_events_customer`(`customer_id` ASC) USING BTREE,
  CONSTRAINT `fk_events_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of operational_events
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `external_order_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` bigint NULL DEFAULT NULL,
  `status` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `platform` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `device_os` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `app_version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `city` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `bank` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `payment_gateway` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `psp_app` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `os` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `os_version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `device_model` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `network_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `ordered_at` datetime(3) NOT NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_orders_external`(`external_order_id` ASC) USING BTREE,
  INDEX `idx_orders_time`(`ordered_at` ASC) USING BTREE,
  INDEX `idx_orders_customer`(`customer_id` ASC, `ordered_at` ASC) USING BTREE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for product_releases
-- ----------------------------
DROP TABLE IF EXISTS `product_releases`;
CREATE TABLE `product_releases`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `version` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `platform` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `release_timestamp` datetime(3) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `changes` json NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_release`(`version` ASC, `platform` ASC) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of product_releases
-- ----------------------------

-- ----------------------------
-- Table structure for recoveriq_migrations
-- ----------------------------
DROP TABLE IF EXISTS `recoveriq_migrations`;
CREATE TABLE `recoveriq_migrations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `applied_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_migration_name`(`name` ASC) USING BTREE
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of recoveriq_migrations
-- ----------------------------
INSERT INTO `recoveriq_migrations` VALUES (1, '001_recoveriq_core', '2026-10-31 07:14:51.111');
INSERT INTO `recoveriq_migrations` VALUES (2, '002_payment_funnel', '2026-10-31 07:14:51.519');
INSERT INTO `recoveriq_migrations` VALUES (3, '003_knowledge_graph', '2026-10-31 07:14:52.626');

-- ----------------------------
-- Table structure for recovery_actions
-- ----------------------------
DROP TABLE IF EXISTS `recovery_actions`;
CREATE TABLE `recovery_actions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `recommendation_id` bigint NOT NULL,
  `action_type` varchar(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `target_reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `execution_result` json NULL,
  `executed_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_action_rec`(`recommendation_id` ASC) USING BTREE,
  INDEX `idx_actions_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_actions_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_actions_rec` FOREIGN KEY (`recommendation_id`) REFERENCES `recovery_recommendations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of recovery_actions
-- ----------------------------
INSERT INTO `recovery_actions` VALUES (30003, 1, 30006, 'simulate_feature_flag_change', 'succeeded', 'FeatureFlag:ENABLE_UPI_SOCKET_TIMEOUT_V2', '{\"flag\": \"ENABLE_UPI_SOCKET_TIMEOUT_V2\", \"previous\": \"60s\", \"response_code\": 200, \"updated\": \"30s\"}', '2026-10-31 07:59:51.000', '2026-10-31 08:44:51.906');
INSERT INTO `recovery_actions` VALUES (30004, 1, 30007, 'simulate_refund', 'succeeded', 'BatchJob:reconcile_upi_intent_failures', '{\"batch_id\": \"BATCH-REC-20261031-01\", \"restored_orders\": 156, \"total_amount\": 482000, \"total_reconciled\": 156}', '2026-10-31 08:24:51.000', '2026-10-31 08:44:51.906');

-- ----------------------------
-- Table structure for recovery_recommendations
-- ----------------------------
DROP TABLE IF EXISTS `recovery_recommendations`;
CREATE TABLE `recovery_recommendations`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `action_key` varchar(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action_type` varchar(48) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `priority` int NOT NULL,
  `score` decimal(6, 4) NULL DEFAULT NULL,
  `estimated_cost` decimal(14, 2) NULL DEFAULT NULL,
  `expected_benefit` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `risk_level` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'proposed',
  `rationale` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_recs_incident`(`incident_id` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `fk_recs_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of recovery_recommendations
-- ----------------------------
INSERT INTO `recovery_recommendations` VALUES (30006, 1, 'disable_feature_flag', 'simulate_feature_flag_change', 'Rollback Feature Flag: ENABLE_UPI_SOCKET_TIMEOUT_V2 to 30s', 'Restore the socket timeout threshold from 8s to 30s across production clients.', 1, NULL, 0.00, 'Immediate drop in intent callback drops (<1%) within 60 seconds.', 'low', 1, 'proposed', '{\"confidence\": 0.95, \"impact_hours\": 4, \"reversibility\": 1}', '2026-10-31 08:44:50.590');
INSERT INTO `recovery_recommendations` VALUES (30007, 1, 'batch_order_rehydration', 'simulate_refund', 'Simulate Automated Batch Reconciliation & Order Rehydration', 'Run automated batch query against bank settlement API to rehydrate orders for debited accounts.', 2, NULL, 1500.00, 'Reconcile 156 stranded debits with partner bank and auto-generate confirmed orders without charging again.', 'medium', 1, 'proposed', '{\"target_count\": 156, \"total_amount\": 482000}', '2026-10-31 08:44:50.863');
INSERT INTO `recovery_recommendations` VALUES (30008, 1, 'proactive_sms_voucher', 'simulate_coupon', 'Dispatch Proactive Recovery SMS & ₹200 Apology Credit Voucher', 'Issue immediate automated apology notification with compensation coupon to impacted user profiles.', 3, NULL, 31200.00, 'Prevent churn and rebuild trust by issuing instant ₹200 credits to all 156 impacted users.', 'low', 1, 'proposed', '{\"target_count\": 156, \"voucher_amount\": 200}', '2026-10-31 08:44:51.127');
INSERT INTO `recovery_recommendations` VALUES (30009, 30002, 'adjust_delivery_sla', 'simulate_sla_adjustment', 'Extend Delivery SLA Window by +25 Mins Across South Hubs', 'Temporarily expand estimated delivery time to account for monsoon road waterlogging in South Bengaluru.', 1, NULL, 0.00, 'Calibrate consumer expectations during rain storm; drop customer cancellation rate by 60%.', 'low', 1, 'proposed', '{\"affected_riders\": 85, \"rain_severity\": \"high\"}', '2026-10-31 08:44:51.374');

-- ----------------------------
-- Table structure for root_cause_hypotheses
-- ----------------------------
DROP TABLE IF EXISTS `root_cause_hypotheses`;
CREATE TABLE `root_cause_hypotheses`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `hypothesis_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `hypothesis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'untested',
  `confidence_score` decimal(5, 4) NULL DEFAULT NULL,
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `evidence_summary` json NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_hypothesis`(`incident_id` ASC, `hypothesis_key` ASC) USING BTREE,
  CONSTRAINT `fk_hypotheses_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of root_cause_hypotheses
-- ----------------------------
INSERT INTO `root_cause_hypotheses` VALUES (30007, 1, 'HYP-01', 'Android v2.3 intent callback lifecycle unregister on activity pause', 'supported', 0.9420, 'Android release v2.3 Activity unregisters onActivityResult listener during external UPI app launch, discarding callback payload.', '{\"failed_tests\": 0, \"passed_tests\": 4}', '2026-10-31 08:44:50.158', '2026-10-31 08:44:50.158');
INSERT INTO `root_cause_hypotheses` VALUES (30008, 1, 'HYP-02', 'Payment Gateway partner webhook timeout', 'refuted', 0.1250, 'Partner bank webhook infrastructure delayed by >30s exceeding internal ingress timeout threshold.', '{\"refuted_by\": \"Test T-02 Webhook log audit shows 99.8% 200 OK delivery in <800ms\"}', '2026-10-31 08:44:50.158', '2026-10-31 08:44:50.158');
INSERT INTO `root_cause_hypotheses` VALUES (30009, 1, 'HYP-03', 'Distributed lock deadlocking order reservation', 'refuted', 0.0800, 'Redis distributed lock on checkout cart holding lease beyond connection timeout.', '{\"refuted_by\": \"Test T-03 Redis telemetry showed 0 lock timeouts during incident interval\"}', '2026-10-31 08:44:50.158', '2026-10-31 08:44:50.158');

-- ----------------------------
-- Table structure for signals
-- ----------------------------
DROP TABLE IF EXISTS `signals`;
CREATE TABLE `signals`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `signal_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `category` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'open',
  `triage_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `incident_id` bigint NULL DEFAULT NULL,
  `window_start` datetime(3) NOT NULL,
  `window_end` datetime(3) NOT NULL,
  `baseline_count` decimal(12, 3) NOT NULL DEFAULT 0.000,
  `current_count` int NOT NULL DEFAULT 0,
  `absolute_increase` decimal(12, 3) NOT NULL DEFAULT 0.000,
  `percent_increase` decimal(12, 3) NULL DEFAULT NULL,
  `anomaly_score` decimal(12, 4) NOT NULL DEFAULT 0.0000,
  `severity_score` decimal(6, 4) NOT NULL DEFAULT 0.0000,
  `metrics` json NULL,
  `is_synthetic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_signal_key`(`signal_key` ASC) USING BTREE,
  INDEX `idx_signals_status`(`status` ASC) USING BTREE,
  INDEX `fk_signals_incident`(`incident_id` ASC) USING BTREE,
  CONSTRAINT `fk_signals_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) AUTO_INCREMENT = 60006 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of signals
-- ----------------------------
INSERT INTO `signals` VALUES (30021, 'SIG-UPI-DROP-01', 'payment', 'incident', 'UPI Intent callback timeout spike on Android v2.3', 1, '2026-10-31 07:00:00.000', '2026-10-31 09:00:00.000', 12.000, 156, 144.000, 1200.000, 14.2650, 0.0920, '{\"description\": \"UPI Intent callback timeout spike on Android client release build v2.3\", \"drop_rate\": 0.187, \"order_creation_rate\": 0.043}', 1, '2026-10-31 08:44:48.549', '2026-10-31 08:44:48.549');
INSERT INTO `signals` VALUES (30022, 'SIG-PLAYSTORE-02', 'payment', 'incident', 'Play Store 1-star review surge citing missing orders', 1, '2026-10-31 07:15:00.000', '2026-10-31 09:15:00.000', 5.000, 68, 63.000, 1260.000, 11.4500, 0.0810, '{\"description\": \"Play Store 1-star negative review flood citing debited UPI funds without invoice\", \"keyword_cluster\": [\"money deducted\", \"no order\", \"fraud app\"], \"negative_sentiment_ratio\": 0.82}', 1, '2026-10-31 08:44:48.549', '2026-10-31 08:44:48.549');
INSERT INTO `signals` VALUES (30023, 'SIG-WEATHER-RAIN-03', 'delivery', 'open', 'Delivery rider transit duration SLA breach', 30002, '2026-10-31 06:00:00.000', '2026-10-31 09:00:00.000', 25.000, 342, 317.000, 1268.000, 9.8500, 0.0640, '{\"avg_delay_minutes\": 43.5, \"description\": \"Order dispatch latency exceeding SLA buffer (>35 mins) across South Bengaluru hubs\", \"rider_acceptance_rate\": 0.38}', 1, '2026-10-31 08:44:48.549', '2026-10-31 08:44:48.549');
INSERT INTO `signals` VALUES (30024, 'SIG-CART-ABANDON-04', 'product', 'open', 'Checkout step-2 cart exit rate elevation', NULL, '2026-10-31 07:30:00.000', '2026-10-31 09:30:00.000', 18.000, 94, 76.000, 422.000, 6.7200, 0.0380, '{\"baseline_exit_rate\": 0.08, \"checkout_exit_rate\": 0.22, \"description\": \"Elevated checkout drop-off rate on iOS after shipping address selection\"}', 1, '2026-10-31 08:44:48.549', '2026-10-31 08:44:48.549');
INSERT INTO `signals` VALUES (30025, 'SIG-SEARCH-ZERO-05', 'product', 'watch', 'Zero result search query frequency lift', NULL, '2026-10-31 06:30:00.000', '2026-10-31 09:30:00.000', 30.000, 112, 82.000, 273.000, 5.1200, 0.0290, '{\"description\": \"Zero-result search query rate increased by 28% following catalog indexing update\", \"hit_rate\": 0.61, \"zero_hit_queries\": [\"diwali sweets\", \"organic milk\"]}', 1, '2026-10-31 08:44:48.549', '2026-10-31 08:44:48.549');

-- ----------------------------
-- Table structure for sim_clock
-- ----------------------------
DROP TABLE IF EXISTS `sim_clock`;
CREATE TABLE `sim_clock`  (
  `id` tinyint NOT NULL,
  `sim_now` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of sim_clock
-- ----------------------------
INSERT INTO `sim_clock` VALUES (1, '2026-10-31 07:14:50.777', '2026-10-31 07:14:50.777');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password_hash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `display_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'approver',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_users_email`(`email` ASC) USING BTREE
) AUTO_INCREMENT = 60010 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'approver@recoveriq.demo', '$2b$10$WMJTfTUZ7jFwjq1OFWpoP.JTqDGprZT0QO/ZEXvbjzWlAOqO6H1SS', 'Lead Reliability Engineer', 'approver', '2026-10-31 07:58:08.321');
INSERT INTO `users` VALUES (30001, 'incident.commander@recoveriq.demo', '$2b$10$k0IjJCB2MFlgKYRNHiSILe/ZgwiLReXz.AUWgG/w.8XZN4vQjAVra', 'Incident Commander', 'approver', '2026-10-31 14:02:41.847');
INSERT INTO `users` VALUES (30002, 'operator@recoveriq.demo', '$2b$10$k0IjJCB2MFlgKYRNHiSILe/ZgwiLReXz.AUWgG/w.8XZN4vQjAVra', 'Ops Operator', 'operator', '2026-10-31 14:02:41.847');

SET FOREIGN_KEY_CHECKS = 1;
