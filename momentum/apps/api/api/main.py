from fastapi import FastAPI
from api.routers import kpis, interpretation

app = FastAPI()

app.include_router(kpis.router)
app.include_router(interpretation.router)