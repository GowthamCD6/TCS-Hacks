-- Phase 2: knowledge graph, decision briefs and customer message drafts. Additive only.

CREATE TABLE IF NOT EXISTS kg_nodes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NULL,
  node_type VARCHAR(32) NOT NULL,
  natural_key VARCHAR(190) NOT NULL,
  label VARCHAR(255) NOT NULL,
  props JSON NULL,
  fact_kind VARCHAR(16) NOT NULL,
  source_table VARCHAR(64) NULL,
  source_id VARCHAR(64) NULL,
  confidence DECIMAL(5,4) NULL,
  run_id BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_kg_node (node_type, natural_key),
  KEY idx_kg_nodes_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS kg_edges (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  src_id BIGINT NOT NULL,
  dst_id BIGINT NOT NULL,
  edge_type VARCHAR(32) NOT NULL,
  fact_kind VARCHAR(16) NOT NULL,
  props JSON NULL,
  evidence_ids JSON NULL,
  run_id BIGINT NOT NULL,
  superseded_by BIGINT NULL,
  superseded_at_run BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_kg_edges_incident (incident_id, run_id),
  KEY idx_kg_edges_pair (src_id, dst_id, edge_type),
  CONSTRAINT fk_kg_edges_src FOREIGN KEY (src_id) REFERENCES kg_nodes(id),
  CONSTRAINT fk_kg_edges_dst FOREIGN KEY (dst_id) REFERENCES kg_nodes(id)
);

CREATE TABLE IF NOT EXISTS decision_briefs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  agent_run_id BIGINT NULL,
  brief JSON NOT NULL,
  generator VARCHAR(16) NOT NULL,
  grounding_passed TINYINT(1) NOT NULL DEFAULT 1,
  usefulness_rating TINYINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_briefs_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS customer_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  customer_ref VARCHAR(32) NOT NULL,
  reconcile_state VARCHAR(48) NOT NULL,
  body TEXT NOT NULL,
  generator VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at DATETIME(3) NULL,
  UNIQUE KEY uq_message (incident_id, order_id)
);
