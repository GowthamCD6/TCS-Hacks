# RecoverIQ Server

Node.js and Express backend: the system of record for feedback, incidents, approvals, actions and KPIs. See [docs/LOCAL_SETUP.md](../docs/LOCAL_SETUP.md).

```text
src/
  routes/        v1 routes, and mock routes for MOCK_MODE
  services/      business logic: detection, investigation, actions, KPIs, evidence
  repositories/  database access
  middleware/    envelope, errors, rate limits, auth
  validators/    Zod schemas
  jobs/          database-backed ingestion worker
  mocks/         responses recorded from the live API
db/migrations/   additive SQL
scripts/         migrate, seed, reset, demo-run, capture-mocks, build-contract
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start with reload |
| `npm run migrate` | Apply additive migrations |
| `npm run seed` | Load the synthetic dataset |
| `npm run demo:run` | Run the full golden path |
| `npm test` | Run tests |

`app/` and `requirements.txt` are the earlier FastAPI scaffold. Nothing uses them.
