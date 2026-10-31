# RecoverIQ — Phase 2 Build Prompt: Payment Intelligence (data, models, knowledge graph, LLM decision briefs)

FIRST: save this message verbatim to `docs/PHASE2_PAYMENT_PROMPT.md`, then read `docs/BUILD_PROMPT.md`, `docs/AI_SERVICE_CONTRACT.md`, `docs/DATABASE_SCHEMA.md` and the current code before changing anything. Extend what exists; do not rebuild it. Keep every existing test passing.

Scope of this phase: ONLY the payment problem ("money debited, order not created"). The e-commerce product-review use case (earbuds, electronics) comes later; do not start it, but keep module names generic enough (`domain = "payments"`) that it can be added.

## 0. Ground rules

- Time is short. Build in the order of section 9. Must items first; stop and report after each step.
- Never claim a result you have not run. Every metric in docs must come from a script output saved under `ai_services/eval/`.
- Real data is used where it exists publicly (customer complaint text). Company payment logs are never public, so operational data stays synthetic, calibrated to public figures, and is labelled synthetic everywhere.
- Correlation and feature importance are evidence, not proof. The Root Cause Court decides.
- Windows-friendly paths and commands. No secrets in code, docs or logs.

## 1. Datasets (I will download the ones marked "manual" into `ai_services/data/raw/`)

| Key | Dataset | Link | What it is | How we use it | Get it |
|---|---|---|---|---|---|
| D1 | BANKING77 | https://huggingface.co/datasets/PolyAI/banking77 | 13,083 real-style banking customer queries, 77 intents, CC BY 4.0 | Training text for payment-complaint intents (pending, failed, declined, not received, refund not showing, reverted) | Script downloads with `datasets`; if offline, I put `train.csv` and `test.csv` in `data/raw/banking77/` |
| D2 | Real Google Play reviews of Indian food-delivery apps | Package: https://pypi.org/project/google-play-scraper/ ; app IDs `in.swiggy.android`, `com.application.zomato` (verify IDs on the Play Store page before running) | Real customer reviews in Indian context, including payment complaints | Domain adaptation and the real held-out test set | Script `scripts/fetch_play_reviews.py` (needs internet once); saves `data/raw/play_reviews.csv`. Store only review text, rating, date, app version; drop user names |
| D3 | CFPB Consumer Complaint Database (optional) | https://www.consumerfinance.gov/data-research/consumer-complaints/ | Real US consumer complaints with narratives; product "Money transfer, virtual currency, or money service" | Extra payment-complaint text if D1+D2 are thin | Manual: filter that product, with narratives, export CSV to `data/raw/cfpb_money_transfer.csv` |
| D4 | RBI failed-transaction TAT circular (20 Sep 2019) | https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=11693&Mode=0 | UPI debited but merchant confirmation not received: auto-reversal by T+5 days, ₹100/day compensation beyond | Reversal-due dates and the overdue KPI | Already known; keep days configurable |
| D5 | NPCI UPI statistics | https://www.npci.org.in/what-we-do/upi/upi-ecosystem-statistics | Public monthly UPI volumes and bank-wise decline figures | Calibrate the synthetic baseline failure rate (keep it around the low single-digit percent level and record the figure you used, with source, in `data/calibration.json`) | Manual reference; do not scrape |
| D6 | Olist Brazilian E-Commerce (Could) | https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce | Real joined orders, payments and reviews | Optional proof that the review → order → payment join works on real relational data | Manual download to `data/raw/olist/` |

If a download fails, continue with what is present and report it. Never fabricate rows and call them real.

## 2. Think like the payments team: the payment-to-order funnel

Root cause is found where the money's journey breaks, not in the review text. Extend the synthetic generator and `operational_events` so every UPI order passes these stages, each with timestamp, status and error code:

1. `order_draft_created` (client)
2. `payment_initiated` (client → gateway)
3. `collect_request_sent` (gateway → bank/PSP)
4. `customer_authorised` (UPI PIN entered)
5. `bank_debit_success` / `bank_debit_failed` / `bank_debit_pending`
6. `gateway_callback_received` (gateway → our server webhook) with HTTP status and latency
7. `client_confirm_call` (app → order service) with status
8. `order_created` / `order_create_failed` (order service) with error code
9. `reversal_initiated` / `reversal_completed` with timestamps

