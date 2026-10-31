# RecoverIQ

Autonomous customer experience recovery for a food-delivery platform, from customer signal to verified recovery. Built for a TCS AI hackathon. All demo data and metrics are synthetic.

**Flow:** customer signals → emerging issue detection → clustering → affected segments → Root Cause Court → business impact → ranked recovery plan → human approval → simulated action → KPI verification.

| Folder | What it is | Port |
|---|---|---|
| `server/` | Node.js and Express. The system of record and the only database writer | 5000 |
| `ai_services/` | Python and FastAPI. Reads through a read-only user, computes, returns results | 8000 |
| `client/` | React frontend | 5173 |

**Start here:** [Local setup](docs/LOCAL_SETUP.md), [API contract](docs/API_CONTRACT.md), [Demo script](docs/DEMO.md), [AI service contract](docs/AI_SERVICE_CONTRACT.md), [Database schema](docs/DATABASE_SCHEMA.md).

Recovery actions are simulated. No real money, customer message or production flag is ever touched.
