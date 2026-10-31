import bcrypt from 'bcryptjs';
import { query, closePool } from '../src/repositories/db.js';

async function seedRichData() {
  console.log('=== Seeding Rich Multi-Page Sample Data into Connected Database ===');

  // 1. Seed demo users
  const passwordHash = await bcrypt.hash('admin123', 10);
  await query(
    `INSERT INTO users (email, password_hash, display_name, role) 
     VALUES 
       ('approver@recoveriq.demo', ?, 'Lead Reliability Engineer', 'approver'),
       ('incident.commander@recoveriq.demo', ?, 'Incident Commander', 'approver'),
       ('operator@recoveriq.demo', ?, 'Ops Operator', 'operator')
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
    [passwordHash, passwordHash, passwordHash]
  );
  console.log('✓ Seeded/Updated 3 demo users');

  // 2. Seed 15 Customers across diverse segments and platforms
  const customers = [
    ['CUST-1001', 'Aarav Mehta', 'aarav@example.com', '+919876543210', 'Bengaluru', 'high_value', 'android', 'Android 14', '2.3', '2026-08-10 10:00:00', 1],
    ['CUST-1002', 'Priya Sharma', 'priya@example.com', '+919876543211', 'Mumbai', 'metro', 'android', 'Android 14', '2.3', '2026-07-15 11:30:00', 1],
    ['CUST-1003', 'Rohan Verma', 'rohan@example.com', '+919876543212', 'Delhi', 'regular', 'android', 'Android 14', '2.3', '2026-09-01 14:20:00', 1],
    ['CUST-1004', 'Ananya Iyer', 'ananya@example.com', '+919876543213', 'Chennai', 'high_value', 'ios', 'iOS 18', '2.3', '2026-06-20 09:15:00', 1],
    ['CUST-1005', 'Vikram Joshi', 'vikram@example.com', '+919876543214', 'Hyderabad', 'regular', 'android', 'Android 13', '2.2', '2026-08-25 16:45:00', 1],
    ['CUST-1006', 'Meera Nambiar', 'meera@example.com', '+919876543215', 'Kochi', 'high_value', 'ios', 'iOS 17.5', '2.3', '2026-05-12 12:00:00', 1],
    ['CUST-1007', 'Karan Singhania', 'karan@example.com', '+919876543216', 'Pune', 'metro', 'android', 'Android 14', '2.3.1', '2026-04-18 18:30:00', 1],
    ['CUST-1008', 'Sneha Kulkarni', 'sneha@example.com', '+919876543217', 'Pune', 'regular', 'web', 'Chrome 128', 'web-app', '2026-03-22 15:10:00', 1],
    ['CUST-1009', 'Aditya Roy', 'aditya@example.com', '+919876543218', 'Kolkata', 'regular', 'android', 'Android 12', '2.1', '2026-02-14 09:40:00', 1],
    ['CUST-1010', 'Deepika Nair', 'deepika@example.com', '+919876543219', 'Thiruvananthapuram', 'high_value', 'ios', 'iOS 18', '2.3', '2026-07-07 14:05:00', 1],
    ['CUST-1011', 'Rahul Deshmukh', 'rahul.d@example.com', '+919876543220', 'Nagpur', 'regular', 'android', 'Android 14', '2.3', '2026-09-12 11:25:00', 1],
    ['CUST-1012', 'Pooja Reddy', 'pooja@example.com', '+919876543221', 'Bengaluru', 'high_value', 'web', 'Safari 18', 'web-app', '2026-08-19 16:15:00', 1],
    ['CUST-1013', 'Sameer Qureshi', 'sameer@example.com', '+919876543222', 'Lucknow', 'metro', 'android', 'Android 13', '2.3', '2026-09-29 13:50:00', 1],
    ['CUST-1014', 'Kavita Patel', 'kavita@example.com', '+919876543223', 'Ahmedabad', 'metro', 'android', 'Android 14', '2.3', '2026-10-01 17:35:00', 1],
    ['CUST-1015', 'Nikhil Gupta', 'nikhil@example.com', '+919876543224', 'Jaipur', 'regular', 'android', 'Android 14', '2.3', '2026-10-05 10:45:00', 1],
  ];
  await query(
    `INSERT IGNORE INTO customers 
     (external_customer_id, name, email, phone, city, customer_segment, platform, device_os, app_version, first_order_at, is_synthetic)
     VALUES ?`,
    [customers]
  );
  console.log(`✓ Seeded ${customers.length} customer records`);

  const custRows = await query('SELECT id, external_customer_id FROM customers');
  const custMap = Object.fromEntries(custRows.map(c => [c.external_customer_id, c.id]));

  // 3. Seed Multiple Incidents
  const incidents = [
    {
      number: 'RIQ-2026-0027',
      title: 'Payment failures: UPI money debited without order generation on Android v2.3',
      description: 'Customers on Android v2.3 experience dropped deep-links upon returning from UPI intent banking apps. Funds are debited from bank account, but checkout callback times out resulting in stranded transactions without order confirmation.',
      category: 'payment',
      status: 'awaiting_approval',
      severity: 0.0920,
      confidence: 0.9420,
      affected: 156,
      impact: 482000.00,
      verdict: 'Deep-link callback unregistering in Android Activity onStop lifecycle in release build v2.3.',
      resolution: 'Rollback timeout flag, force OTA patch v2.3.1, trigger auto-reconciliation refund job, and credit ₹200 voucher.',
    },
    {
      number: 'RIQ-2026-0028',
      title: 'Delivery SLA breach: Peak rain delivery delays across South Bengaluru hubs',
      description: 'Severe weather events causing 45-minute order dispatch delays across Koramangala and HSR Layout delivery hubs. High cancellation velocity before rider pickup.',
      category: 'delivery',
      status: 'mitigating',
      severity: 0.0640,
      confidence: 0.8850,
      affected: 342,
      impact: 184500.00,
      verdict: 'Extreme weather surge and fleet shortfall in southern sector.',
      resolution: 'Dynamic ETA buffer extended to +25 mins and surge radius throttled to prioritize high-value cart fulfillments.',
    },
    {
      number: 'RIQ-2026-0029',
      title: 'Search indexing latency: Fresh catalog price changes delayed by 40 minutes',
      description: 'Elasticsearch read replica sync lag during flash inventory refreshes causing cart price mismatch warnings at checkout stage.',
      category: 'product',
      status: 'investigating',
      severity: 0.0410,
      confidence: 0.7920,
      affected: 89,
      impact: 62000.00,
      verdict: 'Kafka consumer lag on catalog-pricing topic exceeding 12,000 offsets.',
      resolution: 'Scale catalog sync worker deployment to 8 pods and flush intermediate Redis cache.',
    },
    {
      number: 'RIQ-2026-0026',
      title: 'iOS Checkout ApplePay session handshake timeout on iOS 18 beta',
      description: 'Users on iOS 18 beta experienced passkit session token invalidation during multi-factor biometric authentication.',
      category: 'payment',
      status: 'resolved',
      severity: 0.0350,
      confidence: 0.9600,
      affected: 45,
      impact: 78000.00,
      verdict: 'ApplePay token domain verification certificate renewal mismatch.',
      resolution: 'Renewed merchant domain certificate and deployed configuration hotfix.',
    },
  ];

  for (const inc of incidents) {
    await query(
      `INSERT INTO incidents 
       (incident_number, title, description, issue_category, status, severity, confidence_score, first_detected_at, last_updated_at, affected_customer_count, estimated_business_impact, root_cause_verdict, resolution_summary, partially_analyzed, is_synthetic, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL 4 HOUR, NOW(), ?, ?, ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
         title = VALUES(title),
         description = VALUES(description),
         status = VALUES(status),
         severity = VALUES(severity),
         affected_customer_count = VALUES(affected_customer_count),
         estimated_business_impact = VALUES(estimated_business_impact),
         root_cause_verdict = VALUES(root_cause_verdict),
         resolution_summary = VALUES(resolution_summary)`,
      [
        inc.number, inc.title, inc.description, inc.category, inc.status, inc.severity, inc.confidence,
        inc.affected, inc.impact, inc.verdict, inc.resolution,
        JSON.stringify({
          window_start: new Date(Date.now() - 3600000 * 4).toISOString(),
          telemetry_available: true,
          explanation: [
            'Automated root-cause court evaluated 3 competitive causal hypotheses.',
            'Causal test T-01 confirmed 100% reproduction of deep-link drops on Android v2.3 release binary.',
            'Stranded financial exposure quantified at Rs ' + inc.impact.toLocaleString() + ' across ' + inc.affected + ' customers.'
          ]
        })
      ]
    );
  }
  console.log(`✓ Seeded/Updated ${incidents.length} incidents in directory`);

  const incRows = await query('SELECT id, incident_number FROM incidents');
  const incMap = Object.fromEntries(incRows.map(r => [r.incident_number, r.id]));
  const primaryIncId = incMap['RIQ-2026-0027'] || incRows[0]?.id || 1;
  const deliveryIncId = incMap['RIQ-2026-0028'] || primaryIncId;

  // 4. Seed Signals across Anomaly Monitor
  const signals = [
    [
      primaryIncId, 'payment_upi_intent_drop',
      JSON.stringify({ drop_rate: 0.187, order_creation_rate: 0.043, baseline_conversion: 0.94, description: 'UPI Intent callback timeout spike on Android client release build v2.3' }),
      0.0920, 3.450, 156, 'promoted_to_incident', 1
    ],
    [
      primaryIncId, 'playstore_1star_spike_payment',
      JSON.stringify({ negative_sentiment_ratio: 0.82, keyword_cluster: ['money deducted', 'no order', 'fraud app'], description: 'Play Store 1-star negative review flood citing debited UPI funds without invoice' }),
      0.0810, 2.920, 68, 'promoted_to_incident', 1
    ],
    [
      deliveryIncId, 'delivery_dispatch_sla_breach',
      JSON.stringify({ avg_delay_minutes: 43.5, rider_acceptance_rate: 0.38, description: 'Order dispatch latency exceeding SLA buffer (>35 mins) across South Bengaluru hubs' }),
      0.0640, 2.410, 342, 'open', 1
    ],
    [
      null, 'cart_abandonment_surge_ios',
      JSON.stringify({ checkout_exit_rate: 0.22, baseline_exit_rate: 0.08, description: 'Elevated checkout drop-off rate on iOS after shipping address selection' }),
      0.0380, 1.850, 94, 'open', 1
    ],
    [
      null, 'search_zero_results_spike',
      JSON.stringify({ zero_hit_queries: ['diwali sweets', 'organic milk'], hit_rate: 0.61, description: 'Zero-result search query rate increased by 28% following catalog indexing update' }),
      0.0290, 1.520, 112, 'watch', 1
    ],
  ];

  await query('DELETE FROM signals WHERE id > 0');
  await query(
    `INSERT INTO signals (incident_id, category, metrics, severity_score, anomaly_score, current_count, status, is_synthetic) VALUES ?`,
    [signals]
  );
  console.log(`✓ Seeded ${signals.length} real-time signals`);

  // 5. Seed Issue Clusters & Segments
  await query('DELETE FROM issue_clusters WHERE id > 0');
  await query(
    `INSERT INTO issue_clusters (incident_id, label, description, feedback_count, severity_score, first_seen_at, last_seen_at, is_synthetic, metadata)
     VALUES 
       (?, 'UPI Intent Deep-Link Loss on Android v2.3', 'Money debited from user bank, app fails to receive payment confirmation callback on returning from GPay/PhonePe.', 156, 0.092, NOW() - INTERVAL 4 HOUR, NOW(), 1, ?),
       (?, 'Food Delivery Rider ETA Buffer Breach', 'Heavy rainfall causing riders to cancel dispatch; orders delayed beyond acceptable customer threshold.', 342, 0.064, NOW() - INTERVAL 3 HOUR, NOW(), 1, ?)`,
    [
      primaryIncId, JSON.stringify({ segment: 'android_v2.3', error_code: 'INTENT_CALLBACK_TIMEOUT' }),
      deliveryIncId, JSON.stringify({ hub: 'South_BLR', weather: 'heavy_rain' })
    ]
  );

  await query('DELETE FROM incident_segments WHERE id > 0');
  await query(
    `INSERT INTO incident_segments (incident_id, dimension, segment_value, total_population, affected_count, lift_ratio, significant, is_synthetic)
     VALUES
       (?, 'app_version', 'Android v2.3', 14200, 156, 14.80, 1, 1),
       (?, 'device_os', 'Android 14', 28500, 142, 11.20, 1, 1),
       (?, 'payment_gateway', 'UPI_INTENT', 45000, 156, 8.40, 1, 1),
       (?, 'city', 'Bengaluru South', 18900, 342, 6.70, 1, 1)`,
    [primaryIncId, primaryIncId, primaryIncId, deliveryIncId]
  );

  // 6. Seed Root Cause Hypotheses & Tests
  await query('DELETE FROM root_cause_hypotheses WHERE id > 0');
  await query(
    `INSERT INTO root_cause_hypotheses (incident_id, title, description, confidence_score, status, prior_probability, is_synthetic, evidence_summary)
     VALUES
       (?, 'Android v2.3 intent callback lifecycle unregister on activity pause', 'Android release v2.3 Activity unregisters onActivityResult listener during external UPI app launch, discarding callback payload.', 0.942, 'supported', 0.40, 1, ?),
       (?, 'Payment Gateway partner webhook timeout', 'Partner bank webhook infrastructure delayed by >30s exceeding internal ingress timeout threshold.', 0.125, 'refuted', 0.35, 1, ?),
       (?, 'Distributed lock deadlocking order reservation', 'Redis distributed lock on checkout cart holding lease beyond connection timeout.', 0.080, 'refuted', 0.25, 1, ?)`,
    [
      primaryIncId, JSON.stringify({ passed_tests: 4, failed_tests: 0 }),
      primaryIncId, JSON.stringify({ refuted_by: 'Test T-02 Webhook log audit shows 99.8% 200 OK delivery in <800ms' }),
      primaryIncId, JSON.stringify({ refuted_by: 'Test T-03 Redis telemetry showed 0 lock timeouts during incident interval' })
    ]
  );

  // 7. Seed Recovery Recommendations & Approvals
  await query('DELETE FROM recovery_recommendations WHERE id > 0');
  await query('DELETE FROM approvals WHERE id > 0');

  const recs = [
    {
      title: 'Rollback Feature Flag: ENABLE_UPI_SOCKET_TIMEOUT_V2 to 30s',
      key: 'disable_feature_flag',
      type: 'simulate_feature_flag_change',
      risk: 'low',
      cost: 0.00,
      benefit: 'Immediate drop in intent callback drops (<1%) within 60 seconds.',
      priority: 1,
      target: 'FeatureFlag:ENABLE_UPI_SOCKET_TIMEOUT_V2',
      rationale: { confidence: 0.95, reversibility: 1.0, impact_hours: 4 },
      time: 2,
    },
    {
      title: 'Simulate Automated Batch Reconciliation & Order Rehydration',
      key: 'batch_order_rehydration',
      type: 'simulate_refund',
      risk: 'medium',
      cost: 1500.00,
      benefit: 'Reconcile 156 stranded debits with partner bank and auto-generate confirmed orders without charging again.',
      priority: 2,
      target: 'BatchJob:reconcile_upi_intent_failures',
      rationale: { target_count: 156, total_amount: 482000 },
      time: 15,
    },
    {
      title: 'Dispatch Proactive Recovery SMS & ₹200 Apology Credit Voucher',
      key: 'proactive_sms_voucher',
      type: 'simulate_coupon',
      risk: 'low',
      cost: 31200.00,
      benefit: 'Prevent churn and rebuild trust by issuing instant ₹200 credits to all 156 impacted users.',
      priority: 3,
      target: 'Campaign:cx_recovery_upi_v2_3',
      rationale: { target_count: 156, voucher_amount: 200 },
      time: 5,
    },
    {
      title: 'Extend Delivery SLA Window by +25 Mins Across South Hubs',
      key: 'adjust_delivery_sla',
      type: 'simulate_sla_adjustment',
      risk: 'low',
      cost: 0.00,
      benefit: 'Calibrate consumer expectations during rain storm; drop customer cancellation rate by 60%.',
      priority: 1,
      target: 'Hubs:Koramangala,HSR',
      rationale: { rain_severity: 'high', affected_riders: 85 },
      time: 3,
    },
  ];

  for (const r of recs) {
    const incId = r.key === 'adjust_delivery_sla' ? deliveryIncId : primaryIncId;
    const [result] = await query(
      `INSERT INTO recovery_recommendations 
       (incident_id, title, action_key, action_type, risk_level, estimated_cost, rationale, priority, requires_approval, status, target_reference, is_synthetic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?, 1)`,
      [incId, r.title, r.key, r.type, r.risk, r.cost, JSON.stringify(r.rationale), r.priority, r.target]
    );

    await query(
      `INSERT INTO approvals 
       (incident_id, recommendation_id, requested_by, decision, comments, created_at)
       VALUES (?, ?, 'investigator-agent', 'pending', ?, NOW())`,
      [incId, result.insertId, r.benefit]
    );
  }
  console.log(`✓ Seeded 4 recovery recommendations and approvals`);

  // 8. Seed Recovery Actions (Executed history)
  await query('DELETE FROM recovery_actions WHERE id > 0');
  await query(
    `INSERT INTO recovery_actions 
       (incident_id, recommendation_id, action_type, target_reference, execution_result, status, executed_at, is_synthetic)
     VALUES
       (?, 1, 'simulate_feature_flag_change', 'FeatureFlag:ENABLE_UPI_SOCKET_TIMEOUT_V2', ?, 'succeeded', NOW() - INTERVAL 45 MINUTE, 1),
       (?, 2, 'simulate_refund', 'BatchJob:reconcile_upi_intent_failures', ?, 'succeeded', NOW() - INTERVAL 20 MINUTE, 1)`,
    [
      primaryIncId, JSON.stringify({ flag: 'ENABLE_UPI_SOCKET_TIMEOUT_V2', previous: '60s', updated: '30s', response_code: 200 }),
      primaryIncId, JSON.stringify({ batch_id: 'BATCH-REC-20261031-01', total_reconciled: 156, restored_orders: 156, total_amount: 482000 })
    ]
  );
  console.log(`✓ Seeded 2 executed recovery actions`);

  // 9. Seed 15 Diverse Customer Feedback records
  const feedbackItems = [
    ['mobile_app', 'REV-9821', custMap['CUST-1001'] || null, 'ORD-4810', 'mobile_app', 1, 'My bank debited Rs 3,499 for groceries order via UPI on Android 14. The screen froze at payment verification and no order was generated!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'UPI', amount: 3499, error: 'TIMEOUT_504' }), '2026-10-31 09:42:10', 'analyzed', 1],
    ['support_ticket', 'TICK-9820', custMap['CUST-1002'] || null, 'ORD-4811', 'support_ticket', 1, 'Paid through UPI QR on Android v2.3. HDFC sent SMS that payment of Rs 1,850 succeeded, but app shows empty cart and order failed.', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'UPI_QR', amount: 1850 }), '2026-10-31 09:38:22', 'analyzed', 1],
    ['google_forms', 'FORM-9819', custMap['CUST-1003'] || null, 'ORD-4812', 'google_forms', 1, 'App crashes during biometric UPI PIN confirmation screen. Money Rs 2,400 got deducted from GPay twice without food order!', 'en', 'payment', 'critical', 'high', JSON.stringify({ gateway: 'GPay', amount: 2400 }), '2026-10-31 09:31:05', 'analyzed', 1],
    ['website', 'WEB-9818', custMap['CUST-1004'] || null, 'ORD-5520', 'website', 4, 'Web checkout worked smoothly without issues, but heavy rain in Bengaluru delayed delivery by 25 mins.', 'en', 'delivery', 'neutral', 'low', JSON.stringify({ weather: 'rain' }), '2026-10-31 09:22:45', 'analyzed', 1],
    ['social_media', 'SOC-9817', custMap['CUST-1005'] || null, 'ORD-4419', 'social_media', 1, '@RecoverIQ @Support App charged my UPI account Rs 5,200 for team lunch and no ticket booked! Please refund urgently!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ amount: 5200 }), '2026-10-31 09:15:30', 'analyzed', 1],
    ['mobile_app', 'REV-9816', custMap['CUST-1006'] || null, 'ORD-4813', 'mobile_app', 5, 'Super prompt delivery and loved the fresh produce quality. The packaging was eco-friendly and neat.', 'en', 'general', 'positive', 'low', JSON.stringify({ rating: 5 }), '2026-10-31 09:10:00', 'analyzed', 1],
    ['support_ticket', 'TICK-9815', custMap['CUST-1007'] || null, 'ORD-4814', 'support_ticket', 1, 'Delivery boy got stuck in Koramangala waterlogging. Order is delayed by 55 mins and ice cream melted completely.', 'en', 'delivery', 'negative', 'high', JSON.stringify({ delay_mins: 55 }), '2026-10-31 09:05:15', 'analyzed', 1],
    ['website', 'WEB-9814', custMap['CUST-1008'] || null, 'ORD-4815', 'website', 5, 'Clean website interface, quick coupon apply, and immediate order placement. Great job engineering team!', 'en', 'general', 'positive', 'low', JSON.stringify({ platform: 'desktop_chrome' }), '2026-10-31 08:58:30', 'analyzed', 1],
    ['mobile_app', 'REV-9813', custMap['CUST-1009'] || null, 'ORD-4816', 'mobile_app', 2, 'Search takes forever to load Diwali gift hampers and shows zero results even though item is in stock in store.', 'en', 'product', 'negative', 'medium', JSON.stringify({ query: 'diwali hampers' }), '2026-10-31 08:52:10', 'analyzed', 1],
    ['google_forms', 'FORM-9812', custMap['CUST-1010'] || null, 'ORD-4817', 'google_forms', 5, 'ApplePay checkout on iOS was buttery smooth! Delivered in 14 minutes flat in Trivandrum.', 'en', 'general', 'positive', 'low', JSON.stringify({ payment: 'applepay' }), '2026-10-31 08:44:00', 'analyzed', 1],
    ['mobile_app', 'REV-9811', custMap['CUST-1011'] || null, 'ORD-4818', 'mobile_app', 1, 'PhonePe debited Rs 980 for breakfast order. Phone returned to merchant screen saying session expired! Money lost!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'PhonePe', amount: 980 }), '2026-10-31 08:35:20', 'analyzed', 1],
    ['support_ticket', 'TICK-9810', custMap['CUST-1012'] || null, 'ORD-4819', 'support_ticket', 4, 'Invoice PDF downloaded from website did not have GSTIN clearly visible. Please re-email the bill copy.', 'en', 'billing', 'neutral', 'low', JSON.stringify({ document: 'invoice' }), '2026-10-31 08:29:40', 'analyzed', 1],
    ['social_media', 'SOC-9809', custMap['CUST-1013'] || null, 'ORD-4820', 'social_media', 1, 'Terrible checkout glitch on Android app. Double charged for order ORD-4820. Fix your UPI payment gateway!', 'en', 'payment', 'critical', 'critical', JSON.stringify({ double_charged: true }), '2026-10-31 08:20:15', 'analyzed', 1],
    ['website', 'WEB-9808', custMap['CUST-1014'] || null, 'ORD-4821', 'website', 5, 'Customer support resolved my address change within 2 minutes on chat. Excellent customer service!', 'en', 'support', 'positive', 'low', JSON.stringify({ agent: 'support_ai' }), '2026-10-31 08:12:00', 'analyzed', 1],
    ['mobile_app', 'REV-9807', custMap['CUST-1015'] || null, 'ORD-4822', 'mobile_app', 1, 'Cred UPI transaction completed and money deducted from ICICI account, but cart remains in checkout step.', 'en', 'payment', 'critical', 'critical', JSON.stringify({ gateway: 'CRED_UPI', amount: 1640 }), '2026-10-31 08:05:00', 'analyzed', 1],
  ];

  await query('DELETE FROM feedback WHERE id > 0');
  await query(
    `INSERT INTO feedback 
     (source, source_record_id, customer_id, order_id, channel, rating, text, language, category, sentiment, urgency, metadata, event_timestamp, processing_status, is_synthetic)
     VALUES ?`,
    [feedbackItems]
  );
  console.log(`✓ Seeded ${feedbackItems.length} diverse feedback & execution log records`);

  console.log('======================================================');
  console.log('🎉 RICH MULTI-PAGE DATA SEEDED SUCCESSFULLY!');
  console.log('======================================================');
}

seedRichData()
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
    process.exit(0);
  });
