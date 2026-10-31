import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { getPool, closePool, query } from '../src/repositories/db.js';

async function seedDatabase() {
  console.log('--- Seeding TiDB Cloud Database with Real Sample Data ---');
  
  // 1. Seed demo user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await query(
    `INSERT INTO users (email, password_hash, display_name, role) 
     VALUES ('approver@recoveriq.demo', ?, 'Lead Reliability Engineer', 'approver')
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
    [passwordHash]
  );
  console.log('✓ Seeded user: approver@recoveriq.demo');

  // 2. Seed Customers
  const customers = [
    ['CUST-1001', 'Aarav Mehta', 'aarav@example.com', '+919876543210', 'Bengaluru', 'high_value', 'android', 'Android 14', '2.3', '2026-08-10 10:00:00', 1],
    ['CUST-1002', 'Priya Sharma', 'priya@example.com', '+919876543211', 'Mumbai', 'metro', 'android', 'Android 14', '2.3', '2026-07-15 11:30:00', 1],
    ['CUST-1003', 'Rohan Verma', 'rohan@example.com', '+919876543212', 'Delhi', 'regular', 'android', 'Android 14', '2.3', '2026-09-01 14:20:00', 1],
    ['CUST-1004', 'Ananya Iyer', 'ananya@example.com', '+919876543213', 'Chennai', 'high_value', 'ios', 'iOS 18', '2.3', '2026-06-20 09:15:00', 1],
    ['CUST-1005', 'Vikram Joshi', 'vikram@example.com', '+919876543214', 'Hyderabad', 'regular', 'android', 'Android 13', '2.2', '2026-08-25 16:45:00', 1],
  ];
  await query(
    `INSERT IGNORE INTO customers 
     (external_customer_id, name, email, phone, city, customer_segment, platform, device_os, app_version, first_order_at, is_synthetic)
     VALUES ?`,
    [customers]
  );
  console.log(`✓ Seeded ${customers.length} customers`);

  // Fetch customer IDs
  const customerRows = await query('SELECT id, external_customer_id FROM customers WHERE external_customer_id LIKE "CUST-%"');
  const custMap = Object.fromEntries(customerRows.map(c => [c.external_customer_id, c.id]));

  // 3. Seed Feedback
  const feedbackItems = [
    ['mobile_app', 'REV-9821', custMap['CUST-1001'] || null, 'ORD-4810', 'mobile_app', 1, 'My bank debited Rs 3,499 for groceries order via UPI on Android 14. The screen froze at payment verification and no order was generated!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'UPI', amount: 3499, error: 'TIMEOUT_504' }), '2026-10-31 09:42:10', 'analyzed', 1],
    ['support_ticket', 'TICK-9820', custMap['CUST-1002'] || null, 'ORD-4811', 'support_ticket', 1, 'Paid through UPI QR on Android v2.3. HDFC sent SMS that payment of Rs 1,850 succeeded, but app shows empty cart and order failed.', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'UPI_QR', amount: 1850 }), '2026-10-31 09:38:22', 'analyzed', 1],
    ['google_forms', 'FORM-9819', custMap['CUST-1003'] || null, 'ORD-4812', 'google_forms', 1, 'App crashes during biometric UPI PIN confirmation screen. Money Rs 2,400 got deducted from GPay twice without food order!', 'en', 'payment', 'critical', 'high', JSON.stringify({ gateway: 'GPay', amount: 2400 }), '2026-10-31 09:31:05', 'analyzed', 1],
    ['website', 'WEB-9818', custMap['CUST-1004'] || null, 'ORD-5520', 'website', 4, 'Web checkout worked smoothly without issues, but heavy rain in Bengaluru delayed delivery by 25 mins.', 'en', 'delivery', 'neutral', 'low', JSON.stringify({ weather: 'rain' }), '2026-10-31 09:22:45', 'analyzed', 1],
    ['social_media', 'SOC-9817', custMap['CUST-1005'] || null, 'ORD-4419', 'social_media', 1, '@RecoverIQ @Support App charged my UPI account Rs 5,200 for team lunch and no ticket booked! Please refund urgently!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ amount: 5200 }), '2026-10-31 09:15:30', 'analyzed', 1],
  ];
  await query(
    `INSERT IGNORE INTO feedback 
     (source, source_record_id, customer_id, order_id, channel, rating, text, language, category, sentiment, urgency, metadata, event_timestamp, processing_status, is_synthetic)
     VALUES ?`,
    [feedbackItems]
  );
  console.log(`✓ Seeded ${feedbackItems.length} customer feedback records`);

  // 4. Seed Incident (RIQ-2026-0027)
  const incidentNumber = 'RIQ-2026-0027';
  await query(
    `INSERT INTO incidents 
     (incident_number, title, description, issue_category, status, severity, severity_inputs, confidence_score, first_detected_at, last_updated_at, affected_customer_count, estimated_business_impact, root_cause_verdict, resolution_summary, partially_analyzed, is_synthetic, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       title = VALUES(title),
       status = VALUES(status),
       severity = VALUES(severity),
       estimated_business_impact = VALUES(estimated_business_impact),
       affected_customer_count = VALUES(affected_customer_count),
       root_cause_verdict = VALUES(root_cause_verdict)`,
    [
      incidentNumber,
      'Payment failures: UPI money debited without order generation on Android v2.3',
      'App release v2.3 configured an aggressive 8-second client socket timeout on UPI intent callbacks. Backend webhook takes ~9.4s under peak load, leading to stranded debits.',
      'payment',
      'awaiting_approval',
      0.092,
      JSON.stringify({ confidence: 0.95, harm_weight: 1, growth_factor: 3.607, affected_customers_share: 0.02684 }),
      0.95,
      '2026-10-31 08:15:00',
      '2026-10-31 09:45:00',
      156,
      53958.60,
      'Release v2.3 client socket timeout mismatch (8s vs 10s SLA) on Android 14 aborting order creation after UPI debit confirmation.',
      'Feature flag rollback to 30s SLA proposed. Order rehydration pipeline staged for 156 affected transactions.',
      1,
      1,
      JSON.stringify({ window_start: '2026-10-31T07:45:00Z', signal_id: 53, telemetry_available: true, fix_deployed: false })
    ]
  );
  const incRow = await query('SELECT id FROM incidents WHERE incident_number = ?', [incidentNumber]);
  const incidentId = incRow[0].id;
  console.log(`✓ Seeded Incident: ${incidentNumber} (ID: ${incidentId})`);

  // 5. Seed Issue Clusters
  await query(
    `INSERT INTO issue_clusters (incident_id, label, description, cluster_key, feedback_count, severity_score, first_seen_at, last_seen_at, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE feedback_count = VALUES(feedback_count)`,
    [
      incidentId,
      'Android 14 UPI Confirmation Timeout',
      'NLP semantic cluster grouping 148 complaints reporting debit SMS with missing in-app orders',
      'ERR_UPI_TIMEOUT_NO_ORDER_REC',
      148,
      0.0968,
      '2026-10-31 07:49:00',
      '2026-10-31 09:45:00',
      JSON.stringify({ error_code: 'UPI_WEBHOOK_TIMEOUT_504', pScore: 'p < 0.0001' })
    ]
  );

  // 6. Seed Signals
  await query(
    `INSERT INTO signals (signal_key, category, status, triage_reason, incident_id, window_start, window_end, baseline_count, current_count, absolute_increase, percent_increase, anomaly_score, severity_score, is_synthetic)
     VALUES 
     ('SIG-UPI-CAPTURE-01', 'payment', 'incident', 'Spike in UPI captured payments without orders', ?, '2026-10-31 07:00:00', '2026-10-31 09:00:00', 12, 54, 42, 350.0, 14.265, 0.0968, 1),
     ('SIG-WEATHER-RAIN-02', 'delivery', 'explained', 'Heavy monsoon showers causing transit rider delay', NULL, '2026-10-31 06:00:00', '2026-10-31 09:00:00', 16, 99, 83, 518.7, 11.310, 0.0659, 1)
     ON DUPLICATE KEY UPDATE current_count = VALUES(current_count), anomaly_score = VALUES(anomaly_score)`,
    [incidentId]
  );
  console.log('✓ Seeded Signals and Issue Clusters');

  // 7. Seed Hypotheses & Causal Court Tests
  await query(
    `INSERT INTO root_cause_hypotheses (incident_id, hypothesis_key, hypothesis, status, confidence_score, explanation, evidence_summary)
     VALUES 
     (?, 'HYP-01', 'App v2.3 Client Socket Timeout Mismatch on Android 14', 'supported', 0.9600, 'Rollout of v2.3 reduced client timeout to 8s while backend takes 9.4s under lock contention.', ?),
     (?, 'HYP-02', 'Decoy: Monsoon Rain Delivery Transit Delay', 'rejected', 0.0800, 'Weather explains delivery delays across all platforms, but does not cause captured payment order abortion.', ?),
     (?, 'HYP-03', 'Decoy: Menu Price Surcharge Sentiment', 'rejected', 0.0500, 'Guardrail applied: Customer sentiment alone is not root-cause evidence.', ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), confidence_score = VALUES(confidence_score)`,
    [
      incidentId, JSON.stringify({ passed_tests: 5, total_tests: 5 }),
      incidentId, JSON.stringify({ passed_tests: 0, total_tests: 2 }),
      incidentId, JSON.stringify({ passed_tests: 0, total_tests: 1 })
    ]
  );

  const hypRow = await query('SELECT id FROM root_cause_hypotheses WHERE incident_id = ? AND hypothesis_key = "HYP-01"', [incidentId]);
  if (hypRow.length > 0) {
    const hypId = hypRow[0].id;
    await query(
      `INSERT IGNORE INTO investigation_tests (incident_id, hypothesis_id, test_name, status, result, explanation)
       VALUES 
       (?, ?, 'temporal_relationship', 'passed', '{"lag_minutes": 4}', 'Issue onset at 07:49 UTC occurred exactly 4 minutes after v2.3 Play Store release.'),
       (?, ?, 'segment_specificity', 'passed', '{"lift_ratio": 92.0}', '98.4% of captured-without-order complaints originated strictly from Android 14 on v2.3.'),
       (?, ?, 'operational_telemetry', 'passed', '{"latency_ms": 9400, "client_timeout_ms": 8000}', 'APM telemetry confirms client socket cancellation at 8000ms followed by backend HTTP 504 at 9400ms.'),
       (?, ?, 'dose_response', 'passed', '{"correlation": 0.96}', 'Failure rate scaled directly with staged rollout rollout percentage (10% -> 25% -> 50%).'),
       (?, ?, 'counter_check', 'passed', '{"ios_success_rate": 0.986}', 'iOS and Web clients on 30s timeout SLA experienced 98.6% checkout success rate over the same window.')`,
      [incidentId, hypId, incidentId, hypId, incidentId, hypId, incidentId, hypId, incidentId, hypId]
    );
  }

  // 8. Seed Recovery Recommendations & Approvals
  await query(
    `INSERT INTO recovery_recommendations 
     (incident_id, action_key, action_type, title, description, priority, score, estimated_cost, expected_benefit, risk_level, requires_approval, status, rationale)
     VALUES 
     (?, 'disable_feature_flag', 'simulate_feature_flag_change', 'Rollback Feature Flag: ENABLE_UPI_SOCKET_TIMEOUT_V2 to 30s', 'Immediately restores client timeout from 8s back to 30s SLA via remote toggle, preventing premature socket termination.', 1, 0.9500, 0.00, 'Stops 100% of new captured-without-order failures within 90 seconds.', 'low', 1, 'proposed', ?),
     (?, 'batch_order_rehydration', 'simulate_refund', 'Simulate Automated Batch Reconciliation & Order Rehydration', 'Scans payment records for all 156 captured transactions with missing orders and auto-recreates verified orders.', 2, 0.8800, 1500.00, 'Recovers ₹53,958 in captured order value and spares 156 customers from filing manual dispute tickets.', 'medium', 1, 'proposed', ?),
     (?, 'proactive_sms_voucher', 'simulate_coupon', 'Dispatch Proactive Recovery SMS & ₹200 Apology Credit Voucher', 'Proactively contacts affected Android customers with notification explaining the UPI hiccup and offering compensation.', 3, 0.8200, 18000.00, 'Reduces repeat support calls by 85% and protects brand trust.', 'low', 1, 'proposed', ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title)`,
    [
      incidentId, JSON.stringify({ confidence: 0.95, reversibility: 1.0 }),
      incidentId, JSON.stringify({ target_count: 156 }),
      incidentId, JSON.stringify({ target_count: 156 })
    ]
  );

  const recRows = await query('SELECT id FROM recovery_recommendations WHERE incident_id = ? ORDER BY priority ASC', [incidentId]);
  for (const r of recRows) {
    await query(
      `INSERT INTO approvals (incident_id, recommendation_id, requested_by, decision, comments)
       VALUES (?, ?, 'investigator-agent', 'pending', 'Awaiting operator sign-off before simulated execution')
       ON DUPLICATE KEY UPDATE decision = VALUES(decision)`,
      [incidentId, r.id]
    );
  }
  console.log(`✓ Seeded ${recRows.length} Recovery Recommendations & Approvals`);

  // 9. Seed Actions
  if (recRows.length > 0) {
    await query(
      `INSERT IGNORE INTO recovery_actions (incident_id, recommendation_id, action_type, status, target_reference, execution_result, executed_at)
       VALUES 
       (?, ?, 'simulate_feature_flag_change', 'completed', 'ConfigCat Fleet: ENABLE_UPI_SOCKET_TIMEOUT_V2', ?, '2026-10-31 08:35:12')`,
      [incidentId, recRows[0].id, JSON.stringify({ status: 'applied', nodes_updated: 48 })]
    );
  }

  // 10. Seed Segments
  await query(
    `INSERT IGNORE INTO incident_segments (incident_id, dimension, segment_value, affected_customers, total_customers, issue_rate, comparison_rate, lift_ratio, p_value, significant)
     VALUES 
     (?, 'os', 'Android 14 on v2.3', 156, 1720, 0.090698, 0.000980, 92.5489, 0.00001, 1),
     (?, 'gateway', 'UPI Intent & QR', 148, 1950, 0.075897, 0.001200, 63.2475, 0.00010, 1),
     (?, 'platform', 'iOS 18 & Web Clients', 4, 4500, 0.000889, 0.000850, 1.0458, 0.85000, 0)`,
    [incidentId, incidentId, incidentId]
  );
  console.log('✓ Seeded Incident Segments');

  console.log('\n======================================================');
  console.log('🎉 SUCCESS: TiDB Cloud Database has been seeded with full sample data!');
  console.log('======================================================');
}

seedDatabase()
  .catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
