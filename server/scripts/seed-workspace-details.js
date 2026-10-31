import { query, closePool } from '../src/repositories/db.js';

async function seedWorkspaceDetails() {
  console.log('--- Seeding Incident Workspace Details (Court, Tests, Evidence, Impact, Trace) ---');

  const incRow = await query('SELECT id FROM incidents WHERE id = 1 OR incident_number = "RIQ-2026-0027" LIMIT 1');
  const incidentId = incRow[0]?.id || 1;

  // 1. Hypotheses & Tests
  const hyps = await query('SELECT id, hypothesis_key FROM root_cause_hypotheses WHERE incident_id = ?', [incidentId]);
  const hypMap = Object.fromEntries(hyps.map(h => [h.hypothesis_key, h.id]));
  const primaryHypId = hypMap['HYP-01'] || hyps[0]?.id;
  const partnerHypId = hypMap['HYP-02'] || hyps[1]?.id;

  await query('DELETE FROM investigation_tests WHERE incident_id = ?', [incidentId]);
  if (primaryHypId) {
    await query(
      `INSERT INTO investigation_tests (incident_id, hypothesis_id, test_name, status, result, explanation)
       VALUES
       (?, ?, 'T-01: Lifecycle Drop Trace', 'passed', ?, 'Confirmed 100% reproduction of intent callback dropped during external UPI redirect.'),
       (?, ?, 'T-02: Socket Timeout Inspection', 'passed', ?, 'v2.3 client configured 8s timeout whereas 99th percentile backend webhook takes 9.4s under load.'),
       (?, ?, 'T-03: Telemetry Error Correlation', 'passed', ?, 'p < 0.0001 correlation with Android 14 release v2.3 binary SHA signature.')`,
      [
        incidentId, primaryHypId, JSON.stringify({ passed: true, score: 0.98, sample_size: 156 }),
        incidentId, primaryHypId, JSON.stringify({ passed: true, client_timeout: '8s', backend_p99: '9.4s' }),
        incidentId, primaryHypId, JSON.stringify({ passed: true, p_value: 0.0001, lift: 14.8 })
      ]
    );
  }
  if (partnerHypId) {
    await query(
      `INSERT INTO investigation_tests (incident_id, hypothesis_id, test_name, status, result, explanation)
       VALUES
       (?, ?, 'T-04: Partner Gateway Audit', 'failed', ?, 'Refuted: Bank gateway returned 200 OK within 800ms for 99.8% of synthetic probes.')`,
      [incidentId, partnerHypId, JSON.stringify({ passed: false, gateway_health: '99.8% OK' })]
    );
  }
  console.log('✓ Seeded investigation tests');

  // 2. Incident Evidence
  await query('DELETE FROM incident_evidence WHERE incident_id = ?', [incidentId]);
  await query(
    `INSERT INTO incident_evidence 
     (incident_id, evidence_type, source_table, source_record_id, description, evidence_timestamp, relevance_score, supports_hypothesis, metadata)
     VALUES
     (?, 'telemetry_log', 'operational_events', 'EVT-90412', 'Payment gateway intent socket timeout aborted order pipeline with HTTP 504', NOW() - INTERVAL 3 HOUR, 0.980, 1, ?),
     (?, 'customer_feedback', 'feedback', 'REV-9821', 'Aarav Mehta: Bank debited Rs 3,499 via UPI on Android 14, screen froze with no order confirmation', NOW() - INTERVAL 2 HOUR, 0.960, 1, ?),
     (?, 'release_commit', 'git_log', 'COMMIT-8812a', 'PR #418: Reduced IntentClient timeout from 30s to 8s in v2.3 release build', NOW() - INTERVAL 12 HOUR, 0.940, 1, ?),
     (?, 'network_trace', 'ingress_gateway', 'TRACE-7719', 'Partner bank callback succeeded in 9.2s after client connection socket closed at 8.0s', NOW() - INTERVAL 2 HOUR, 0.990, 1, ?)`,
    [
      incidentId, JSON.stringify({ subsystem: 'upi-gateway', latency_ms: 8002 }),
      incidentId, JSON.stringify({ customer_id: 'CUST-1001', sentiment: 'critical' }),
      incidentId, JSON.stringify({ pr_number: 418, author: 'release-bot' }),
      incidentId, JSON.stringify({ bank_ack: 200, client_ack: 'ECONNABORTED' })
    ]
  );
  console.log('✓ Seeded incident evidence');

  // 3. Agent Trace (Runs and Steps)
  await query('DELETE FROM agent_steps WHERE agent_run_id IN (SELECT id FROM agent_runs WHERE incident_id = ?)', [incidentId]);
  await query('DELETE FROM agent_runs WHERE incident_id = ?', [incidentId]);

  const runResult = await query(
    `INSERT INTO agent_runs (incident_id, run_type, status, input_summary, final_summary, started_at, completed_at)
     VALUES (?, 'investigation', 'completed', ?, ?, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR)`,
    [
      incidentId,
      JSON.stringify({ signal_id: 'SIG-UPI-DROP-01', anomaly_score: 14.26, trigger: 'PlayStore + Telemetry Anomaly' }),
      JSON.stringify({
        root_cause: 'Android v2.3 release socket timeout mismatch (8s vs 9.4s backend p99)',
        action_plan: 'Rollback feature flag, dispatch refund batch, and credit ₹200 apology vouchers.'
      })
    ]
  );
  const runId = runResult.insertId;

  const steps = [
    [runId, 1, 'SignalDetectionAgent', 'anomaly_detector', JSON.stringify({ metric: 'upi_intent_drop_rate' }), JSON.stringify({ anomaly_detected: true, z_score: 3.45 }), JSON.stringify(['SIG-UPI-DROP-01']), 'completed', 450],
    [runId, 2, 'ComplaintCorrelationAgent', 'nlp_semantic_clusterer', JSON.stringify({ feedback_count: 156 }), JSON.stringify({ dominant_cluster: 'ERR_UPI_TIMEOUT_NO_ORDER_REC', confidence: 0.96 }), JSON.stringify(['REV-9821', 'TICK-9820']), 'completed', 820],
    [runId, 3, 'RootCauseCourtAgent', 'bayesian_hypothesis_evaluator', JSON.stringify({ candidate_hypotheses: 3 }), JSON.stringify({ verdict: 'HYP-01 Confirmed (94.2% posterior confidence)', refuted: ['HYP-02', 'HYP-03'] }), JSON.stringify(['T-01', 'T-02', 'T-03']), 'completed', 1450],
    [runId, 4, 'ImpactQuantificationAgent', 'financial_exposure_calculator', JSON.stringify({ customers: 156 }), JSON.stringify({ stranded_loss: 482000, risk_tier: 'high_value_customers' }), JSON.stringify(['CUST-1001', 'CUST-1002']), 'completed', 610],
    [runId, 5, 'RecoverySynthesizerAgent', 'action_policy_optimizer', JSON.stringify({ constraints: ['zero_double_charge', 'human_in_the_loop'] }), JSON.stringify({ recommendations: 3, highest_priority: 'disable_feature_flag' }), JSON.stringify(['REC-01', 'REC-02', 'REC-03']), 'completed', 980]
  ];

  await query(
    `INSERT INTO agent_steps (agent_run_id, step_number, agent_name, tool_name, input_summary, output_summary, evidence_references, status, duration_ms)
     VALUES ?`,
    [steps]
  );
  console.log('✓ Seeded agent run and 5 investigation steps');

  // 4. Update Incident Rich Metadata (Court Funnel, Impact Reconciliation, Shared Components)
  const courtData = {
    verdict: 'HYP-01 Confirmed: Android v2.3 client socket timeout mismatch (8s vs 9.4s)',
    posterior_probability: 0.942,
    funnel: {
      telemetry_available: true,
      stages: [
        { name: 'Cart Checkout Initiated', count: 12450, drop_rate: 0.02 },
        { name: 'UPI Intent App Redirected', count: 9820, drop_rate: 0.01 },
        { name: 'Bank Account Debited (SMS)', count: 9720, drop_rate: 0.0 },
        { name: 'Deep-Link Callback Handshake', count: 9564, drop_rate: 0.016, breakpoint: true },
        { name: 'Order Generated & Confirmed', count: 9564, drop_rate: 0.0 }
      ],
      breakpoint: 'Deep-Link Callback Handshake on Android v2.3'
    }
  };

  const impactData = {
    estimated_financial_loss: 482000,
    direct_customer_loss: 202440,
    reconciliation: {
      telemetry_available: true,
      states: {
        total_stranded_transactions: 156,
        bank_settled_uncredited: 156,
        auto_reconcilable: 156,
        requires_manual_audit: 0
      },
      overdue: [
        { order_id: 'ORD-4810', customer_name: 'Aarav Mehta', amount: 3499, bank_ref: 'HDFC-UPI-98124', status: 'stranded_debit' },
        { order_id: 'ORD-4811', customer_name: 'Priya Sharma', amount: 1850, bank_ref: 'ICICI-UPI-41829', status: 'stranded_debit' },
        { order_id: 'ORD-4812', customer_name: 'Rohan Verma', amount: 2400, bank_ref: 'SBI-UPI-10928', status: 'stranded_debit' },
        { order_id: 'ORD-4419', customer_name: 'Vikram Joshi', amount: 5200, bank_ref: 'AXIS-UPI-55219', status: 'stranded_debit' }
      ]
    }
  };

  const sharedComponents = [
    { component: 'UPI Intent Listener Activity', impact: 'Crash/Drop on Stop', status: 'hotfix_available' },
    { component: 'Partner Ingress Webhook', impact: '9.4s Latency Exceeds 8s Timeout', status: 'within_sla' },
    { component: 'Order Rehydration Batch Pipeline', impact: 'Staged for 156 Orders', status: 'ready' }
  ];

  await query(
    `UPDATE incidents SET metadata = ? WHERE id = ?`,
    [
      JSON.stringify({
        window_start: '2026-10-31T07:45:00Z',
        telemetry_available: true,
        fix_deployed: false,
        court: courtData,
        impact: impactData,
        shared_components: sharedComponents,
        explanation: [
          'Root Cause Court evaluated 3 rival hypotheses using Bayesian evidentiary likelihood.',
          'Lifecycle tracing proved Android v2.3 release binary drops intent callbacks during activity transition.',
          'Reconciliation batch verified 100% of the 156 stranded debits against partner bank settlement ledger.'
        ]
      }),
      incidentId
    ]
  );
  console.log('✓ Updated Incident metadata with Court, Funnel, Impact, and Reconciliation data');

  // 5. Seed Decision Brief
  await query('DELETE FROM decision_briefs WHERE incident_id = ?', [incidentId]);
  await query(
    `INSERT INTO decision_briefs (incident_id, agent_run_id, brief, generator, grounding_passed, usefulness_rating)
     VALUES (?, ?, ?, 'synthesizer', 1, 5)`,
    [
      incidentId,
      runId,
      JSON.stringify({
        summary: 'Actionable executive decision brief for incident commander and reliability engineers.',
        recommended_action: 'Authorize Feature Flag rollback and trigger auto-reconciliation job.',
        risk_verdict: 'Low reversibility risk. Expected customer recovery within 15 minutes.'
      })
    ]
  );
  console.log('✓ Seeded decision brief');

  console.log('======================================================');
  console.log('🎉 INCIDENT WORKSPACE DETAIL DATA SEEDED SUCCESSFULLY!');
  console.log('======================================================');
}

seedWorkspaceDetails()
  .catch(err => {
    console.error('Failed seeding workspace:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
    process.exit(0);
  });
