# RecoverIQ — Autonomous CX Recovery Platform (Frontend)

Enterprise AI customer experience recovery frontend developed for the TCS AI Hackathon.

## Visual Design Theme
Styled after the modern obsidian/cosmic command-center aesthetic:
- Deep obsidian glassmorphic panels (`#0b0813`, `#120d22`, `#160f2e`) with backdrop blur and subtle glowing violet/purple aura.
- Color-coded severity and lifecycle status indicators.
- Interactive **CX Issue Relationship Graph** built with `@xyflow/react`.
- **Root Cause Court** verifying 5 evidential dimensions with Bayesian likelihood updates.
- Real-time **Agent Execution Trace** timeline showing tool inputs, outputs, and evidence references.
- **Evidence Explorer** with interactive injection for adaptive reassessment demonstrations.
- **Human-in-the-Loop Approvals** and sandbox-safe recovery simulations.
- **Post-Intervention KPI Telemetry** and recovery verification monitoring.

---

## Directory Architecture

```
client/
├── src/
│   ├── app/
│   │   ├── App.tsx             # Root application wrapper
│   │   ├── router.tsx          # React Router route definitions
│   │   └── providers.tsx       # TanStack Query Client provider
│   │
│   ├── components/
│   │   ├── layout/             # Shell layout with ambient aura and header
│   │   ├── navigation/         # Sidebar navigation and glowing top header
│   │   ├── common/             # Cards, StatCards, Badges, Modals, Drawers
│   │   ├── issue-graph/        # React Flow causal graph and custom workflow nodes
│   │   ├── root-cause/         # Root Cause Court hypothesis tests grid
│   │   ├── evidence/           # Evidence Explorer and Adaptive Injection Modal
│   │   ├── segments/           # Affected customer segments & lift ratio charts
│   │   ├── incidents/          # Business Impact financial breakdown
│   │   ├── agent-trace/        # Agent execution timeline & reasoning trace
│   │   ├── recommendations/    # Ranked recovery interventions list
│   │   ├── kpis/               # Recovery verification telemetry & trends
│   │   └── feedback/           # Multichannel feedback inbox widgets
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx       # Overview automation center & KPI charts
│   │   ├── FeedbackPage.tsx        # Filterable & searchable feedback inbox
│   │   ├── SignalsPage.tsx         # Detected early anomaly signals
│   │   ├── IncidentsPage.tsx       # Incidents case index
│   │   ├── IncidentDetailPage.tsx  # Incident investigation workspace
│   │   ├── ApprovalsPage.tsx       # Human-in-the-loop authorization desk
│   │   ├── RecoveryPage.tsx        # Executed recovery audit trail
│   │   └── IngestionPage.tsx       # CSV, Google Forms & API ingestion hub
│   │
│   ├── services/
│   │   ├── api.ts                  # Axios client with fallback configuration
│   │   ├── feedback.service.ts     # Feedback fetching and CSV batch imports
│   │   ├── incidents.service.ts    # Incidents, evidence, and adaptive injection
│   │   ├── signals.service.ts      # Signals detection and investigation trigger
│   │   ├── approvals.service.ts    # Recovery actions approval & execution
│   │   └── kpis.service.ts         # KPI telemetry and verification refresh
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript domain models
│   ├── mocks/
│   │   └── data.ts                 # TCS-Hacks demo incident dataset (INC-2026-084)
│   ├── styles/
│   │   └── globals.css             # Tailwind v4 theme, glassmorphism & glows
│   └── main.tsx                    # Application entrypoint
│
├── .env.example
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment options:
- `VITE_API_BASE_URL`: Base URL for the FastAPI backend (`http://localhost:5000/api/v1`).
- `VITE_USE_MOCKS`: `true` to run with the built-in reactive mock store (ideal for standalone demonstrations before backend deployment), or `false` to communicate with the live server.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 18-Step Live Jury Demonstration Walkthrough

1. **Overview Dashboard (`/`)**: View overall CX metrics, volume anomaly spikes, channel distributions, and active incidents.
2. **Feedback Inbox (`/feedback`)**: Inspect incoming customer complaints across Mobile App, Google Forms, Website, and Support Tickets.
3. **Emerging Signals (`/signals`)**: Notice `SIG-901` showing an anomalous +1133% volume spike in "Payment debited / No order placed".
4. **Investigate Signal**: Click **"Launch Deep Investigation"** on `SIG-901`.
5. **Open Incident Case (`/incidents/INC-2026-084`)**: Enter the incident investigation workspace.
6. **CX Issue Graph (Tab 1)**: Inspect the causal lineage nodes from feedback sources to recovery outcome.
7. **Node Inspection**: Click any node (e.g. `PR #4182` or `Hypothesis HYP-01`) to open the attribute drawer.
8. **Root Cause Court (Tab 2)**: Review tests across *Temporal*, *Segment specificity*, *Operational telemetry*, *Dose-response*, and *Counter-check*.
9. **Inspect Evidence (Tab 3)**: Examine verified code commits, Stripe webhooks, and Datadog APM traces.
10. **Affected Segments (Tab 4)**: Identify the 92x lift ratio isolated strictly to Android App v3.4.1 clients.
11. **Business Impact (Tab 5)**: Distinguish measured direct losses ($28,450) from estimated total risk ($41,200).
12. **Agent Execution Trace (Tab 6)**: Audit the multi-agent reasoning steps, tool queries, and durations.
13. **Review Recommendations (Tab 7)**: Inspect ranked interventions for feature-flag rollback and order rehydration.
14. **Approve Action**: Click **"Authorize & Execute Simulation"** and confirm the safety modal.
15. **Recovery Center (`/recovery`)**: Verify the executed simulation record in the audit log.
16. **KPI Verification (Tab 8)**: Observe payment failure rate dropping and complaint volume normalizing.
17. **Adaptive Evidence Injection**: Click **"Inject Evidence"** in the Evidence Explorer, choose preset *"Hotfix v3.4.2 Deployed"*, and click **"Inject & Trigger Adaptive Reassessment"**.
18. **Bayesian Confidence Shift**: Observe hypothesis confidence update dynamically to 98% and verification status transition to **Target Met**.
