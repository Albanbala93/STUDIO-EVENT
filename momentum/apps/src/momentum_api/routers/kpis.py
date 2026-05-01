from fastapi import APIRouter

from momentum_api.models import KPIRecommendationRequest, KPIValueIn
from momentum_kpi_catalog.advanced_catalog import ADVANCED_KPIS, recommend_kpis
from momentum_scoring.advanced_engine import DimensionSignal, score_momentum

router = APIRouter()


@router.get("/catalog")
def catalog():
    return [kpi.model_dump() for kpi in ADVANCED_KPIS]


@router.post("/recommend")
def recommend(payload: KPIRecommendationRequest):
    kpis = recommend_kpis(payload.initiative_type, payload.goals)
    return [kpi.model_dump() for kpi in kpis]


@router.post("/score")
def score(values: list[KPIValueIn]):
    signals = [
        DimensionSignal(
            kpi_id=value.kpi_id,
            value=value.value,
            provenance=value.provenance,
            confidence=value.confidence,
            method=value.method,
            dimension="reach",  # fallback, overwritten by catalog mapping in engine
        )
        for value in values
    ]

    result = score_momentum(signals)
    return result.model_dump()