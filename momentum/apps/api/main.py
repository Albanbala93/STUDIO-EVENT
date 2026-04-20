from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analytics, campaigns, interpretation, projects

app = FastAPI()

# Autorise le front Next.js (dev + éventuelles previews) à appeler l'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interpretation.router)
app.include_router(projects.router)
app.include_router(analytics.router)
app.include_router(campaigns.router)
