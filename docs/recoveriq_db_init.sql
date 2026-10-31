-- =============================================================================
-- RecoverIQ — Complete Database Initialisation Script
-- Database: tcsmainday  (MySQL 8 / TiDB compatible)
-- All timestamps stored in UTC.
-- Run order: execute this single file top-to-bottom.
--
-- Generated from migrations:
--   001_recoveriq_core.sql
--   002_payment_funnel.sql
--   003_knowledge_graph.sql
--
-- INSTRUCTIONS FOR DB TEAM
-- -------------------------
-- 1. Connect to the target MySQL / TiDB instance.
-- 2. Create the database if it does not exist:
--      CREATE DATABASE IF NOT EXISTS tcsmainday CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--      USE tcsmainday;
-- 3. Run this file:
--      mysql -h <host> -u <user> -p tcsmaindb < recoveriq_db_init.sql
--    or paste into your SQL client.
-- 4. The migration tracker table (recoveriq_migrations) is created first and
--    records each migration block so this script can be re-run safely.
-- 5. Never DROP or RENAME any existing table — all changes are additive.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Migration tracker (idempotent re-run guard)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recoveriq_migrations (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(128) NOT NULL,
  applied_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_migration_name (name)
);

-- =============================================================================
-- MIGRATION 001 — RecoverIQ core schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- customers
-- People who place food-delivery orders. PII fields are nullable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                   BIGINT PRIMARY KEY AUTO_INCREMENT,
  external_customer_id VARCHAR(64)  NOT NULL,
  name                 VARCHAR(120) NULL,
  email                VARCHAR(190) NULL,
  phone                VARCHAR(32)  NULL,
  city                 VARCHAR(64)  NULL,
  customer_segment     VARCHAR(32)  NULL,    -- e.g. 'premium', 'new', 'returning'
  platform             VARCHAR(16)  NULL,    -- 'android' | 'ios' | 'web'
  device_os            VARCHAR(32)  NULL,
  app_version          VARCHAR(16)  NULL,
  first_order_at       DATETIME(3)  NULL,
  is_synthetic         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_customers_external (external_customer_id),
  KEY idx_customers_device (platform, device_os, app_version),
  KEY idx_customers_city   (city)
);

