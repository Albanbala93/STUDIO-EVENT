from momentum_scoring import KPIValue, score_kpis

from momentum_worker.app import celery_app


@celery_app.task(name="momentum_worker.tasks.recalculate_score")
def recalculate_score(values: list[dict[str, object]]) -> dict[str, object]:
    score = score_kpis([KPIValue.model_validate(value) for value in values])
    return score.model_dump()
