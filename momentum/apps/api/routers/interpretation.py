from fastapi import APIRouter
from services.scoring.advanced_engine import DimensionSignal, score_momentum
from services.insights.insight_engine import interpret_rse, interpret_score

router = APIRouter(prefix="/kpis", tags=["KPI Interpretation"])


@router.post("/interpret")
def interpret_from_signals(payload: list[DimensionSignal]):
    """Retourne score + interprétation principale + interprétation RSE.

    La couche RSE est additive : elle n'altère pas les champs `score` et
    `interpretation` préexistants, elle vient compléter la réponse pour
    exposer les piliers ESG.
    """
    score_result = score_momentum(payload)
    return {
        "score": score_result,
        "interpretation": interpret_score(score_result),
        "rse": interpret_rse(payload),
    }


@router.post("/score-and-interpret")
def score_and_interpret(payload: list[DimensionSignal]):
    score_result = score_momentum(payload)
    return {
        "score": score_result,
        "interpretation": interpret_score(score_result),
        "rse": interpret_rse(payload),
    }