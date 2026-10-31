-- Phase 3: product domain. Additive only; existing rows default to payments.

ALTER TABLE incidents ADD COLUMN domain VARCHAR(16) NOT NULL DEFAULT 'payments';
ALTER TABLE signals ADD COLUMN domain VARCHAR(16) NOT NULL DEFAULT 'payments';
ALTER TABLE feedback ADD COLUMN domain VARCHAR(16) NOT NULL DEFAULT 'payments';
ALTER TABLE kpi_definitions ADD COLUMN domain VARCHAR(16) NOT NULL DEFAULT 'payments';

CREATE TABLE IF NOT EXISTS product_batches (
  batch_id VARCHAR(16) PRIMARY KEY,
  supplier VARCHAR(16) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  units_produced INT NOT NULL,
  units_sold INT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_orders (
  order_id VARCHAR(16) PRIMARY KEY,
  batch_id VARCHAR(16) NOT NULL,
  supplier VARCHAR(16) NOT NULL,
  city VARCHAR(64) NOT NULL,
  order_date DATETIME(3) NOT NULL,
  delivery_date DATETIME(3) NOT NULL,
  buyer_type VARCHAR(16) NOT NULL,
  campaign_id VARCHAR(16) NULL,
  firmware VARCHAR(16) NOT NULL,
  courier_incident VARCHAR(32) NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_returns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(16) NOT NULL,
  reason_code VARCHAR(32) NOT NULL,
  returned_at DATETIME(3) NOT NULL,
  KEY idx_product_returns_order (order_id)
);

CREATE TABLE IF NOT EXISTS product_tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(16) NOT NULL,
  topic VARCHAR(32) NOT NULL,
  text VARCHAR(255) NOT NULL,
  opened_at DATETIME(3) NOT NULL,
  KEY idx_product_tickets_order (order_id)
);

CREATE TABLE IF NOT EXISTS product_firmware_releases (
  version VARCHAR(16) PRIMARY KEY,
  released_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_campaigns (
  campaign_id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_courier_incidents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_ref VARCHAR(32) NOT NULL,
  city VARCHAR(64) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NOT NULL
);
