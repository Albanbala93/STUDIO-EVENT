# AGENTS.md

## Instructions

Build a new B2B SaaS application called "Momentum".

This is NOT an ecommerce project.
Do NOT use shopify, cart, product or search patterns.

This is a measurement and insights platform for:
- internal communication
- corporate events
- CSR / sustainability impact

## Source of truth

Read:
- docs/MOMENTUM_SPEC.md
- docs/KPI_FRAMEWORK.md
- docs/ARCHITECTURE.md

## Execution rules

- Work step by step
- Start with product discovery
- Then create architecture
- Then scaffold the monorepo
- Then implement backend
- Then frontend
- Then tests and CI/CD

## Architecture expectations

Create a monorepo with:

- apps/api (FastAPI backend)
- apps/web (Next.js frontend)
- apps/worker (Celery)
- packages/scoring
- packages/kpi_catalog
- packages/carbon
- infra/docker
- docs/

## Important constraints

- Multi-tenant SaaS
- KPI-driven product
- Scoring engine is critical
- Avoid fake ROI claims
- Always distinguish measured vs estimated data

## First task

Start by:
1. refining the MVP scope
2. proposing architecture
3. scaffolding the repo