Add fields: `bank` (issuer), `payment_gateway`, `psp_app`, `os`, `os_version`, `app_version`, `device_model`, `network_type`, `amount`, `city`.

Each hypothesis must break the funnel at a different place with a different segment profile. Plant them so the court can tell them apart:

| Hypothesis | Where the funnel breaks | Segment profile | Planted? |
|---|---|---|---|
| H1 App v2.3 confirm bug | Debit success + callback received, but `client_confirm_call` times out | Android 14 on v2.3 only, all banks, all gateways, starts at release | Yes, the real incident |
| H2 Bank UPI outage | `bank_debit_failed` or `pending` spikes | One bank, all app versions and OSes, a few hours | Decoy |
| H3 Gateway callback failure | Debit success, `gateway_callback_received` missing or late | One gateway, all versions, short window | Decoy (small, separate day) |
| H4 Order service outage | Callback received, `order_create_failed` 5xx | Everyone, short window | Decoy (short, separate day) |
| Weather / price / seasonal | No payment break | Delivery or price complaints only | Existing decoys |

New analysis tool `funnel_breakpoint(segment, window)`: conversion between each consecutive stage, compared with baseline and with the complement segment; returns the stage with the largest significant drop. The Court's telemetry test must use this: a hypothesis is supported only if the observed breakpoint matches the stage it predicts.

New tool `reconcile(window)`: joins gateway debit-success records with orders. Each captured payment ends in exactly one state: `order_created`, `captured_no_order_pending_reversal`, `captured_no_order_reversed`, `captured_no_order_overdue` (past T+5 from config), or `unknown`. This is the source of truth for impact and refunds, never the complaint text.

## 3. Models to train (no LLM training)

### M1 Payment-complaint intent classifier — Must

Purpose: classify every feedback record cheaply and measurably, so bulk text no longer needs the LLM.

Taxonomy (keep in `config/taxonomy.yaml`): `debited_not_fulfilled`, `payment_pending`, `payment_failed_or_declined`, `refund_or_reversal_status`, `double_or_unrecognised_charge`, `delivery_delay`, `price_complaint`, `food_quality`, `app_bug_other`, `praise_or_neutral`.

Training data:
- D1 mapped to the taxonomy: `transfer_not_received_by_recipient`, `balance_not_updated_after_bank_transfer` → debited_not_fulfilled; `pending_transfer`, `pending_card_payment`, `pending_top_up` → payment_pending; `declined_transfer`, `failed_transfer`, `declined_card_payment`, `top_up_failed` → payment_failed_or_declined; `Refund_not_showing_up`, `request_refund`, `reverted_card_payment?`, `top_up_reverted` → refund_or_reversal_status; `card_payment_not_recognised`, `direct_debit_payment_not_recognised`, `transfer_fee_charged`, `card_payment_fee_charged` → double_or_unrecognised_charge. Drop all other BANKING77 intents (they are not food-app situations). The food-app classes (delivery_delay, price_complaint, food_quality, app_bug_other, praise_or_neutral) come from D2 only.
- D2 real reviews labelled in two steps: (a) Groq labels about 1,500 reviews with a strict JSON schema; (b) I hand-check 200 of them in `data/labels/gold_review_labels.csv` (create the file with blank `human_label` column and a short labelling guide). The 200 human-checked reviews are the test set and are never used for training.
- Optional D3 for extra payment text.

Model: frozen `all-MiniLM-L6-v2` embeddings + LogisticRegression (class-weighted), with a TF-IDF + LinearSVC baseline for comparison. Fine-tuning a small transformer is Could, only if time remains.

Evaluation saved to `eval/m1_report.json`: macro-F1 and per-class F1 on the human-checked real reviews; confusion matrix; LLM-annotator agreement with humans; compare with the existing rule extractor. Confidence below a threshold → send that record to the LLM extractor (hybrid routing). Save model to `ai_services/models/m1_intent/` with version and training data hash.

### M2 Failure attribution model — Should

Purpose: rank which transaction attributes, and combinations, separate failed journeys from good ones, as extra evidence for the court.

