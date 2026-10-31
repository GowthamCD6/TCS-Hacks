# RecoverIQ — 2-Hour Implementation SRS

**Document type:** Time-boxed implementation specification  
**Version:** 1.2 — FastAPI Backend / Separate AI Service Demo Build  
**Date:** 31 October 2026  
**Challenge:** TCS Challenge 06 — Autonomous Customer Experience Recovery  
**Team:** 3 members (Frontend/UI-UX, Backend, AI Services)  
**Implementation window:** 120 minutes, including integration and demo verification

---

## 1. Purpose and decision

This document is a reduced, implementation-ready version of the existing RecoverIQ SRS. It preserves the challenge's essential outcome:

> **Signal → Issue → Segment → Root Cause → Impact → Intervention → Verified Recovery**

The purpose of this version is to help three team members build and integrate one complete, convincing end-to-end demonstration in two hours.

This is **not** a replacement for the long-term product specification. It is the scope freeze for the hackathon demo. Features not listed as Must or explicitly marked as deferred must not be started until the golden path works.

### Feasibility assumption

A complete cross-service demo in 120 minutes is realistic only if the repositories/project scaffolds already exist, dependencies are installed, and each member can start their service at the beginning. If the team is starting from empty repositories, it is not realistic to build and fully integrate the entire architecture in two hours. In that case, use the same API contract but reduce the build to one React incident screen, one FastAPI orchestration endpoint, one deterministic AI-service investigation endpoint, and one simulated approval/verification path. Do not sacrifice the end-to-end integration test to add more features.

### Product definition

RecoverIQ is an AI-powered customer-experience recovery system. It combines customer feedback with operational evidence, detects emerging problems, evaluates probable root causes, identifies affected customer segments, estimates business impact, recommends interventions, obtains human approval for consequential actions, and verifies recovery using KPIs.

### Important truthfulness rules

- The demo uses synthetic data and simulated recovery actions. The UI must label them clearly.
- A customer complaint or negative sentiment is a signal, not proof of a root cause.
- Correlation is not automatically causation. Root-cause outcomes must be evidence-supported, rejected, untested, or inconclusive.
- Missing telemetry must be shown as **Untested**, not Rejected.
- Estimated impact must never be presented as confirmed loss.
- An approved or executed action does not automatically mean the incident is resolved. KPI verification is required.

---

## 2. Two-hour scope

### 2.1 Must deliver in 120 minutes

1. A working React + Vite application connected to the Python FastAPI backend.
2. A reproducible synthetic dataset containing feedback from multiple sources and related operational records.
3. One complete planted incident and at least two alternative/decoy explanations.
4. Emerging-signal detection and issue grouping.
5. Affected-segment analysis using rates and denominators, not raw counts alone.
6. An AI investigation workflow that calls identifiable tools/analysis steps and produces a trace.
7. Root Cause Court with five tests and explicit test states.
8. Business-impact calculation with measured/estimated labels.
9. Ranked recovery recommendations.
10. Human approval and simulated execution.
11. KPI verification that controls the incident lifecycle.
12. A single end-to-end demo path that can be repeated reliably.

### 2.2 Must attempt after the golden path is stable

- Inject one new evidence item and reassess the affected hypothesis.
- Show a visible before/after difference from reassessment.
- Show an agent trace and a compact evaluation scorecard.

### 2.3 Explicitly deferred

Do not spend the two-hour window implementing these unless the complete golden path already works:

- Real refunds, real messages, real production feature-flag changes, or real customer data.
- Live integrations with banks, payment providers, review platforms, social networks, or contact-centre systems.
- Full Google Forms, CSV-import, or external-source setup workflows.
- Authentication, roles/permissions, tenant administration, and production deployment hardening.
- Separate full pages for every module in the original SRS.
- Advanced pagination, complex filters, export, and settings screens.
- A generic multi-industry configuration system.
- A sophisticated model-training pipeline or a large-scale data generator.

