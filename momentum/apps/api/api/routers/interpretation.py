from fastapi import APIRouter
from api.services.scoring.advanced_engine import DimensionSignal, score_momentum
from api.services.insights.insight_engine import interpret_score
from api.models.interpretation import ScoreInterpretation

router = APIRouter(prefix="/kpis", tags=["KPI Interpretation"])


@router.post("/score-and-interpret")
def score_and_interpret(payload: list[DimensionSignal]):
    score_result = score_momentum(payload)
    interpretation = interpret_score(score_result)

    return {
        "score": score_result,
        "interpretation": interpretation,
    }


@router.post("/interpret", response_model=ScoreInterpretation)
def interpret_from_signals(payload: list[DimensionSignal]):
    score_result = score_momentum(payload)
    return interpret_score(score_result)