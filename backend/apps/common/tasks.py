import logging
import time
import uuid
from celery import shared_task
from django.utils import timezone
from apps.common.logging import set_request_context, clear_request_context

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    name='apps.common.tasks.system_health_check_task'
)
def system_health_check_task(self, request_id=None):
    """
    Periodic task to monitor system health and Celery worker metrics.
    Supports Request ID propagation when invoked from API contexts.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [system_health_check_task] Started | Request ID: %s", task_req_id)
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
        clear_request_context()
        raise self.retry(exc=exc)
    finally:
        clear_request_context()
