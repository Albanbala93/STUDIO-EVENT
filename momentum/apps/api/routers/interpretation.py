from fastapi import APIRouter
from services.scoring.advanced_engine import DimensionSignal, score_momentum
from services.insights.insight_engine import interpret_score
from models.interpretation import InterpretationResponse

router = APIRouter(prefix="/kpis", tags=["KPI Interpretation"])


@router.post("/interpret", response_model=InterpretationResponse)
def interpret_from_signals(payload: list[DimensionSignal]):
    score_result = score_momentum(payload)
    return interpret_score(score_result)


@router.post("/score-and-interpret")
def score_and_interpret(payload: list[DimensionSignal]):
    score_result = score_momentum(payload)
    return {
        "score": score_result,
        "interpretation": interpret_score(score_result),
    }