-- RecoverIQ core schema. Additive only: never drops or renames anything.
-- Compatible with MySQL 8 and TiDB. All timestamps are stored in UTC.

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  external_customer_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(32) NULL,
  city VARCHAR(64) NULL,
  customer_segment VARCHAR(32) NULL,
  platform VARCHAR(16) NULL,
  device_os VARCHAR(32) NULL,
  app_version VARCHAR(16) NULL,
  first_order_at DATETIME(3) NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_customers_external (external_customer_id),
  KEY idx_customers_device (platform, device_os, app_version),
  KEY idx_customers_city (city)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  external_order_id VARCHAR(64) NOT NULL,
  customer_id BIGINT NULL,
  status VARCHAR(24) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(24) NULL,
  platform VARCHAR(16) NULL,
  device_os VARCHAR(32) NULL,
  app_version VARCHAR(16) NULL,
  city VARCHAR(64) NULL,
  ordered_at DATETIME(3) NOT NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_orders_external (external_order_id),
  KEY idx_orders_time (ordered_at),
  KEY idx_orders_customer (customer_id, ordered_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(32) NOT NULL,
  source_record_id VARCHAR(128) NOT NULL,
  customer_id BIGINT NULL,
  order_id VARCHAR(64) NULL,
  channel VARCHAR(32) NOT NULL,
  rating TINYINT NULL,
  text TEXT NOT NULL,
  language VARCHAR(16) NOT NULL DEFAULT 'en',
  category VARCHAR(32) NULL,
  sentiment VARCHAR(16) NULL,
  urgency VARCHAR(16) NULL,
  metadata JSON NULL,
  event_timestamp DATETIME(3) NOT NULL,
  processing_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_feedback_idempotency (source, source_record_id),
  KEY idx_feedback_time (event_timestamp),
  KEY idx_feedback_category (category, event_timestamp),
  KEY idx_feedback_status (processing_status),
  KEY idx_feedback_customer (customer_id),
  CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS operational_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(40) NOT NULL,
  event_timestamp DATETIME(3) NOT NULL,
  customer_id BIGINT NULL,
  order_id VARCHAR(64) NULL,
  payment_status VARCHAR(24) NULL,
  payment_method VARCHAR(24) NULL,
  amount DECIMAL(12,2) NULL,
  platform VARCHAR(16) NULL,
  device_os VARCHAR(32) NULL,
  app_version VARCHAR(16) NULL,
  city VARCHAR(64) NULL,
  metadata JSON NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_events_type_time (event_type, event_timestamp),
  KEY idx_events_order (order_id),
  KEY idx_events_time (event_timestamp),
  CONSTRAINT fk_events_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS product_releases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(16) NOT NULL,
  platform VARCHAR(16) NOT NULL,
  release_timestamp DATETIME(3) NOT NULL,
  description TEXT NULL,
  changes JSON NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_release (version, platform)
);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_number VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  issue_category VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'detected',
  severity DECIMAL(6,4) NULL,
  severity_inputs JSON NULL,
  confidence_score DECIMAL(5,4) NULL,
  first_detected_at DATETIME(3) NOT NULL,
  last_updated_at DATETIME(3) NOT NULL,
  affected_customer_count INT NOT NULL DEFAULT 0,
  estimated_business_impact DECIMAL(14,2) NULL,
  root_cause_verdict TEXT NULL,
  resolution_summary TEXT NULL,
  partially_analyzed TINYINT(1) NOT NULL DEFAULT 0,
  metadata JSON NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  closed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_incident_number (incident_number),
  KEY idx_incidents_status (status)
);

