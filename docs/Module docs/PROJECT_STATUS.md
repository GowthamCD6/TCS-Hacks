# RecoverIQ Project Status

Status as of 2026-10-31. **Nothing is committed or pushed.** All operational data and demo scores are synthetic.

**Phase 3:** product domain code is built on `?domain=product`, but it has only had an in-memory court check and has never run through the API or a database.

## Summary

The backend, AI service and M1 model are built. The core flow passed on a **local MySQL test database**, but the final Phase 2 code has only had smoke checks. It has **never run on TiDB**, and the frontend is **not connected**.

| Area | Status |
|---|---|
| Node backend | Built, core flow tested locally |
| Python AI service | Built, core flow tested locally |
| Payment funnel and reconciliation | Built, smoke-checked |
| Root Cause Court upgrade | Built, smoke-checked |
| Knowledge graph | Built, smoke-checked |
| Decision brief | Built. Template works; the only live Groq attempt fell back to it |
| M1 intent model | Trained. Weak on payment classes, no human score yet |
| Groq | Connected, test call passed |
| TiDB setup | **Not done** |
| Frontend | Not connected. Prompt written in `docs/FRONTEND_PROMPT.md` |
| Git commit | **Not done** |

## Phase 1: completed

**Node backend (`server/`)**
- Express API with response envelope, errors, request IDs, rate limits, CORS, Helmet and redacted logs
- Additive SQL migrations, using `mysql2` instead of Prisma
- Ingestion: feedback API, website form, CSV with template, Google Forms webhook, simulated external adapters, operational events
- Database-backed worker with retries and idempotent ingestion
- Detection, incident lifecycle, agent trace, evidence, reassessment diffs
- Approvals, safe alternatives after rejection, idempotent simulated actions
- Simulated clock, KPI generator, recovery verification
- JWT login, owner token, audit log, issue graph, timeline, dashboard
- `MOCK_MODE` recorded from the live API

**Python AI service (`ai_services/`)**
- FastAPI with service token and read-only data access
- Signal detection, clustering, segment lift, Root Cause Court, impact, recommendations
- Tool-calling agent with full trace, plus no-LLM mode
- Deterministic synthetic data and hidden-truth scorecard

**Last full Phase 1 results (local MySQL, no LLM)**

| Check | Result |
|---|---|
| Python tests | 34 passed |
| Node tests | 23 passed |
| Golden path | Passed |
| Jury scenarios | All 5 behaved as expected |
| Scorecard checks | 7 of 7 |
| Incident precision / recall | 1.0 / 1.0 |
| Hypothesis verdict accuracy | 1.0 |
| Detection delay | 54 hours |
| Refund precision / recall | 1.0 / 0.8 |
| Ineligible refunds | 0 |

These predate Phase 2. They come from a dataset generated for this project, so they are not real-world accuracy.

## Phase 2: completed

| Step | Result |
|---|---|
| Funnel events | Added to the generator and `operational_events` |
| Data size | 5,000 customers, 42,972 orders, 263,952 events, 2,382 feedback rows |
| Decoys H2 to H4 | Bank outage, gateway callback failure, order service outage |
| `funnel_breakpoint` | Correct stage for all 4 plants in the smoke check |
| `reconcile` | Five payment states; now the basis for refunds and impact |
| Court upgrade | Telemetry must match each hypothesis's predicted stage |
| Overlap rule | Narrower hypothesis preferred; broader one marked `overlapping` |
| Knowledge graph | Storage, `fact_kind`, superseded edges, run diff, `shared_components` |
| Numeric grounding | Passes formatted real values and catches invented ones |
| Decision brief | Schema check, retry, then template fallback |
| Hypothesis proposer | Validator rejects untestable proposals; not run live |
| New endpoints | Funnel, reconciliation, decision-brief, shared-components, models, simulation-test |
| Hybrid routing | Confident M1 results used; the rest fall back to LLM or rules |

**Court smoke results**

| Plant | Funnel stage | Verdict |
|---|---|---|
| H1 App v2.3 | `client_confirm_call` | `release_2.3_android` supported, 0.95 |
| H2 Bank outage | `bank_debit_success` | `bank_outage` supported, 0.95 |
| H3 Gateway callback | `gateway_callback_received` | `gateway_callback_failure` supported, 0.805 |
| H4 Order service | `order_created` | `order_service_outage` supported, 0.902 |

## Data and model training

**Real data downloaded**

| Dataset | Size | Notes |
|---|---|---|
| BANKING77 | 13,083 rows | 17 intents mapped to the taxonomy |
| Google Play reviews | 10,279 reviews | Swiggy and Zomato, 2025-11-01 to 2026-10-30. User names not stored. Zomato's 2-star query returned 0 |

**Labelling:** Groq labelled 1,420 of 1,500 reviews with `qwen/qwen3.8-27b`; 80 failed on rate limits. 200 reviews are set aside in `data/labels/gold_review_labels.csv`, with `human_label` blank.

