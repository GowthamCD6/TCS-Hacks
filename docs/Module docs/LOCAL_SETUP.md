# Local Setup

All demo data and metrics are synthetic. Commands run from the repository root unless stated.

## Requirements

- Node.js 20 or later
- Python 3.10 or later. The `torch_gpu` conda env already has everything; otherwise `pip install -r ai_services/requirements.txt`
- A MySQL-compatible database

## 1. Configure

Copy `server/.env.example` to `server/.env` and `ai_services/.env.example` to `ai_services/.env`.
`AI_SERVICE_TOKEN` must match in both. Set `PYTHON_BIN` in `server/.env` to your Python, for example `C:/Users/nk/anaconda3/envs/torch_gpu/python.exe`.

## 2. Prepare the database and data

PowerShell:

```powershell
conda activate torch_gpu
python -m ai_services.scripts.prefetch_models
python -m ai_services.synthetic.generate
cd server
npm install
npm run migrate
node scripts/create-readonly-user.js
npm run seed
```

bash: the same commands. `npm run migrate` is additive and stops without changing anything if a table name already exists. Inspect those tables first; pass `--allow-existing` only if they are compatible. `npm run seed` adds synthetic rows and never removes data.

## 3. Run

Terminal 1, repository root:

```powershell
conda activate torch_gpu
python -m uvicorn ai_services.main:app --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
cd server
npm run dev
```

Check `http://localhost:5000/health`. It should report `database: ok` and `ai_service: ok`.

## 4. Verify

```powershell
cd server
npm run demo:run        # full golden path, stops at the first unmet expectation
npm test                # unit tests; integration tests are skipped
python -m pytest ai_services/tests -q   # from the repository root
```

Integration tests write rows, so they refuse to run unless `RIQ_INTEGRATION=1` and `DB_HOST` is local.

## Frontend without a backend

Set `MOCK_MODE=true` in `server/.env`, then `npm run dev`. No database or AI service is needed.

## LLM

The default `LLM_PROVIDER=none` runs everything with rules and templates, and marks incidents `partially_analyzed`. To enable Groq, set `LLM_PROVIDER=groq`, `GROQ_API_KEY` and `GROQ_MODEL` in `ai_services/.env`. Check the model ID against the current Groq catalogue.

## Reset

```powershell
$env:DEMO_RESET_CONFIRM = 'yes'; npm run demo:reset     # PowerShell
DEMO_RESET_CONFIRM=yes npm run demo:reset               # bash
```

This deletes synthetic incidents, their derived records and scenario rows, then rewinds the simulated clock. Seeded data and all non-synthetic records stay.

## Google Forms webhook

Google Forms does not send webhooks by itself. An Apps Script trigger does the forwarding.

1. Create a form with questions titled `Rating`, `Comment`, `Order reference`.
2. In the form, open Extensions, then Apps Script. Paste the script below.
3. In Project Settings, add script properties `RECOVERIQ_URL` (a public HTTPS URL for `/api/v1/ingestion/google-forms`, for example through ngrok) and `RECOVERIQ_TOKEN` (the value of `WEBHOOK_TOKEN`).
4. In Triggers, add `onFormSubmit` with the event type "On form submit".

```javascript
function onFormSubmit(e) {
  var props = PropertiesService.getScriptProperties();
  var answers = {};
  e.response.getItemResponses().forEach(function (r) { answers[r.getItem().getTitle()] = r.getResponse(); });
  var payload = {
    response_id: e.response.getId(),
    submitted_at: e.response.getTimestamp().toISOString(),
    rating: Number(answers['Rating']) || undefined,
    comment: answers['Comment'],
    order_reference: answers['Order reference'] || undefined,
  };
  for (var attempt = 0; attempt < 3; attempt++) {
    var res = UrlFetchApp.fetch(props.getProperty('RECOVERIQ_URL'), {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'X-Webhook-Token': props.getProperty('RECOVERIQ_TOKEN') },
      payload: JSON.stringify(payload),
    });
    if (res.getResponseCode() < 500) return;
    Utilities.sleep(2000 * (attempt + 1));
  }
}
```

Retries are safe: `response_id` is the idempotency key, so a repeat returns `duplicate: true`.

## External platforms

`POST /api/v1/ingestion/import/:platform` is a simulated adapter that normalises a supplied payload. No real platform is called. A real integration would authenticate with the platform's official API, then pass records to the same adapter.