-- ---------------------------------------------------------------------------
-- orders
-- One row per food-delivery order.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               BIGINT       PRIMARY KEY AUTO_INCREMENT,
  external_order_id VARCHAR(64) NOT NULL,
  customer_id      BIGINT       NULL,
  status           VARCHAR(24)  NOT NULL,    -- e.g. 'created', 'cancelled', 'delivered'
  amount           DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method   VARCHAR(24)  NULL,        -- 'upi', 'card', 'cod', etc.
  platform         VARCHAR(16)  NULL,
  device_os        VARCHAR(32)  NULL,
  app_version      VARCHAR(16)  NULL,
  city             VARCHAR(64)  NULL,
  -- Phase-2 payment-funnel enrichment (added by 002_payment_funnel.sql)
  bank             VARCHAR(32)  NULL,
  payment_gateway  VARCHAR(32)  NULL,
  psp_app          VARCHAR(32)  NULL,
  os               VARCHAR(16)  NULL,
  os_version       VARCHAR(16)  NULL,
  device_model     VARCHAR(32)  NULL,
  network_type     VARCHAR(16)  NULL,
  ordered_at       DATETIME(3)  NOT NULL,
  is_synthetic     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_orders_external   (external_order_id),
  KEY idx_orders_time             (ordered_at),
  KEY idx_orders_customer         (customer_id, ordered_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ---------------------------------------------------------------------------
-- feedback
-- Normalised customer feedback from all ingestion sources.
-- (source, source_record_id) is the idempotency key.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
  source            VARCHAR(32)  NOT NULL,   -- 'api', 'csv', 'google_forms', 'play_store', etc.
  source_record_id  VARCHAR(128) NOT NULL,
  customer_id       BIGINT       NULL,
  order_id          VARCHAR(64)  NULL,       -- external reference, no FK (events can arrive before orders)
  channel           VARCHAR(32)  NOT NULL,
  rating            TINYINT      NULL,
  text              TEXT         NOT NULL,
  language          VARCHAR(16)  NOT NULL DEFAULT 'en',
  category          VARCHAR(32)  NULL,       -- set by AI extraction
  sentiment         VARCHAR(16)  NULL,       -- 'positive' | 'neutral' | 'negative'
  urgency           VARCHAR(16)  NULL,       -- 'high' | 'medium' | 'low'
  metadata          JSON         NULL,
  event_timestamp   DATETIME(3)  NOT NULL,
  processing_status VARCHAR(16)  NOT NULL DEFAULT 'pending',  -- 'pending' | 'processed' | 'failed'
  is_synthetic      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_feedback_idempotency (source, source_record_id),
  KEY idx_feedback_time     (event_timestamp),
  KEY idx_feedback_category (category, event_timestamp),
  KEY idx_feedback_status   (processing_status),
  KEY idx_feedback_customer (customer_id),
  CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ---------------------------------------------------------------------------
-- operational_events
-- Payment, order, delivery and telemetry events.
-- order_id has NO foreign key — events can arrive before the order row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operational_events (
  id               BIGINT       PRIMARY KEY AUTO_INCREMENT,
  event_type       VARCHAR(40)  NOT NULL,
  -- Full UPI funnel event types:
  -- order_draft_created | payment_initiated | collect_request_sent
  -- customer_authorised | bank_debit_success | bank_debit_failed | bank_debit_pending
  -- gateway_callback_received | client_confirm_call
  -- order_created | order_create_failed | reversal_initiated | reversal_completed
  -- app_release_deployed | delivery_delayed | etc.
  event_timestamp  DATETIME(3)  NOT NULL,
  customer_id      BIGINT       NULL,
  order_id         VARCHAR(64)  NULL,
  payment_status   VARCHAR(24)  NULL,
  payment_method   VARCHAR(24)  NULL,
  amount           DECIMAL(12,2) NULL,
  platform         VARCHAR(16)  NULL,
  device_os        VARCHAR(32)  NULL,
  app_version      VARCHAR(16)  NULL,
  city             VARCHAR(64)  NULL,
  -- Phase-2 payment-funnel enrichment (added by 002_payment_funnel.sql)
  bank             VARCHAR(32)  NULL,
  payment_gateway  VARCHAR(32)  NULL,
  psp_app          VARCHAR(32)  NULL,
  os               VARCHAR(16)  NULL,
  os_version       VARCHAR(16)  NULL,
  device_model     VARCHAR(32)  NULL,
  network_type     VARCHAR(16)  NULL,
  http_status      SMALLINT     NULL,    -- gateway callback HTTP status
  latency_ms       INT          NULL,    -- gateway callback latency
  error_code       VARCHAR(32)  NULL,
  metadata         JSON         NULL,
  is_synthetic     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_events_type_time (event_type, event_timestamp),
  KEY idx_events_order     (order_id),
  KEY idx_events_time      (event_timestamp),
  CONSTRAINT fk_events_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ---------------------------------------------------------------------------
-- product_releases
-- App / backend release records used for temporal root-cause tests.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_releases (
  id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
  version           VARCHAR(16)  NOT NULL,
  platform          VARCHAR(16)  NOT NULL,
  release_timestamp DATETIME(3)  NOT NULL,
  description       TEXT         NULL,
  changes           JSON         NULL,
  is_synthetic      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_release (version, platform)
);

-- ---------------------------------------------------------------------------
-- incidents
-- Core case record. Lifecycle:
-- detected → investigating → awaiting_approval → approved →
-- executing → monitoring → resolved
-- Also: rejected | escalated | reopened
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
  id                        BIGINT        PRIMARY KEY AUTO_INCREMENT,
  incident_number           VARCHAR(32)   NOT NULL,         -- human-readable, e.g. INC-0001
  title                     VARCHAR(255)  NOT NULL,
  description               TEXT          NULL,
  issue_category            VARCHAR(32)   NOT NULL,
  status                    VARCHAR(24)   NOT NULL DEFAULT 'detected',
  severity                  DECIMAL(6,4)  NULL,
  severity_inputs           JSON          NULL,              -- formula inputs shown in UI
  confidence_score          DECIMAL(5,4)  NULL,
  first_detected_at         DATETIME(3)   NOT NULL,
  last_updated_at           DATETIME(3)   NOT NULL,
  affected_customer_count   INT           NOT NULL DEFAULT 0,
  estimated_business_impact DECIMAL(14,2) NULL,
  root_cause_verdict        TEXT          NULL,
  resolution_summary        TEXT          NULL,
  partially_analyzed        TINYINT(1)    NOT NULL DEFAULT 0,  -- true when LLM was unavailable
  metadata                  JSON          NULL,
  is_synthetic              TINYINT(1)    NOT NULL DEFAULT 0,
  closed_at                 DATETIME(3)   NULL,
  created_at                DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_incident_number (incident_number),
  KEY idx_incidents_status      (status)
);

-- ---------------------------------------------------------------------------
-- signals
-- Emerging issue signals detected before a formal incident is created.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signals (
  id                BIGINT        PRIMARY KEY AUTO_INCREMENT,
  signal_key        VARCHAR(128)  NOT NULL,
  category          VARCHAR(32)   NOT NULL,
  status            VARCHAR(16)   NOT NULL DEFAULT 'open',   -- 'open' | 'dismissed' | 'escalated'
  triage_reason     TEXT          NULL,
  incident_id       BIGINT        NULL,
  window_start      DATETIME(3)   NOT NULL,
  window_end        DATETIME(3)   NOT NULL,
  baseline_count    DECIMAL(12,3) NOT NULL DEFAULT 0,
  current_count     INT           NOT NULL DEFAULT 0,
  absolute_increase DECIMAL(12,3) NOT NULL DEFAULT 0,
  percent_increase  DECIMAL(12,3) NULL,
  anomaly_score     DECIMAL(12,4) NOT NULL DEFAULT 0,
  severity_score    DECIMAL(6,4)  NOT NULL DEFAULT 0,
  metrics           JSON          NULL,
  is_synthetic      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_signal_key   (signal_key),
  KEY idx_signals_status     (status),
  CONSTRAINT fk_signals_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- issue_clusters
-- Semantic clusters of similar feedback records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issue_clusters (
  id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id    BIGINT       NULL,
  label          VARCHAR(255) NOT NULL,
  description    TEXT         NULL,
  cluster_key    VARCHAR(128) NOT NULL,
  feedback_count INT          NOT NULL DEFAULT 0,
  severity_score DECIMAL(6,4) NULL,
  first_seen_at  DATETIME(3)  NULL,
  last_seen_at   DATETIME(3)  NULL,
  metadata       JSON         NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_clusters_incident (incident_id),
  CONSTRAINT fk_clusters_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- incident_segments
-- Per-dimension segment analysis results (lift, significance).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_segments (
  id               BIGINT        PRIMARY KEY AUTO_INCREMENT,
  incident_id      BIGINT        NOT NULL,
  dimension        VARCHAR(64)   NOT NULL,   -- e.g. 'device_os', 'app_version', 'city'
  segment_value    VARCHAR(128)  NOT NULL,
  affected_customers INT         NOT NULL,
  total_customers  INT           NOT NULL,
  issue_rate       DECIMAL(10,6) NOT NULL,
  comparison_rate  DECIMAL(10,6) NOT NULL,
  lift_ratio       DECIMAL(12,4) NULL,
  p_value          DOUBLE        NULL,
  significant      TINYINT(1)    NOT NULL DEFAULT 0,
  limitations      TEXT          NULL,
  created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_segments_incident (incident_id),
  CONSTRAINT fk_segments_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- incident_evidence
-- Traceable evidence items linked to source records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_evidence (
  id                 BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id        BIGINT       NOT NULL,
  evidence_type      VARCHAR(40)  NOT NULL,   -- 'feedback_spike' | 'payment_anomaly' | 'release_event' | etc.
  source_table       VARCHAR(64)  NOT NULL,
  source_record_id   VARCHAR(64)  NULL,
  description        TEXT         NOT NULL,
  evidence_timestamp DATETIME(3)  NULL,
  relevance_score    DECIMAL(5,4) NULL,
  supports_hypothesis VARCHAR(64) NULL,
  metadata           JSON         NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_evidence_incident (incident_id),
  CONSTRAINT fk_evidence_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- root_cause_hypotheses
-- Candidate root-cause explanations for an incident.
-- Status: untested | supported | rejected | inconclusive
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS root_cause_hypotheses (
  id               BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id      BIGINT       NOT NULL,
  hypothesis_key   VARCHAR(64)  NOT NULL,    -- unique within incident, e.g. 'H1_app_v2_3_confirm_bug'
  hypothesis       TEXT         NOT NULL,
  status           VARCHAR(16)  NOT NULL DEFAULT 'untested',
  confidence_score DECIMAL(5,4) NULL,
  explanation      TEXT         NULL,
  evidence_summary JSON         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_hypothesis (incident_id, hypothesis_key),
  CONSTRAINT fk_hypotheses_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- investigation_tests
-- Root Cause Court test results (one row per test per hypothesis).
-- Status: supported | rejected | untested | inconclusive
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investigation_tests (
  id             BIGINT      PRIMARY KEY AUTO_INCREMENT,
  incident_id    BIGINT      NOT NULL,
  hypothesis_id  BIGINT      NOT NULL,
  test_name      VARCHAR(40) NOT NULL,   -- 'temporal' | 'segment_specificity' | 'telemetry' | 'dose_response' | 'counter_check'
  status         VARCHAR(16) NOT NULL,
  result         JSON        NULL,
  explanation    TEXT        NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_test         (hypothesis_id, test_name),
  KEY idx_tests_incident     (incident_id),
  CONSTRAINT fk_tests_incident   FOREIGN KEY (incident_id)   REFERENCES incidents(id),
  CONSTRAINT fk_tests_hypothesis FOREIGN KEY (hypothesis_id) REFERENCES root_cause_hypotheses(id)
);

-- ---------------------------------------------------------------------------
-- recovery_recommendations
-- Ranked intervention options generated by the AI.
-- Status: proposed | approved | rejected | executing | completed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_recommendations (
  id               BIGINT        PRIMARY KEY AUTO_INCREMENT,
  incident_id      BIGINT        NOT NULL,
  action_key       VARCHAR(48)   NOT NULL,
  action_type      VARCHAR(48)   NOT NULL,   -- 'rollback' | 'refund' | 'notify' | 'coupon' | etc.
  title            VARCHAR(255)  NOT NULL,
  description      TEXT          NULL,
  priority         INT           NOT NULL,
  score            DECIMAL(6,4)  NULL,
  estimated_cost   DECIMAL(14,2) NULL,
  expected_benefit TEXT          NULL,
  risk_level       VARCHAR(16)   NOT NULL,   -- 'low' | 'medium' | 'high'
  requires_approval TINYINT(1)   NOT NULL DEFAULT 1,
  status           VARCHAR(20)   NOT NULL DEFAULT 'proposed',
  rationale        JSON          NULL,
  created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_recs_incident (incident_id, status),
  CONSTRAINT fk_recs_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- approvals
-- One approval decision per recommendation.
-- Decision: pending | approved | rejected
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approvals (
  id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id       BIGINT       NOT NULL,
  recommendation_id BIGINT       NOT NULL,
  requested_by      VARCHAR(120) NOT NULL,
  reviewed_by       VARCHAR(120) NULL,
  decision          VARCHAR(16)  NOT NULL DEFAULT 'pending',
  comments          TEXT         NULL,
  reviewed_at       DATETIME(3)  NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_approval_rec   (recommendation_id),
  KEY idx_approvals_decision   (decision),
  CONSTRAINT fk_approvals_incident FOREIGN KEY (incident_id)       REFERENCES incidents(id),
  CONSTRAINT fk_approvals_rec      FOREIGN KEY (recommendation_id) REFERENCES recovery_recommendations(id)
);

-- ---------------------------------------------------------------------------
-- recovery_actions
-- Simulated action executions (never real transactions in the prototype).
-- One action per recommendation (idempotent).
-- Status: pending | running | completed | failed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_actions (
  id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id       BIGINT       NOT NULL,
  recommendation_id BIGINT       NOT NULL,
  action_type       VARCHAR(48)  NOT NULL,
  status            VARCHAR(16)  NOT NULL,
  target_reference  VARCHAR(255) NULL,
  execution_result  JSON         NULL,
  executed_at       DATETIME(3)  NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_action_rec   (recommendation_id),
  KEY idx_actions_incident   (incident_id),
  CONSTRAINT fk_actions_incident FOREIGN KEY (incident_id)       REFERENCES incidents(id),
  CONSTRAINT fk_actions_rec      FOREIGN KEY (recommendation_id) REFERENCES recovery_recommendations(id)
);

-- ---------------------------------------------------------------------------
-- agent_runs
-- Each AI investigation run (orchestrator call).
-- Status: running | completed | failed | partial
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_runs (
  id            BIGINT      PRIMARY KEY AUTO_INCREMENT,
  incident_id   BIGINT      NULL,
  run_type      VARCHAR(24) NOT NULL,   -- 'investigation' | 'reassessment' | 'detection'
  status        VARCHAR(16) NOT NULL,
  input_summary JSON        NULL,
  final_summary JSON        NULL,
  started_at    DATETIME(3) NOT NULL,
  completed_at  DATETIME(3) NULL,
  error_message TEXT        NULL,
  KEY idx_runs_incident (incident_id),
  CONSTRAINT fk_runs_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- agent_steps
-- Every plan step / tool call within an agent run (the jury trace).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_steps (
  id                 BIGINT      PRIMARY KEY AUTO_INCREMENT,
  agent_run_id       BIGINT      NOT NULL,
  step_number        INT         NOT NULL,
  agent_name         VARCHAR(64) NOT NULL,
  tool_name          VARCHAR(64) NULL,
  input_summary      JSON        NULL,
  output_summary     JSON        NULL,
  evidence_references JSON       NULL,
  status             VARCHAR(16) NOT NULL,
  duration_ms        INT         NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_step (agent_run_id, step_number),
  CONSTRAINT fk_steps_run FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id)
);

-- ---------------------------------------------------------------------------
-- incident_reassessments
-- Diffs produced when new evidence is injected and the agent re-investigates.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_reassessments (
  id              BIGINT      PRIMARY KEY AUTO_INCREMENT,
  incident_id     BIGINT      NOT NULL,
  agent_run_id    BIGINT      NULL,
  trigger_summary TEXT        NULL,
  diff            JSON        NOT NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_reassess_incident (incident_id),
  CONSTRAINT fk_reassess_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

-- ---------------------------------------------------------------------------
-- kpi_definitions
-- Measurable recovery targets (e.g. "payment failure rate < 1%").
-- comparison_operator: '<' | '<=' | '>' | '>='
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id                        BIGINT       PRIMARY KEY AUTO_INCREMENT,
  name                      VARCHAR(64)  NOT NULL,
  description               TEXT         NULL,
  unit                      VARCHAR(24)  NOT NULL,
  target_value              DECIMAL(12,4) NOT NULL,
  comparison_operator       VARCHAR(4)   NOT NULL,
  monitoring_window_minutes INT          NOT NULL,
  required_for_resolution   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_kpi_name (name)
);

-- ---------------------------------------------------------------------------
-- kpi_measurements
-- Time-series KPI readings against the simulated clock.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_measurements (
  id                 BIGINT        PRIMARY KEY AUTO_INCREMENT,
  incident_id        BIGINT        NOT NULL,
  kpi_definition_id  BIGINT        NOT NULL,
  measured_value     DECIMAL(12,4) NOT NULL,
  measured_at        DATETIME(3)   NOT NULL,
  metadata           JSON          NULL,
  UNIQUE KEY uq_kpi_point (incident_id, kpi_definition_id, measured_at),
  CONSTRAINT fk_kpi_incident    FOREIGN KEY (incident_id)       REFERENCES incidents(id),
  CONSTRAINT fk_kpi_definition  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id)
);

-- ---------------------------------------------------------------------------
-- ingestion_jobs
-- Tracks CSV / webhook batch ingestion runs.
-- Status: pending | processing | completed | failed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id                BIGINT      PRIMARY KEY AUTO_INCREMENT,
  source            VARCHAR(32) NOT NULL,
  status            VARCHAR(16) NOT NULL DEFAULT 'pending',
  total_records     INT         NOT NULL DEFAULT 0,
  processed_records INT         NOT NULL DEFAULT 0,
  failed_records    INT         NOT NULL DEFAULT 0,
  duplicate_records INT         NOT NULL DEFAULT 0,
  attempts          INT         NOT NULL DEFAULT 0,
  error_summary     JSON        NULL,
  payload           JSON        NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at      DATETIME(3) NULL,
  KEY idx_jobs_status (status, created_at)
);

-- ---------------------------------------------------------------------------
-- audit_logs
-- Immutable audit trail for all state-changing operations.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT      PRIMARY KEY AUTO_INCREMENT,
  actor_type    VARCHAR(16) NOT NULL,    -- 'user' | 'agent' | 'system'
  actor_id      VARCHAR(120) NULL,
  action        VARCHAR(64) NOT NULL,
  resource_type VARCHAR(40) NOT NULL,
  resource_id   VARCHAR(64) NULL,
  details       JSON        NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_resource (resource_type, resource_id)
);

-- ---------------------------------------------------------------------------
-- sim_clock
-- Single-row simulated clock for KPI verification demo.
-- Advance with: POST /api/v1/demo/advance-clock { "minutes": N }
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sim_clock (
  id         TINYINT     PRIMARY KEY,
  sim_now    DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Seed the simulated clock at epoch start (Node will set real time on first advance)
INSERT IGNORE INTO sim_clock (id, sim_now) VALUES (1, UTC_TIMESTAMP(3));

-- ---------------------------------------------------------------------------
-- users
-- Human approvers who review and approve/reject recommendations.
-- Role: 'approver' | 'admin'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  display_name  VARCHAR(120) NOT NULL,
  role          VARCHAR(24)  NOT NULL DEFAULT 'approver',
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email)
);

-- Record migration 001
INSERT IGNORE INTO recoveriq_migrations (name) VALUES ('001_recoveriq_core');

-- =============================================================================
-- MIGRATION 002 — Payment funnel enrichment columns
-- Adds payment-funnel detail columns to operational_events and orders.
-- All ALTER TABLE statements are conditional via IF NOT EXISTS pattern
-- (MySQL 8 does not support IF NOT EXISTS for ADD COLUMN natively, so these
-- will produce a harmless error if re-run; TiDB supports it directly).
-- =============================================================================

-- operational_events — payment funnel attributes
ALTER TABLE operational_events
  ADD COLUMN IF NOT EXISTS bank            VARCHAR(32) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(32) NULL AFTER bank,
  ADD COLUMN IF NOT EXISTS psp_app         VARCHAR(32) NULL AFTER payment_gateway,
  ADD COLUMN IF NOT EXISTS os              VARCHAR(16) NULL AFTER psp_app,
  ADD COLUMN IF NOT EXISTS os_version      VARCHAR(16) NULL AFTER os,
  ADD COLUMN IF NOT EXISTS device_model    VARCHAR(32) NULL AFTER os_version,
  ADD COLUMN IF NOT EXISTS network_type    VARCHAR(16) NULL AFTER device_model,
  ADD COLUMN IF NOT EXISTS http_status     SMALLINT    NULL AFTER network_type,
  ADD COLUMN IF NOT EXISTS latency_ms      INT         NULL AFTER http_status,
  ADD COLUMN IF NOT EXISTS error_code      VARCHAR(32) NULL AFTER latency_ms;

-- orders — payment funnel attributes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS bank            VARCHAR(32) NULL AFTER payment_method,
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(32) NULL AFTER bank,
  ADD COLUMN IF NOT EXISTS psp_app         VARCHAR(32) NULL AFTER payment_gateway,
  ADD COLUMN IF NOT EXISTS os              VARCHAR(16) NULL AFTER psp_app,
  ADD COLUMN IF NOT EXISTS os_version      VARCHAR(16) NULL AFTER os,
  ADD COLUMN IF NOT EXISTS device_model    VARCHAR(32) NULL AFTER os_version,
  ADD COLUMN IF NOT EXISTS network_type    VARCHAR(16) NULL AFTER device_model;

INSERT IGNORE INTO recoveriq_migrations (name) VALUES ('002_payment_funnel');

-- =============================================================================
-- MIGRATION 003 — Knowledge graph, decision briefs, customer message drafts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- kg_nodes
-- Entity nodes in the incident knowledge graph.
-- fact_kind: 'observed' | 'derived' | 'hypothesis' | 'verdict'
-- node_type: bank | gateway | psp_app | app_version | os_version | release |
--            service | funnel_stage | segment | issue_cluster | incident |
--            hypothesis | court_test | recommendation | approval | action | kpi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kg_nodes (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT       NULL,
  node_type   VARCHAR(32)  NOT NULL,
  natural_key VARCHAR(190) NOT NULL,   -- unique stable identifier for this entity
  label       VARCHAR(255) NOT NULL,
  props       JSON         NULL,
  fact_kind   VARCHAR(16)  NOT NULL,
  source_table VARCHAR(64) NULL,
  source_id   VARCHAR(64)  NULL,
  confidence  DECIMAL(5,4) NULL,
  run_id      BIGINT       NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_kg_node         (node_type, natural_key),
  KEY idx_kg_nodes_incident     (incident_id)
);

-- ---------------------------------------------------------------------------
-- kg_edges
-- Directed edges between knowledge graph nodes.
-- superseded_by / superseded_at_run track history across agent re-runs.
-- edges carry aggregates (n, rate, lift, p_value) in props; not one row per tx.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kg_edges (
  id               BIGINT      PRIMARY KEY AUTO_INCREMENT,
  incident_id      BIGINT      NOT NULL,
  src_id           BIGINT      NOT NULL,
  dst_id           BIGINT      NOT NULL,
  edge_type        VARCHAR(32) NOT NULL,
  fact_kind        VARCHAR(16) NOT NULL,
  props            JSON        NULL,
  evidence_ids     JSON        NULL,   -- up to 5 exemplar record IDs
  run_id           BIGINT      NOT NULL,
  superseded_by    BIGINT      NULL,   -- id of the replacement edge
  superseded_at_run BIGINT     NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_kg_edges_incident (incident_id, run_id),
  KEY idx_kg_edges_pair     (src_id, dst_id, edge_type),
  CONSTRAINT fk_kg_edges_src FOREIGN KEY (src_id) REFERENCES kg_nodes(id),
  CONSTRAINT fk_kg_edges_dst FOREIGN KEY (dst_id) REFERENCES kg_nodes(id)
);

-- ---------------------------------------------------------------------------
-- decision_briefs
-- LLM-generated human-readable summaries for the approval inbox.
-- Schema matches the output: headline, what_happened, evidence[], options[], etc.
-- grounding_passed: 1 = every number cited exists in the input JSON.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_briefs (
  id               BIGINT      PRIMARY KEY AUTO_INCREMENT,
  incident_id      BIGINT      NOT NULL,
  agent_run_id     BIGINT      NULL,
  brief            JSON        NOT NULL,
  generator        VARCHAR(16) NOT NULL,   -- 'llm' | 'template'
  grounding_passed TINYINT(1)  NOT NULL DEFAULT 1,
  usefulness_rating TINYINT    NULL,       -- left blank for human to fill in
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_briefs_incident (incident_id)
);

-- ---------------------------------------------------------------------------
-- customer_messages
-- Simulated per-customer recovery messages. Require approval before send.
-- reconcile_state: 'order_created' | 'captured_no_order_pending_reversal' |
--                  'captured_no_order_reversed' | 'captured_no_order_overdue' | 'unknown'
-- status: 'draft' | 'approved' | 'rejected' | 'sent'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_messages (
  id              BIGINT       PRIMARY KEY AUTO_INCREMENT,
  incident_id     BIGINT       NOT NULL,
  order_id        VARCHAR(64)  NOT NULL,
  customer_ref    VARCHAR(32)  NOT NULL,   -- masked/anonymised reference
  reconcile_state VARCHAR(48)  NOT NULL,
  body            TEXT         NOT NULL,
  generator       VARCHAR(16)  NOT NULL,   -- 'llm' | 'template'
  status          VARCHAR(16)  NOT NULL DEFAULT 'draft',
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at         DATETIME(3)  NULL,
  UNIQUE KEY uq_message (incident_id, order_id)
);

INSERT IGNORE INTO recoveriq_migrations (name) VALUES ('003_knowledge_graph');

-- =============================================================================
-- OPTIONAL: Seed default KPI definitions
-- These can also be seeded by the Node backend via npm run seed.
-- =============================================================================
INSERT IGNORE INTO kpi_definitions
  (name, description, unit, target_value, comparison_operator, monitoring_window_minutes, required_for_resolution)
VALUES
  ('payment_failure_rate',       'Percentage of payment attempts that fail',                  'percent',  2.0000, '<',  60,  1),
  ('payment_no_order_rate',      'Percentage of captured payments with no order created',      'percent',  0.5000, '<',  60,  1),
  ('complaint_volume_delta',     'Change in complaint volume vs baseline window',              'percent', 10.0000, '<',  120, 1),
  ('refund_completion_time_p95', '95th-percentile refund completion time (hours)',             'hours',   24.0000, '<=', 120, 0),
  ('affected_customer_contact',  'Percentage of affected customers contacted',                 'percent', 90.0000, '>=', 180, 0),
  ('repeat_complaint_rate',      'Percentage of affected customers submitting repeat feedback','percent',  5.0000, '<',  120, 1);

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
-- Summary of tables created:
--   Sources  : customers, orders, feedback, operational_events, product_releases
--   Case     : signals, incidents, issue_clusters, incident_segments,
--              incident_evidence, incident_reassessments
--   Court    : root_cause_hypotheses, investigation_tests
--   Recovery : recovery_recommendations, approvals, recovery_actions
--   Agent    : agent_runs, agent_steps
--   KPIs     : kpi_definitions, kpi_measurements, sim_clock
--   Platform : ingestion_jobs, audit_logs, users
--   KG       : kg_nodes, kg_edges
--   Comms    : decision_briefs, customer_messages
--   Tracker  : recoveriq_migrations
-- Total: 23 tables
-- =============================================================================

