# Audit Note — AIChatbotBuilder

Source: `_AUDIT/reports/batch_01.md` (Project 19)

## Maturity: SUBSTANTIVE (30 routes, 7 AI endpoints)

## Original audit recommendations

### Gaps & Opportunities
- Limited AI Coverage: expand AI to cover scheduling, optimization, forecasting, content generation.
- **Missing Notifications:** No notification system (email/SMS/push) for alerts/updates/engagement.
- **Missing Reporting:** No export/reporting module for data extraction or BI.

### Strategic Feature Suggestions
1. Omnichannel Routing Agent (SMS/email/chat/voice handoff).
2. Conversation Mining (auto-generate intents from logs).
3. Sentiment-triggered Escalation.
4. Integrations (Salesforce, HubSpot, Zendesk, Intercom, Shopify).

## Categorization
- **MECHANICAL:**
  - Notifications subsystem CRUD (in-memory + DB-backed best-effort).
  - Reports/export endpoints (summary, CSV, analytics JSON).
- **NEEDS-PRODUCT-DECISION:** Omnichannel routing, sentiment escalation, conversation mining (each requires NLP architecture decisions).
- **NEEDS-CREDS:** Salesforce/HubSpot/Zendesk integrations.

## Implementations applied
1. **`backend/routes/notifications.js`** — full notification subsystem:
   - `GET /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications`,
     `PUT /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`, `DELETE /api/notifications/:id`.
   - Defensively detects whether a `notifications` table exists; falls back to in-process Map.
2. **`backend/routes/reports.js`** — reporting & export subsystem:
   - `GET /api/reports/summary` — counts of major resources.
   - `GET /api/reports/conversations.csv` — CSV download.
   - `GET /api/reports/analytics.json` — dashboard payload.
   - All counts use a `safeCount` helper that returns 0 when a table is absent.
3. **`backend/server.js`** — mounted both routers under `/api/notifications` and `/api/reports`.

Syntax-checked with `node --check`.

## Backlog (prioritized)

### High priority
- **Conversation Mining AI endpoint** `/api/ai/mine-intents` — analyze last N conversation logs and propose intent/entity additions.
- **Sentiment-triggered escalation** middleware on `/api/ai/chat`: emit notification (now possible via /api/notifications) when negative sentiment > threshold.

### Medium priority
- **Email/SMS dispatcher** sitting on top of notifications (Nodemailer + Twilio). Currently /api/notifications stores rows only.
- **Omnichannel routing** — connector pattern for SMS, email, voice; large architectural change.

### Low priority
- CRM/helpdesk connectors (Salesforce, HubSpot, Zendesk, Intercom, Shopify) — credentials + per-tenant config.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — frontend already fully wired.

- `frontend/src/pages/Notifications.jsx` calls `/api/notifications` CRUD + unread-count + mark-all-read.
- `frontend/src/pages/Reports.jsx` calls reporting endpoints.
- `frontend/src/App.jsx` registers `/notifications` and `/reports` routes.
- Auth via `request()` helper (Bearer JWT from localStorage).

No FE edits this pass. Log: `_AUDIT/apply3_logs/ab3_54.md`.

## Apply pass 4 (mechanical backlog)

**Action:** IMPLEMENTED (2 features — both remaining MECHANICAL items from the high-priority backlog).

1. **`POST /api/ai/mine-intents`** — `backend/routes/aiBacklog.js`. Accepts an array of conversation snippets (or pulls from `conversations` table when absent), proposes up to N new intents with example utterances + suggested entities. Reuses `callOpenRouter` / `parseAIJson` / `saveAIResult` / `aiLimiter`. Returns HTTP 503 when `OPENROUTER_API_KEY` is missing.
2. **`POST /api/ai/sentiment-escalation`** — `backend/routes/aiBacklog.js`. Scores sentiment, returns `escalate` flag with explicit threshold logic on top of model output, includes recommended priority + suggested handoff message. Designed to be called from the chat pipeline so the existing `/api/notifications` subsystem can ingest the `escalate=true` events. Same 503 / helper pattern.
3. **`backend/server.js`** — mounts the new router under `/api/ai`.
4. **Frontend:**
   - `frontend/src/pages/AIBacklog.jsx` — new tabbed page (Mine Intents + Sentiment Escalation) with form, JWT bearer (via existing `request()` helper), 503 surfacing.
   - `frontend/src/api.js` — added `aiMineIntents`, `aiSentimentEscalation`.
   - `frontend/src/App.jsx` — registered `/ai-tools-mining` route.
   - `frontend/src/components/Sidebar.jsx` — added "Mining & Sentiment" nav item.

Syntax-checked with `node --check` (BE) and `esbuild --bundle=false` (FE). Live smoke: backend on :3401, login admin@chatbot.ai/password123, both new endpoints returned HTTP 200 with valid LLM JSON output. Log: `_AUDIT/apply4_logs/ab3_54.md`.

### Remaining backlog (deferred — non-mechanical)
- Email/SMS dispatcher on top of /api/notifications (NEEDS-CREDS — Nodemailer/Twilio).
- Omnichannel routing (NEEDS-PRODUCT-DECISION — large architectural change).
- CRM/helpdesk connectors: Salesforce, HubSpot, Zendesk, Intercom, Shopify (NEEDS-CREDS).
