from fastapi import FastAPI

from momentum_api.routers import health, initiatives, kpis, tenants


app = FastAPI(
    title="Momentum API",
    version="0.1.0",
    description="Measurement and insights API for internal comms, events, and CSR impact.",
)

app.include_router(health.router)
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(initiatives.router, prefix="/initiatives", tags=["initiatives"])
app.include_router(kpis.router, prefix="/kpis", tags=["kpis"])