**Scope rule:** A complete narrow investigation is better than eight incomplete pages.

---

## 3. Demo scenario and synthetic data

Retain the planted food-delivery scenario from the existing SRS for this demo build. All records must be labelled synthetic.

### 3.1 Primary planted incident

**Incident:** Application version v2.3 causes UPI/payment confirmation problems for a specific Android segment; some payments are captured but the corresponding orders are not created.

The system should detect a rise in related complaints, identify the affected segment, correlate the issue with operational/release evidence, evaluate alternative explanations, estimate transaction/order exposure, and recommend a safe recovery action.

### 3.2 Alternative explanations / decoys

Use the existing three decoys if already available in the seed data:

- Weather-related late-delivery complaints.
- Negative sentiment after a menu-price change.
- A seasonal traffic increase affecting overall volume.

The AI must not incorrectly merge these into the payment-confirmation incident. If all three decoys cannot be represented in time, preserve at least one meaningful decoy and document the omitted cases.

### 3.3 Minimum data package

A static, deterministic JSON seed file is acceptable for this time-boxed build. Do not block the team by creating a large generator or a complex database migration.

Minimum evidence sources:

- Customer feedback from at least three channels (for example, support tickets, app reviews, and social feedback).
- Transaction/payment records.
- Order records.
- At least one application release or operational event.
- At least one telemetry/log evidence item, plus an explicit missing-telemetry case for testing the Untested state if practical.

Use a fixed seed or fixed JSON fixture so every run produces repeatable output.

### 3.4 Data integrity rules

- Each feedback and operational event must have a stable source ID.
- Duplicate source IDs must not inflate counts.
- Customer identifiers must be synthetic or masked.
- Financial calculations must use structured records, not LLM-generated numbers.
- Every displayed evidence item must have a source/reference ID and timestamp where available.

---

## 4. User roles for the demo

| User | Main responsibility |
|---|---|
| CX / Operations Manager | Reviews the incident, evaluates evidence, and approves or rejects actions. |
| Support Lead | Reviews affected-customer context and recovery guidance. |
| Customer (represented through synthetic records) | Receives the simulated recovery outcome. |
| Jury | Observes the investigation, evidence, agent trace, approval, adaptation, and KPI result. |

The demo does not need separate authenticated accounts for these roles. Represent them through labels and UI context only.

---

## 5. Golden-path user journey

The entire demo must be possible from one application shell.

1. Open the Overview page and show synthetic feedback/operational activity.
2. Click **Run investigation**.
3. Show the emerging signal and created/updated incident.
4. Show the affected customer segment and the comparison rate/lift.
5. Open the incident workspace and inspect supporting and contradicting evidence.
6. Show Root Cause Court results for the real hypothesis and decoys.
7. Show affected customers/orders and estimated financial impact.
8. Inspect the agent execution trace.
9. Review ranked recommendations and their evidence, risk, and expected benefit.
10. Approve one recommendation.
11. Execute it through a clearly labelled simulated action.
12. Run KPI verification. Resolve the incident only when the configured target holds for the demo monitoring window.
13. If time permits, inject new evidence and show reassessment changing the relevant tests, confidence/verdict, or recommendation.

---

## 6. Architecture and integration boundary

### 6.1 Services

| Component | Technology | Local port | Responsibility |
|---|---|---:|---|
| Frontend | React + Vite | 5173 | UI, user actions, rendering API results |
| Backend | Python + FastAPI | 8000 | Public API, demo state, data access, AI-service orchestration, approvals, simulated execution, KPI verification, persistence |
| AI service | Separate teammate-owned service; implementation/framework chosen by AI member | 8001 (default; configurable) | Detection, clustering, segmentation, hypothesis tests, impact analysis, recommendations, and AI trace |

The browser must call **only the FastAPI backend**. It must never call the AI service directly.

### 6.2 Minimum integration design

