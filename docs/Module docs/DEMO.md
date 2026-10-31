# Demo Script

All data shown is synthetic. Run `npm run demo:run` in `server/` beforehand to confirm everything works; it resets the demo first and leaves a resolved incident, so reset again before presenting.

Calls below go to `/api/v1` and need an approver token, except reads.

| Step | Call | Show the jury |
|---|---|---|
| 1. Start clean | `POST /demo/reset` with `{"DEMO_RESET_CONFIRM":"yes"}` | Empty incident list |
| 2. Detect | `POST /demo/run-detection` | One payment incident. Delivery and pricing signals are explained or watched, not escalated |
| 3. Investigate | `GET /incidents/:id`, `/graph`, `/agent-trace` | Tool-by-tool trace and issue graph |
| 4. Court | `GET /incidents/:id/hypotheses` | v2.3 on Android 14 UPI supported; rain, price, seasonal and gateway rejected, each with tests |
| 5. Impact | `GET /incidents/:id/impact` | Measured values separate from estimates |
| 6. Safety | Execute an unapproved action | 403 `APPROVAL_REQUIRED` |
| 7. Reject | `POST /demo/scenario/rollback_rejected` | Safe alternative with its trade-off |
| 8. Approve and act | `POST /approvals/:id/approve`, then `POST /incidents/:id/actions/:recId/execute` | Simulated result; status is `monitoring`, not resolved |
| 9. Too soon | `POST /demo/advance-clock` with `{"minutes":45}` | Still `monitoring`: the KPI window has not held |
| 10. Verified | `POST /demo/advance-clock` with `{"minutes":240}` | `resolved`, with the KPI chart |
| 11. Score | `POST /demo/evaluate` | Scorecard against hidden truth |

## Jury scenarios

Run `POST /demo/scenario/:name` on an active incident. `node scripts/scenario-check.js` rehearses them all.

| Scenario | Expected result on the seeded data |
|---|---|
| `hotfix_deployed` | Rollback and flag leave the plan, `monitor_hotfix` joins. No court test reruns |
| `ios_complaints` | Confidence falls from 0.95 to about 0.60. The release is no longer supported, the gateway hypothesis opens, and `escalate_gateway` joins the plan |
| `telemetry_missing` | Telemetry test becomes `untested`, confidence 0.65, refunds blocked, `restore_telemetry` joins the plan |
| `support_transcripts` | Verdict holds. Complaints and segment lift rise |
| `rollback_rejected` | Rollback is removed and the feature flag carries the stated trade-off |
| `relapse` (extra) | After a mitigation, KPIs worsen and the incident is `reopened` |

Notifying customers without a fix keeps the incident in `monitoring`: an executed action is not recovery.
