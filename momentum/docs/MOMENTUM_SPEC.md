# Momentum MVP Spec

## Positioning

Momentum is a B2B SaaS measurement and insights platform for internal communication, corporate events, and CSR / sustainability impact.

It is not an ecommerce project. The domain model should stay focused on measurement, initiatives, KPIs, and insight workflows.

## MVP Scope

The MVP should support:

- Tenant onboarding with organization-level data isolation
- Initiative tracking across internal communication, corporate events, and CSR / sustainability
- KPI capture with explicit `measured` or `estimated` provenance
- Scoring that combines KPI values with confidence and data completeness
- Carbon estimation for event and CSR reporting where exact measured data is unavailable
- Dashboard views that communicate trends, confidence, and missing data

## Out of Scope for MVP

- Financial ROI attribution that is not directly measured
- Ecommerce workflows
- Campaign automation and message sending
- Advanced identity provider integrations beyond a simple tenant/user model
- Marketplace or checkout concepts

## Core Concepts

### Tenant

A customer organization. All operational data must be tenant scoped.

### Initiative

A communication, event, or CSR / sustainability effort being measured.

### KPI

A defined metric with a unit, category, collection method, and provenance. KPI values must distinguish measured data from estimated data.

### Score

A computed insight that summarizes performance without hiding uncertainty. Scores must include confidence or data-quality context.

## MVP User Outcomes

- Communication leaders can see engagement and reach trends.
- Event teams can compare attendance, satisfaction, and footprint estimates.
- CSR teams can track sustainability activity while separating measured impact from estimated impact.