Data: synthetic funnel transactions. Target: `captured_no_order` (1/0). Features: app_version, os, os_version, bank, gateway, psp_app, device_model, network_type, hour, amount band. Model: LightGBM (fallback: sklearn HistGradientBoosting). Explain with SHAP, including the top 2-way interaction (expect app_version × os_version for H1). Time-ordered split; report AUC and the top factors in `eval/m2_report.json`.

Rule: output is labelled `attribution_evidence`, never `cause`. The court may cite it only alongside the timing, funnel and counter-check tests.

### M3 Expected failure-rate baseline — Could

Poisson regression of hourly `captured_no_order` count with hour-of-day, day-of-week and volume offset; flag segments whose residual exceeds a threshold. Only if M1 and the funnel tool are done.

## 4. Knowledge graph: what it stores and how it stays efficient

Purpose: connect evidence so the agent can (a) explain any conclusion back to source records, (b) find shared components across affected journeys, (c) update incrementally when evidence arrives. It is not the judge; the court is.

Storage (MySQL is the source of truth; reuse existing tables if present, otherwise add):
- `kg_nodes(id, incident_id NULL, node_type, natural_key, label, props JSON, fact_kind, source_table, source_id, confidence NULL, run_id, created_at)`; unique on `(node_type, natural_key)`.
- `kg_edges(id, src_id, dst_id, edge_type, fact_kind, props JSON, evidence_ids JSON, run_id, created_at, superseded_by NULL)`.
- `fact_kind` ∈ `observed` (from records), `derived` (computed by a tool, e.g. a rate), `hypothesis` (proposed, not proven), `verdict` (court output).

Granularity, to keep it small and fast:
- Entity nodes: bank, gateway, psp_app, app_version, os_version, release, service, funnel_stage, segment, issue_cluster, incident, hypothesis, court_test, recommendation, approval, action, kpi.
- Do NOT create a node per transaction or per review. Edges carry aggregates (`n`, `rate`, `lift`, `p_value`, window). Keep up to 5 exemplar feedback and transaction IDs per edge in `evidence_ids`, and a re-runnable query handle for the full list.
- Example edges: `segment(Android14·v2.3) -[BREAKS_AT {rate, lift, n}]-> funnel_stage(client_confirm_call)`, `release(v2.3) -[DEPLOYED_AT]-> time`, `hypothesis(H1) -[TESTED_BY]-> court_test(temporal)`, `court_test -[SUPPORTS|CONTRADICTS|UNTESTED]-> hypothesis`, `recommendation -[REQUIRES]-> approval -[AUTHORISES]-> action -[MEASURED_BY]-> kpi`.

In memory: build a NetworkX `MultiDiGraph` per incident from SQL for traversal. Tools: `explain_path(node)` (chain to source records), `shared_components(affected_segment)` (attributes common to failing journeys but rare in good ones; used when iOS complaints appear), `impact_neighbourhood(hypothesis)`.

Updates: every agent run writes with its `run_id`; superseded edges are kept and marked, so `GET /incidents/:id/graph?diff=run_a,run_b` can show what changed. Return React Flow nodes and edges, with `fact_kind` so the UI can style facts, hypotheses and verdicts differently.

## 5. Root Cause Court upgrade

For each of H1 to H4 (plus any LLM-proposed hypothesis that names a testable component), run:
1. Temporal: onset (change-point on captured_no_order rate) vs the event time.
2. Segment specificity: lift of the predicted segment vs its complement, with significance.
3. Telemetry: `funnel_breakpoint` matches the predicted break stage.
4. Dose-response: rate rises with exposure (share of traffic on v2.3, hours since release, per-bank share).
5. Counter-check: the complement segment and the other hypotheses' signatures do not explain the data.

Scoring stays explicit in code (documented weights); M2 attribution can add, never decide. Missing data → `untested`. Sentiment is excluded.

## 6. LLM work (Groq, configurable model)

Finish the fair model comparison already started: rerun with token limits of at least 800 for reasoning models, measure extraction accuracy on 20 labelled examples, JSON validity and the numeric grounding pass rate (below). Set `GROQ_MODEL` to the winner and record results in `eval/llm_model_comparison.json`.

