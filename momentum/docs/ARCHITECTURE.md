# Momentum Architecture

## Monorepo Layout

```text
apps/
  api/       FastAPI backend
  web/       Next.js frontend
  worker/    Celery background jobs
packages/
  scoring/      KPI scoring engine
  kpi_catalog/  reusable KPI catalog
  carbon/       carbon estimation helpers
infra/
  docker/       local Docker services
docs/           discovery and architecture notes
```

## Backend

FastAPI owns tenant-scoped API routes, persistence boundaries, and measurement workflows.

Initial API modules:

- `health`: readiness endpoint
- `tenants`: tenant-facing metadata
- `initiatives`: internal communication, event, and CSR initiatives
- `kpis`: KPI catalog and scoring endpoints

## Frontend

Next.js provides the SaaS dashboard and workspace experience. MVP screens should prioritize the actual working dashboard over marketing pages.

## Worker

Celery handles background scoring recalculation, imports, and carbon estimate refreshes.

## Domain Packages

- `packages/scoring`: deterministic scoring logic and score models
- `packages/kpi_catalog`: KPI definitions and catalog lookup
- `packages/carbon`: carbon factor models and estimate helpers

## Multi-Tenancy

Every persisted business entity must include a tenant boundary. API handlers should accept tenant context explicitly until authentication is implemented.

## Data Quality

Measured and estimated values must be represented distinctly in backend models, scoring, and frontend copy.
