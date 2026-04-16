from celery import Celery

celery_app = Celery(
    "momentum_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.task_routes = {
    "momentum_worker.tasks.*": {"queue": "momentum"},
}
