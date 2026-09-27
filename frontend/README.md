# Support Ticket Triage — Frontend

## Overview

A responsive support-operations UI for sending tickets to the existing FastAPI model, reviewing category and sentiment-based urgency, and viewing tickets persisted in MySQL. The browser does not classify text, calculate sentiment, or save ticket records independently.

## Architecture

Pages use a single API service for HTTP calls. `POST /api/v1/predictions` performs inference and persists both the original ticket and prediction before returning the record. The app then prepends that returned record to the visible history; after refresh, `GET /api/v1/tickets?limit=10` reloads history from MySQL. Dashboard counts come from `GET /api/v1/statistics`, while classifier evaluation metrics come separately from `GET /api/v1/metrics` and the training evaluation artifact.

## Tech Stack

- React and Vite (JavaScript)
- Axios for the FastAPI service boundary
- React Router for navigation
- Recharts for the database-derived category chart
- CSS and Lucide icons

## Project Structure

```text
src/
  components/       Shared analyzer, dashboard, layout, and pipeline UI
  data/categories.js Category labels and chart colors only
  pages/            Dashboard, analyzer, pipeline, model information
  services/api.js   Validated FastAPI requests and response normalization
  utils/            Urgency display helpers
  App.jsx
  index.css
```

## Environment Variables

Copy the repository root `.env.example` to `.env` and configure the MySQL database there. For Vite, `frontend/.env` contains only the public backend URL:

```env
VITE_API_URL=http://localhost:8000
```

Vite variables are exposed to the browser; never put DB credentials or secrets in `frontend/.env`.

## Running Locally

First configure and start MySQL, then start FastAPI from the repository root after training the model:

```powershell
python -m uvicorn ticket_triage.api:app --reload
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Check the production bundle with `npm run build`.

## API Contract

All calls are implemented in `src/services/api.js`:

- `analyzeTicket(text)` calls `POST /api/v1/predictions` with `{ "text": "..." }` and validates category, team, status and 0–1 urgency.
- `getTickets(limit)` calls `GET /api/v1/tickets?limit=10` for persisted recent records.
- `getTicket(ticketId)` calls `GET /api/v1/tickets/{ticket_id}`.
- `getStatistics()` calls `GET /api/v1/statistics` for MySQL totals, mean urgency, and category counts.
- `getMetrics()` calls `GET /api/v1/metrics` for the saved training evaluation, never live-ticket accuracy.
- `checkBackendHealth()` calls `GET /api/v1/health` and marks the system connected only when MySQL, the model and required NLP resources are ready.

The front end never makes a second save request after `/api/v1/predictions`; persistence is part of the backend endpoint.

## Available Routes

- `/` — database-backed totals, urgency, predicted category distribution, evaluation accuracy, and recent tickets
- `/analyze` — ticket submission and backend prediction
- `/pipeline` — category and independent urgency workflows
- `/model` — NLP implementation details and actual held-out metrics

## Error Handling

Empty ticket text is rejected before sending. Loading disables submission and edits. Network failures, MySQL/API errors, malformed responses, and missing tickets use user-safe messages. Failed requests retain the typed text. Backend status requires a successful health response that confirms the database and model are available.

## Backend Integration

The backend URL is controlled by `VITE_API_URL`. FastAPI CORS origins are controlled by root `TICKET_TRIAGE_CORS_ORIGINS` and default to the two local Vite hostnames. Production deployments should set their explicit frontend origin allowlist. MySQL credentials remain server-side; ticket text may contain sensitive customer data and this coursework database should only hold non-confidential demo content.