- FastAPI backend is the system of record and the only service that writes application state.
- The backend sends a compact analysis payload to the separate AI service over its agreed internal HTTP endpoint. The AI service returns structured JSON and must not write application state directly.
- The backend validates the AI response, applies application-state changes, stores/retains the result, and returns it to the frontend.
- The AI teammate owns the AI service implementation end-to-end. The backend teammate owns only the integration client/adapter and public API orchestration; do not duplicate the AI algorithms in the backend.
- If an existing database is already working, use it. Otherwise, a backend-owned in-memory store or JSON fixture is acceptable for the demo, provided reset/run behaviour is repeatable.
- Keep all simulated actions behind backend endpoints. The frontend must not mark an action as executed by changing local UI state alone.

### 6.3 Service startup contract

- Frontend: `http://localhost:5173` (Vite; use the actual configured Vite port if it differs)
- Backend health: `GET http://localhost:8000/health`
- AI service health: `GET http://localhost:8001/health` (default; confirm with the AI teammate)
- Browser API base URL: `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- Backend AI URL: `AI_SERVICE_URL=http://localhost:8001`
- Backend CORS must allow the Vite development origin, normally `http://localhost:5173`.

Use the existing project ports and environment-variable conventions if already configured; do not rename working services during the two-hour build.

### 6.4 Exact ownership boundary

- **Frontend member:** owns React + Vite UI and browser-to-FastAPI integration.
- **Backend member:** owns the Python FastAPI application, public REST endpoints, demo data/state, request validation, AI-service HTTP client, approval/execution workflow, and KPI lifecycle.
- **AI member:** owns the separate AI service end-to-end, including its internal algorithms/agent, dependencies, runtime, `/health`, and `/internal/investigate` implementation.
- The backend member must not build a second copy of the AI pipeline. The AI member must not independently change the agreed request/response schema.
- The two Python services may use different frameworks or internal structures. Their only required integration is the agreed HTTP contract. If the AI member chooses to expose a Python FastAPI service too, it must run on a different port from the public backend.
- Agree the AI service host, port, and endpoint with the AI member at minute 0–10. The default in this document is port 8001.

---

## 7. Shared API contract — freeze this before parallel development

**This section is the integration agreement. All three members must use these names and shapes. Do not independently redesign the payloads.**

### 7.1 Common response envelope