CREATE TABLE IF NOT EXISTS signals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  signal_key VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  triage_reason TEXT NULL,
  incident_id BIGINT NULL,
  window_start DATETIME(3) NOT NULL,
  window_end DATETIME(3) NOT NULL,
  baseline_count DECIMAL(12,3) NOT NULL DEFAULT 0,
  current_count INT NOT NULL DEFAULT 0,
  absolute_increase DECIMAL(12,3) NOT NULL DEFAULT 0,
  percent_increase DECIMAL(12,3) NULL,
  anomaly_score DECIMAL(12,4) NOT NULL DEFAULT 0,
  severity_score DECIMAL(6,4) NOT NULL DEFAULT 0,
  metrics JSON NULL,
  is_synthetic TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_signal_key (signal_key),
  KEY idx_signals_status (status),
  CONSTRAINT fk_signals_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS issue_clusters (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  cluster_key VARCHAR(128) NOT NULL,
  feedback_count INT NOT NULL DEFAULT 0,
  severity_score DECIMAL(6,4) NULL,
  first_seen_at DATETIME(3) NULL,
  last_seen_at DATETIME(3) NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_clusters_incident (incident_id),
  CONSTRAINT fk_clusters_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS incident_segments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  dimension VARCHAR(64) NOT NULL,
  segment_value VARCHAR(128) NOT NULL,
  affected_customers INT NOT NULL,
  total_customers INT NOT NULL,
  issue_rate DECIMAL(10,6) NOT NULL,
  comparison_rate DECIMAL(10,6) NOT NULL,
  lift_ratio DECIMAL(12,4) NULL,
  p_value DOUBLE NULL,
  significant TINYINT(1) NOT NULL DEFAULT 0,
  limitations TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_segments_incident (incident_id),
  CONSTRAINT fk_segments_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS incident_evidence (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  evidence_type VARCHAR(40) NOT NULL,
  source_table VARCHAR(64) NOT NULL,
  source_record_id VARCHAR(64) NULL,
  description TEXT NOT NULL,
  evidence_timestamp DATETIME(3) NULL,
  relevance_score DECIMAL(5,4) NULL,
  supports_hypothesis VARCHAR(64) NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_evidence_incident (incident_id),
  CONSTRAINT fk_evidence_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS root_cause_hypotheses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  hypothesis_key VARCHAR(64) NOT NULL,
  hypothesis TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'untested',
  confidence_score DECIMAL(5,4) NULL,
  explanation TEXT NULL,
  evidence_summary JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_hypothesis (incident_id, hypothesis_key),
  CONSTRAINT fk_hypotheses_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS investigation_tests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  hypothesis_id BIGINT NOT NULL,
  test_name VARCHAR(40) NOT NULL,
  status VARCHAR(16) NOT NULL,
  result JSON NULL,
  explanation TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_test (hypothesis_id, test_name),
  KEY idx_tests_incident (incident_id),
  CONSTRAINT fk_tests_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_tests_hypothesis FOREIGN KEY (hypothesis_id) REFERENCES root_cause_hypotheses(id)
);

CREATE TABLE IF NOT EXISTS recovery_recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  action_key VARCHAR(48) NOT NULL,
  action_type VARCHAR(48) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  priority INT NOT NULL,
  score DECIMAL(6,4) NULL,
  estimated_cost DECIMAL(14,2) NULL,
  expected_benefit TEXT NULL,
  risk_level VARCHAR(16) NOT NULL,
  requires_approval TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'proposed',
  rationale JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_recs_incident (incident_id, status),
  CONSTRAINT fk_recs_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  recommendation_id BIGINT NOT NULL,
  requested_by VARCHAR(120) NOT NULL,
  reviewed_by VARCHAR(120) NULL,
  decision VARCHAR(16) NOT NULL DEFAULT 'pending',
  comments TEXT NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_approval_rec (recommendation_id),
  KEY idx_approvals_decision (decision),
  CONSTRAINT fk_approvals_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_approvals_rec FOREIGN KEY (recommendation_id) REFERENCES recovery_recommendations(id)
);

CREATE TABLE IF NOT EXISTS recovery_actions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  recommendation_id BIGINT NOT NULL,
  action_type VARCHAR(48) NOT NULL,
  status VARCHAR(16) NOT NULL,
  target_reference VARCHAR(255) NULL,
  execution_result JSON NULL,
  executed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_action_rec (recommendation_id),
  KEY idx_actions_incident (incident_id),
  CONSTRAINT fk_actions_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_actions_rec FOREIGN KEY (recommendation_id) REFERENCES recovery_recommendations(id)
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NULL,
  run_type VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL,
  input_summary JSON NULL,
  final_summary JSON NULL,
  started_at DATETIME(3) NOT NULL,
  completed_at DATETIME(3) NULL,
  error_message TEXT NULL,
  KEY idx_runs_incident (incident_id),
  CONSTRAINT fk_runs_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS agent_steps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  agent_run_id BIGINT NOT NULL,
  step_number INT NOT NULL,
  agent_name VARCHAR(64) NOT NULL,
  tool_name VARCHAR(64) NULL,
  input_summary JSON NULL,
  output_summary JSON NULL,
  evidence_references JSON NULL,
  status VARCHAR(16) NOT NULL,
  duration_ms INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_step (agent_run_id, step_number),
  CONSTRAINT fk_steps_run FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id)
);

CREATE TABLE IF NOT EXISTS incident_reassessments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  agent_run_id BIGINT NULL,
  trigger_summary TEXT NULL,
  diff JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_reassess_incident (incident_id),
  CONSTRAINT fk_reassess_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description TEXT NULL,
  unit VARCHAR(24) NOT NULL,
  target_value DECIMAL(12,4) NOT NULL,
  comparison_operator VARCHAR(4) NOT NULL,
  monitoring_window_minutes INT NOT NULL,
  required_for_resolution TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_kpi_name (name)
);

CREATE TABLE IF NOT EXISTS kpi_measurements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  kpi_definition_id BIGINT NOT NULL,
  measured_value DECIMAL(12,4) NOT NULL,
  measured_at DATETIME(3) NOT NULL,
  metadata JSON NULL,
  UNIQUE KEY uq_kpi_point (incident_id, kpi_definition_id, measured_at),
  CONSTRAINT fk_kpi_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_kpi_definition FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id)
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  total_records INT NOT NULL DEFAULT 0,
  processed_records INT NOT NULL DEFAULT 0,
  failed_records INT NOT NULL DEFAULT 0,
  duplicate_records INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  error_summary JSON NULL,
  payload JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  KEY idx_jobs_status (status, created_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_type VARCHAR(16) NOT NULL,
  actor_id VARCHAR(120) NULL,
  action VARCHAR(64) NOT NULL,
  resource_type VARCHAR(40) NOT NULL,
  resource_id VARCHAR(64) NULL,
  details JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_resource (resource_type, resource_id)
);

CREATE TABLE IF NOT EXISTS sim_clock (
  id TINYINT PRIMARY KEY,
  sim_now DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'approver',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email)
);