LLM jobs in this phase:
1. Annotator for D2 labelling (section 3).
2. Low-confidence fallback extractor for M1.
3. Hypothesis proposer: reads the graph summary and change log; must output testable hypotheses in a schema (component, predicted segment, predicted break stage, predicted onset). Untestable ones are rejected by the validator.
4. **Decision brief for the human approver** (Must). Input: court result, reconcile output, impact, ranked options, all as JSON. Output schema: `headline`, `what_happened`, `evidence[] {claim, ref}`, `options[] {action, customer_benefit, business_cost, risk, reversible, time_to_effect}`, `recommended_option`, `if_rejected`, `confidence_statement`, `numbers_used[]`. Shown in the approval inbox and sent as a simulated Slack/email notification.
5. **Customer message drafts** (Should), one template family per reconcile state: already reversed (confirm, no compensation promise), pending reversal (state the date it is due), overdue (apology plus escalation), order created late (confirmation). Facts and dates come from records only. Every message needs approval before the simulated send.

Numeric grounding check (Must): after each LLM output, extract every number and date; each must exist in the input JSON (allowing formatting differences) or the output is rejected and regenerated once, then falls back to a template. Log the pass rate.

Prompt-injection guard: feedback text is passed as quoted data; tool access is fixed in code, not in the prompt.

## 7. API additions (additive only; update `docs/API_CONTRACT.md` and mock responses)

- `GET /api/v1/incidents/:id/funnel` → stages, baseline vs current conversion, breakpoint
- `GET /api/v1/incidents/:id/reconciliation` → counts and money by reconcile state, overdue list (customer IDs masked)
- `GET /api/v1/incidents/:id/attribution` → M2 top factors and interaction (labelled attribution evidence)
- `GET /api/v1/incidents/:id/decision-brief` → the brief, with `numbers_used`
- `GET /api/v1/incidents/:id/graph?diff=` → graph with optional run diff
- `GET /api/v1/models` → M1/M2 versions, training data, evaluation metrics

## 8. Evaluation (scorecard additions)

- M1 macro-F1 on human-checked real reviews; routing share sent to the LLM.
- Funnel breakpoint correct for each planted hypothesis.
- Court verdict accuracy for H1 to H4.
- Reconcile accuracy vs hidden truth (counts and money exact; overdue list exact).
- M2: AUC and whether the top interaction matches the planted segment.
- LLM: JSON validity, numeric grounding pass rate, and human usefulness rating field for briefs (left blank for me).
- Detection delay after the release (currently 54 hours; report the new value, do not tune to a target).

## 9. Order of work

1. Run the existing tests; fix anything broken by the last LLM changes. (Must)
2. Funnel events in the generator + `reconcile` + `funnel_breakpoint` + the three new decoys H2 to H4. (Must)
3. Court upgrade using the funnel. (Must)
4. Datasets: D1 download, D2 fetch script and labelling files. (Must)
5. M1 train + evaluate + hybrid routing. (Must)
6. Knowledge graph storage, diff and the three traversal tools. (Must)
7. Groq model comparison, then decision brief with numeric grounding. (Must)
8. M2 attribution. (Should)
9. Customer message drafts. (Should)
10. API additions, contract, mocks, scorecard, `docs/PAYMENT_INTELLIGENCE.md` explaining data sources (real vs synthetic), models, graph and evaluation. (Must, update as you go)
11. M3, D6 Olist join demo. (Could)

After each step: run tests, report files changed, the measured numbers, and what remains.

## 10. Override: no model may be trained on synthetic data (this section wins over sections 3 and 8)

1. M2: do not train or save a model on synthetic transactions. Replace it with a per-investigation attribution analysis: fit a regularised logistic regression (or segment lift with interactions) on the incident's own data at run time, report the top factors as attribution evidence, store no model and claim no accuracy.
2. M1 stays: trained only on BANKING77 and real Play Store reviews, evaluated only on the human-checked real reviews. It is the system's one trained model.
3. Rename the hidden-truth scorecard to "simulation test (fire drill)" in the API, docs and UI labels. It shows the logic finds a planted fault; it is not real-world accuracy.
4. Real-data check (Should): run ingestion, clustering, M1 classification and signal detection on the real Play Store reviews over time, and report the real complaint clusters and spikes found. Make no root-cause claim on this data, because it has no payment logs.
5. In docs/PAYMENT_INTELLIGENCE.md add a table: component, data used, real or synthetic, what it proves, what it does not prove.