Successful response:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Failed response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A readable error message"
  }
}
```

### 7.2 Public FastAPI backend — minimum endpoints

| Method | Endpoint | Purpose | Priority |
|---|---|---|---|
| GET | `/api/v1/demo/state` | Return initial dashboard, seeded data summary, and current incident state | Must |
| POST | `/api/v1/demo/run` | Run the investigation and return the complete incident analysis | Must |
| POST | `/api/v1/incidents/:id/approve` | Approve or reject a recommendation | Must |
| POST | `/api/v1/incidents/:id/execute` | Execute an approved simulated action | Must |
| POST | `/api/v1/incidents/:id/verify` | Recalculate KPI status and update lifecycle | Must |
| POST | `/api/v1/incidents/:id/evidence` | Add a new evidence item | Should |
| POST | `/api/v1/incidents/:id/reassess` | Re-run the affected investigation after evidence injection | Should |
| POST | `/api/v1/demo/reset` | Restore the deterministic demo state | Should |

Do not build the entire original endpoint catalogue in this two-hour version. Add further endpoints only if the existing application already has them and they work.

### 7.3 `GET /api/v1/demo/state` response data

The `data` object should contain:

```json
{
  "dataset_label": "SYNTHETIC DEMO DATA",
  "dashboard": {
    "feedback_received": 0,
    "active_incidents": 0,
    "critical_incidents": 0,
    "affected_customers": 0,
    "estimated_impact": 0,
    "pending_approvals": 0
  },
  "incident": null,
  "last_run": null
}
```

The zero values above are schema examples, not required demo metrics. Populate them from the seeded data/state. Do not show invented live values.

### 7.4 `POST /api/v1/demo/run`

Request:

```json
{
  "scenario_id": "payment_confirmation_v23",
  "reset_before_run": true
}
```

The backend loads the seed data and calls the Python service. The response `data` must contain one complete analysis object with these top-level fields:

```json
{
  "run_id": "demo-run-001",
  "dataset_label": "SYNTHETIC DEMO DATA",
  "signal": {},
  "incident": {},
  "segments": [],
  "evidence": [],
  "hypotheses": [],
  "impact": {},
  "recommendations": [],
  "agent_trace": [],
  "kpis": [],
  "evaluation": {}
}
```

### 7.5 Required object fields

**Signal**

```json
{
  "id": "SIG-001",
  "title": "Increase in payment confirmation complaints",
  "current_count": 0,
  "baseline_count": 0,
  "increase_percent": 0,
  "severity": "high",
  "confidence": 0.0,
  "time_window": "last 24 hours"
}
```

**Incident**

```json
{
  "id": "INC-001",
  "title": "Payment captured but order not created",
  "status": "investigating",
  "severity": "high",
  "confidence": 0.0,
  "first_detected_at": "2026-10-31T08:00:00Z",
  "affected_customer_count": 0,
  "summary": "Evidence-backed summary; synthetic scenario"
}
```

Allowed lifecycle states: `detected`, `investigating`, `awaiting_approval`, `approved`, `executing`, `monitoring`, `resolved`, `rejected`, `escalated`, `reopened`.

**Segment**

```json
{
  "name": "Android 14 / app v2.3",
  "affected_count": 0,
  "population": 0,
  "issue_rate": 0.0,
  "comparison_rate": 0.0,
  "lift": 0.0,
  "confidence": 0.0
}
```

Always show numerator and denominator or the affected count and population. Do not rank a segment using raw complaint count alone.

**Evidence**

```json
{
  "id": "EVD-001",
  "type": "operational_log",
  "source": "synthetic_gateway_log",
  "description": "Payment callback timeout increased after the release",
  "timestamp": "2026-10-31T08:00:00Z",
  "related_record_id": "LOG-001",
  "relevance": 0.9,
  "stance": "supports",
  "synthetic": true
}
```

Allowed `stance`: `supports`, `contradicts`, `context`. Evidence types may include `feedback`, `transaction`, `order`, `telemetry`, `release`, `support_ticket`, and `operational_event`.

**Hypothesis and Root Cause Court test**

```json
{
  "id": "HYP-001",
  "title": "App v2.3 introduced a payment confirmation regression",
  "verdict": "supported",
  "confidence": 0.0,
  "tests": [
    {
      "name": "temporal_relationship",
      "status": "supported",
      "explanation": "The issue rate increased after the release.",
      "evidence_ids": ["EVD-001"]
    }
  ],
  "supporting_evidence_ids": ["EVD-001"],
  "contradicting_evidence_ids": [],
  "missing_evidence": []
}
```

The five test names are `temporal_relationship`, `segment_specificity`, `operational_telemetry`, `dose_response`, and `counter_check`. Each test status must be one of `supported`, `rejected`, `untested`, or `inconclusive`. The overall verdict must not claim certainty beyond the evidence.

**Impact**

```json
{
  "affected_customers": {"value": 0, "kind": "measured"},
  "affected_orders": {"value": 0, "kind": "measured"},
  "captured_without_order": {"value": 0, "kind": "measured"},
  "estimated_lost_order_value": {"value": 0, "kind": "estimated"},
  "financial_exposure": {"value": 0, "kind": "estimated"},
  "currency": "INR"
}
```

Allowed `kind`: `measured`, `estimated`, `assumed`. The UI must display the kind beside every relevant amount.

**Recommendation**

```json
{
  "id": "REC-001",
  "title": "Reconcile affected payment and order records",
  "rationale": "Supported by payment/order mismatch evidence.",
  "expected_customer_benefit": "Identify affected orders and eligible recovery cases.",
  "estimated_cost": 0,
  "implementation_minutes": 10,
  "risk": "medium",
  "confidence": 0.0,
  "approval_required": true,
  "evidence_ids": ["EVD-001"],
  "status": "pending_approval"
}
```

**Agent trace**

```json
{
  "step": 1,
  "tool": "detect_emerging_signal",
  "action": "Compared current issue volume with baseline",
  "input_summary": "Feedback and operational-event window",
  "output_summary": "A candidate signal was detected",
  "evidence_ids": ["EVD-001"],
  "status": "completed",
  "duration_ms": 20
}
```

**KPI**

```json
{
  "key": "payment_without_order_rate",
  "label": "Payment-without-order rate",
  "baseline": 0.0,
  "current": 0.0,
  "target": 0.0,
  "unit": "%",
  "status": "not_yet_verified",
  "monitoring_window": "simulated 30 minutes"
}
```

Allowed KPI status: `improving`, `at_risk`, `target_met`, `not_yet_verified`.

### 7.6 Approval, execution, and verification requests

Approve:

```json
{
  "recommendation_id": "REC-001",
  "decision": "approve",
  "comment": "Approved for simulated demo execution"
}
```

Reject:

```json
{
  "recommendation_id": "REC-001",
  "decision": "reject",
  "comment": "Reason for rejection"
}
```

Execute:

```json
{
  "recommendation_id": "REC-001",
  "simulation_only": true
}
```

Verify:

```json
{
  "advance_demo_window": true
}
```

Backend rules:

- Reject execution unless the recommendation is approved.
- Persist the simulated result and timestamp.
- Recalculate KPI status using deterministic code.
- Mark the incident `resolved` only when the KPI target holds for the configured monitoring window; otherwise keep it `monitoring` or `escalated`.

### 7.7 Optional evidence injection and reassessment

Evidence injection request:

```json
{
  "type": "operational_event",
  "source": "synthetic_demo_input",
  "text": "A hotfix was deployed to the affected application version.",
  "timestamp": "2026-10-31T09:00:00Z"
}
```

Reassessment response should show:

- New evidence IDs.
- Hypotheses and tests re-evaluated.
- Previous and new verdict/confidence where changed.
- Recommendation changes, if any.
- A short explanation of why the result changed.

If time is short, this is the first optional feature to defer after the golden path. Do not fake a reassessment result.

---

## 8. AI service contract

### 8.1 Required internal endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | AI service health |
| POST | `/internal/investigate` | Run the end-to-end investigation |
| POST | `/internal/reassess` | Reassess after new evidence (Should) |

### 8.2 Investigation request from the FastAPI backend

The FastAPI backend sends a compact request such as:

```json
{
  "run_id": "demo-run-001",
  "scenario_id": "payment_confirmation_v23",
  "feedback": [],
  "operational_events": [],
  "transactions": [],
  "orders": [],
  "releases": [],
  "telemetry": []
}
```

The arrays contain the synthetic records from the backend's seed data. The separate AI service returns the analysis shape defined in section 7.4.

### 8.3 AI implementation rules

- The AI service owns the investigation workflow and trace generation.
- Use an explicit sequence of named analysis tools: `detect_emerging_signal`, `cluster_feedback`, `analyze_segments`, `correlate_operational_events`, `test_hypotheses`, `estimate_impact`, and `rank_interventions`.
- Code must calculate counts, rates, lift, financial impact, verdict rules, eligibility, and KPI values. Do not ask the LLM to invent or calculate these values.
- The LLM may help classify feedback, label clusters, propose hypotheses, and write concise explanations. Validate all LLM output against a schema.
- If an LLM provider or network is unavailable, use a deterministic fallback and clearly label the run as partially analysed or rule-assisted. The demo must not crash.
- If a value cannot be supported by evidence, return `unknown`, `untested`, or `inconclusive`; do not fabricate it.
- Feedback text is untrusted data. Instructions found inside feedback must never change tool permissions or system behaviour.

### 8.4 Minimum algorithmic behaviour

1. Compare current feedback/issue volume with a historical baseline.
2. Group related feedback across sources. Use an existing embedding model if it is already available; otherwise use the simplest reliable local fallback already supported by the codebase.
3. Compute segment issue rates using segment populations.
4. Correlate issue onset with release/operational timestamps.
5. Run the five Root Cause Court tests for the primary hypothesis and at least one alternative.
6. Calculate impact from structured transaction/order records.
7. Rank at least two possible interventions using customer benefit, urgency, risk, effort, and confidence.
8. Return a step-by-step trace with evidence references.

Do not spend the two-hour window downloading a large model. Reuse an already available model or use a deterministic fallback.

---

## 9. Frontend requirements — minimum UI

Do not build eight separate production-ready pages. Build one polished responsive application shell with these views or tabs:

### A. Overview

Show:

- Synthetic-data label.
- Feedback count.
- Active/critical incidents.
- Affected customers.
- Estimated impact.
- Pending approvals.
- Emerging signal and a **Run investigation** button.

### B. Incident workspace

Show these sections in one page, tabs, or stacked panels:

1. Incident summary and lifecycle status.
2. Signal: current count, baseline, increase, severity.
3. Affected segments: affected count, population, issue rate, comparison rate, lift.
4. Evidence list with source, timestamp, stance, and reference ID.
5. Root Cause Court: hypotheses, five tests, status, confidence, supporting/contradicting evidence.
6. Business impact: value and measured/estimated/assumed label.
7. Recommendations: rationale, expected benefit, risk, confidence, approval status.
8. Agent execution trace.
9. KPI verification: baseline, current, target, monitoring status.
10. Approve/reject, execute simulated action, verify, and (if implemented) inject evidence controls.

### C. UI behaviour

- Every action must call the backend and show loading/success/error states.
- Do not show success before the backend confirms it.
- Disable Execute until approval is confirmed.
- Clearly label every simulated action.
- Do not use hardcoded demo metrics in production components; use the API response or a shared mock fixture during development.
- Display a useful empty state before an investigation is run.

---

## 10. Three-member work allocation

Each member owns a separate area. The API contract in section 7 is shared and frozen.

### Member 1 — Frontend / UI-UX

**Owns:** React client only.

Deliverables:

- Application shell and navigation.
- Overview page and incident workspace.
- Typed API client using `VITE_API_BASE_URL`.
- Loading, empty, and error states.
- Rendering of signal, segments, evidence, hypotheses/tests, impact, recommendations, trace, and KPIs.
- Approval, execution, verification, and optional evidence-injection controls.

Rules:

- Start with the exact JSON fixture/API schema in section 7.
- Do not wait for the backend to finish; use a local fixture with the same response shape.
- Do not implement business calculations in the UI.
- Do not call the AI service from the browser.

### Member 2 — Backend

**Owns:** Python / FastAPI public API, demo state, and integration with the separate AI service.

Deliverables:

- Seed/load deterministic synthetic data.
- Implement the public FastAPI endpoints in section 7.2.
- Implement the AI-service HTTP client/adapter using `AI_SERVICE_URL`.
- Call the AI service `/internal/investigate` endpoint and pass the structured data.
- Validate and store the AI response.
- Own incident lifecycle, approval state, simulated execution, and KPI verification.
- Return the same response shape every time.
- Provide reset support if time permits.

Rules:

- FastAPI backend is the only writer of application state.
- Do not reimplement clustering, segmentation, root-cause tests, or recommendation logic owned by the AI teammate; call the agreed AI interface.
- Never execute real financial or production actions.
- Validate approval before execution.
- Do not rename payload fields after the contract is frozen.

### Member 3 — AI Services

**Owns:** The separate AI service end-to-end (its internal implementation and runtime).

Deliverables:

- Expose `/health` and `/internal/investigate` on the agreed AI-service address (default port 8001).
- Implement the named analysis tools and agent trace.
- Perform issue detection, clustering/grouping, segment rates/lift, operational correlation, five hypothesis tests, impact calculation, and intervention ranking.
- Return valid JSON matching section 7.4 exactly.
- Add `/internal/reassess` only after the first analysis works.
- Provide deterministic fallback if LLM/embedding dependencies fail.

Rules:

- Do not write directly to the application database during this two-hour build.
- Do not change the response schema without agreement from the other two members.
- All numeric calculations and decisions must be reproducible in code.

---

## 11. Two-hour execution schedule

**Use a hard timebox. Integration must start early, not at the end.**

| Elapsed time | Frontend member | Backend member | AI member | Integration checkpoint |
|---|---|---|---|---|
| 0–10 min | Read API contract; create shell and fixture types | Confirm FastAPI backend starts; create endpoint stubs and seed-data shape | Confirm the AI service starts; create its endpoint stub and response model | Agree field names, ports, and one shared sample response |
| 10–25 min | Build overview/incident layout using fixture | Implement `GET /demo/state` and `POST /demo/run` stub | Implement `/health` and `/internal/investigate` stub | All three services start independently |
| 25–50 min | Render signal, segment, evidence, hypotheses, impact, trace, KPIs from fixture | Load seed data; call AI endpoint; return response through FastAPI | Implement detection, segment analysis, hypothesis tests, impact and trace | FastAPI backend must successfully call AI by minute 50 |
| 50–65 min | Replace fixture fetch with FastAPI API; test loading/error states | Complete approve/execute/verify routes and lifecycle | Complete recommendation ranking and response validation | First full browser → FastAPI → AI service → FastAPI → browser run |
| 65–80 min | Wire buttons and status updates | Fix contract/state issues; add reset if easy | Fix analysis output and deterministic fallback | Golden path works with one seeded scenario |
| 80–95 min | Visual polish only where it helps demo clarity | Fix action and KPI verification behaviour | Fix root-cause evidence/status correctness | No new large feature after minute 80 |
| 95–110 min | Test complete demo from reset | Run API and action tests; verify no false success | Run AI scenario tests; verify decoys and missing evidence | End-to-end acceptance checklist completed |
| 110–120 min | Prepare demo navigation | Freeze backend and reset state | Freeze AI output and prepare explanation | Rehearse once; no new features |

### Mandatory integration gates

- **Minute 10:** API contract and response shape frozen.
- **Minute 25:** All three services start; backend and AI stubs respond.
- **Minute 50:** FastAPI successfully calls the AI service and gets valid JSON.
- **Minute 65:** Frontend renders the real response from FastAPI.
- **Minute 80:** Golden path works; feature freeze begins.
- **Minute 110:** Final acceptance test and demo reset.

If a gate is missed, cut optional features immediately. Do not postpone integration to the final 20 minutes.

---

## 12. Acceptance tests — must pass before demo

| ID | Test | Pass condition |
|---|---|---|
| AT-1 | Load demo state | UI displays synthetic-data label and initial state without errors |
| AT-2 | Run investigation | FastAPI calls the AI service and returns a complete incident analysis |
| AT-3 | Multi-source reasoning | Analysis references at least three distinct evidence-source types |
| AT-4 | Issue detection | Seeded primary issue is detected and signal baseline/current values are shown |
| AT-5 | Segmentation | Affected segment includes population, issue rate, comparison rate, and lift |
| AT-6 | Root Cause Court | Five tests are shown with supported/rejected/untested/inconclusive states |
| AT-7 | Sentiment guardrail | Negative sentiment alone cannot produce a supported root-cause verdict |
| AT-8 | Impact | Values are calculated from records and labelled measured/estimated/assumed |
| AT-9 | Intervention | At least two ranked recommendations have rationale, risk, confidence, and evidence references |
| AT-10 | Human approval | Consequential simulated action cannot execute before approval |
| AT-11 | Simulated execution | Backend confirms execution and UI labels it simulated |
| AT-12 | KPI verification | Incident remains monitoring until KPI target/window is met |
| AT-13 | Missing evidence | Missing telemetry is shown as untested, not rejected |
| AT-14 | Agent trace | Investigation steps, tools, outcomes, and evidence references are visible |
| AT-15 | Reliability | If AI service fails, UI shows an error/partial-analysis state; it does not show fabricated success |
| AT-16 | Adaptation (Should) | Injected evidence triggers reassessment and returns a before/after difference |

A test that has not been run must be reported as **Not tested**, not Passed.

---

## 13. Demo script for the jury

Target demo length: approximately 4–6 minutes.

1. **Overview:** State that the data is synthetic and show incoming feedback and operational evidence.
2. **Detection:** Run the investigation and show the emerging signal.
3. **Segment:** Show which segment is disproportionately affected, including denominator and lift.
4. **Evidence:** Open the incident and inspect feedback, transaction/order evidence, and operational events.
5. **Root Cause Court:** Show why the leading hypothesis is supported and why at least one alternative is rejected or remains inconclusive.
6. **Impact:** Show affected customers/orders and clearly labelled financial exposure.
7. **Agent:** Show the tool execution trace, not just the final explanation.
8. **Intervention:** Review the recommended action and approve it as the human operator.
9. **Action:** Execute the simulated action.
10. **Verification:** Show KPI movement and explain why the incident is or is not resolved.
11. **Adaptation (if implemented):** Inject a hotfix/new evidence and show which test or recommendation changed.

Do not claim live provider access, actual refunds, real customer notifications, or production changes.

---

## 14. Risks and fallback decisions

| Risk | Immediate fallback |
|---|---|
| AI service is not ready by minute 50 | Use a deterministic Python analysis pipeline with the same response contract; keep the agent trace visible and honest |
| LLM provider unavailable/rate-limited | Use rule-based extraction/templates; mark partial analysis where appropriate |
| Embedding model is unavailable | Use the simplest local fallback already installed; do not download a large model during the build |
| Database or migration issue | Use a backend-owned JSON/in-memory demo store, clearly labelled synthetic |
| Frontend integration is late | Render the shared fixture first, then switch the API base URL to FastAPI |
| API shapes diverge | Stop feature work and restore the exact contract in section 7 |
| KPI action appears successful but verification fails | Keep incident in monitoring; do not force it to resolved |
| Time is running out | Drop evidence injection/reassessment, reset UI, CSV ingestion, extra pages, and visual polish before dropping the golden path |

---

## 15. Definition of done

The two-hour build is complete only when:

- [ ] React + Vite frontend, Python FastAPI backend, and the separate AI service start successfully.
- [ ] Browser communicates only with the FastAPI backend.
- [ ] FastAPI successfully calls the AI service.
- [ ] A complete investigation result appears in the UI.
- [ ] The result includes signal, segment, evidence, hypotheses/tests, impact, recommendations, trace, and KPIs.
- [ ] At least one recommendation requires and receives human approval.
- [ ] A simulated action executes only after approval.
- [ ] KPI verification controls the incident status.
- [ ] Synthetic and simulated content is visibly labelled.
- [ ] The team has rehearsed the demo once from a clean/reset state.
- [ ] Any unimplemented or untested requirements are disclosed honestly.

---

## 16. Final team agreement

1. Freeze the API contract before parallel implementation.
2. Each member owns their assigned service; avoid editing another member's area unless agreed.
3. Share one sample JSON response immediately and use it as the frontend fixture.
4. FastAPI-backend-to-AI-service integration must be working by minute 50.
5. React/Vite-to-FastAPI integration must be working by minute 65.
6. Stop adding large features at minute 80.
7. Protect the end-to-end golden path above all optional features.
8. Never fake evidence, action execution, KPI recovery, or test results.

**The goal is not to finish every requirement from the original 20-page SRS in two hours. The goal is to demonstrate one complete, evidence-backed, human-controlled customer recovery investigation that genuinely works across all three services.**