**M1, the only trained model**
- Frozen MiniLM embeddings with class-weighted Logistic Regression
- Trained on BANKING77 and real Play reviews, with no synthetic rows
- Saved to `ai_services/models/m1_intent/`, with results in `ai_services/eval/m1_report.json`

**M1 results on 183 held-out reviews.** This is agreement with LLM labels, not accuracy.

| Measure | Result |
|---|---|
| M1 macro-F1 | 0.45 |
| TF-IDF baseline macro-F1 | 0.40 |
| M1 broad category agreement | 0.62 |
| Rule extractor broad category agreement | 0.28 |
| Share routed to LLM | 30% |

| Class | F1 |
|---|---|
| `price_complaint` | 0.88 |
| `delivery_delay` | 0.69 |
| `praise_or_neutral` | 0.64 |
| `food_quality` | 0.64 |
| `app_bug_other` | 0.51 |
| `refund_or_reversal_status` | 0.38 |
| `debited_not_fulfilled` | 0.32 |
| `double_or_unrecognised_charge` | 0.00 |
| `payment_failed_or_declined` | 0.00 |

**Main weakness:** payment classes matter most and score lowest. Only 35 double-charge, 15 failed and 4 pending reviews were labelled.

**Human-checked score:** not available until the gold labels are filled in.

## LLM status

- `LLM_PROVIDER=groq`, `GROQ_MODEL=qwen/qwen3.8-27b`, both in `ai_services/.env`.
- The full model comparison was skipped by decision, so this model is not proven best.
- In an early unfair test it scored 5 of 5 on extraction, against 2 of 5 for `openai/gpt-oss-20b` and `openai/gpt-oss-120b`. Their replies were being cut off by token limits at the time.
- The limit is 8,000 tokens a minute, and it caused all the labelling failures.
- The one live brief failed grounding, then failed its schema on retry, so the template was used.

## Pending

### Must finish

1. Fix any problems from the first full test run below.
2. Run the TiDB setup, then generate and seed the data:

   ```powershell
   conda activate torch_gpu
   cd C:\TCS-Hacks\server
   npm run migrate
   node scripts/create-readonly-user.js
   npm run seed
   ```

3. Start both services on ports 5000 and 8000, then run `npm run demo:run`.
4. Check that M1 has not changed the demo. It now classifies confident feedback, and this has not been run through detection.
5. Run `npm run capture:mocks`, then `npm run contract`. Mock responses for the new endpoints are missing.
6. Get a live decision brief to pass grounding.
7. Commit and push, so the frontend can use the new API.
8. Build the frontend from `docs/FRONTEND_PROMPT.md`, then turn mock mode off.

### Still to do

- Run all Python and Node tests on Phase 2 code. `docs/TODO_TESTS.md` has the list.
- Fill in the 200 gold labels, then rerun `python -m ai_services.scripts.train_m1`.
- Improve payment classes: merge pending with failed, and label more payment reviews.
- Extend the simulation test with funnel, H1 to H4 and reconciliation accuracy. Only its label was renamed, so those results are not in the scorecard.
- Measure the new detection delay. The 54-hour figure predates Phase 2.
- Write `docs/PAYMENT_INTELLIGENCE.md`, including the table of real and synthetic data.
- Update `docs/AI_SERVICE_CONTRACT.md` and `docs/DATABASE_SCHEMA.md` for Phase 2.
- Add `networkx`, `pyyaml`, `joblib` and `google-play-scraper` to `ai_services/requirements.txt`.
- Check the baseline in `data/calibration.json` against an NPCI figure. It is an assumption for now.
- Connect a real Google Form.

### Skipped by decision

M2 attribution, M3, customer message drafts, Olist, real-data check, full model comparison, and the explain-path and impact-neighbourhood tools.

## Decisions to review

- **`mysql2` instead of Prisma:** Prisma does not officially support TiDB.
- **Refund wait of 24 hours:** this stopped a refund on an order that later reversed, and is why refund recall was 0.8.
- **iOS scenario:** the release moved to `rejected` in Phase 1 testing. That may be too harsh, because the Android evidence remains. It has not been rechecked since the funnel change.
- **Old FastAPI scaffold:** `server/app/` is unused and can be deleted.
- **Old `eval` code:** `ai_services/tools/custom_tools.py` uses `eval`. It is unused and should be removed.

## Problems during the build

- **TiDB access:** a permission check blocked my connection, so all testing used a local MySQL copy.
- **`torch_gpu` environment:** installing `datasets` upgraded `huggingface-hub` and broke embeddings. I pinned it to 0.36.2, and embeddings work again.
- **Groq rate limits:** my first labelling delay was too short. Slowing it fixed most failures.

## Security actions

- Revoke both Groq keys, because they were pasted into chat.
- Rotate the TiDB password, JWT secret and owner token before shared use, because they were also pasted into chat.
