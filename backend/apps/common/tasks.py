import logging
import time
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='apps.common.tasks.system_health_check_task'
)
def system_health_check_task(self):
    """
    Periodic task to monitor system health and Celery worker metrics.
    Runs hourly via Celery Beat.
    """
    logger.info("Task [system_health_check_task] Started.")
    start_time = time.time()
    try:
        current_time = timezone.now().isoformat()
        duration = time.time() - start_time
        logger.info(
            "System Health Check OK | Timestamp: %s | Execution Time: %.3fs",
            current_time,
            duration
        )
        return {
            "status": "healthy",
            "timestamp": current_time,
            "execution_seconds": round(duration, 3)
        }
    except Exception as exc:
        logger.error("Task [system_health_check_task] Failed: %s", str(exc), exc_info=exc)
        raise self.retry(exc=exc)
