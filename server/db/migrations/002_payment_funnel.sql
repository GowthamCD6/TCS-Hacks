-- Phase 2: payment funnel attributes. Additive only.

ALTER TABLE operational_events
  ADD COLUMN bank VARCHAR(32) NULL,
  ADD COLUMN payment_gateway VARCHAR(32) NULL,
  ADD COLUMN psp_app VARCHAR(32) NULL,
  ADD COLUMN os VARCHAR(16) NULL,
  ADD COLUMN os_version VARCHAR(16) NULL,
  ADD COLUMN device_model VARCHAR(32) NULL,
  ADD COLUMN network_type VARCHAR(16) NULL,
  ADD COLUMN http_status SMALLINT NULL,
  ADD COLUMN latency_ms INT NULL,
  ADD COLUMN error_code VARCHAR(32) NULL;

ALTER TABLE orders
  ADD COLUMN bank VARCHAR(32) NULL,
  ADD COLUMN payment_gateway VARCHAR(32) NULL,
  ADD COLUMN psp_app VARCHAR(32) NULL,
  ADD COLUMN os VARCHAR(16) NULL,
  ADD COLUMN os_version VARCHAR(16) NULL,
  ADD COLUMN device_model VARCHAR(32) NULL,
  ADD COLUMN network_type VARCHAR(16) NULL;
