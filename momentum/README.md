# Momentum

Momentum is a B2B SaaS measurement and insights platform for internal communication, corporate events, and CSR / sustainability impact.

The first MVP focuses on:

- Multi-tenant campaign and initiative tracking
- KPI catalog definitions for measured and estimated metrics
- A scoring engine that separates engagement, reach, sustainability, and confidence
- Carbon estimation with explicit data quality markers
- Dashboards that avoid unsupported ROI claims

## Monorepo

```text
apps/
  api/       FastAPI backend
  web/       Next.js frontend
  worker/    Celery worker
packages/
  scoring/      KPI and confidence scoring
  kpi_catalog/  reusable KPI definitions
  carbon/       carbon estimation helpers
infra/
  docker/       local development services
docs/           discovery and architecture notes
```

## Local Development

The repository is scaffolded but dependencies are not vendored.

```powershell
# API
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e . ../../packages/scoring ../../packages/kpi_catalog ../../packages/carbon
uvicorn momentum_api.main:app --reload

# Web
cd apps/web
npm install
npm run dev
```
