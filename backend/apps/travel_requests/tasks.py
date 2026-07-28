import logging
import time
import uuid
from celery import shared_task
from apps.common.logging import set_request_context, clear_request_context
from .services import expire_outdated_requests

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.travel_requests.tasks.expire_travel_requests_task'
)
def expire_travel_requests_task(self, request_id=None):
    """
    Periodic task to expire outdated open travel requests.
    Runs every 5 minutes via Celery Beat or on-demand with request correlation ID.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [expire_travel_requests_task] Started | Request ID: %s", task_req_id)
    start_time = time.time()
    try:
        expire_outdated_requests()
        duration = time.time() - start_time
        logger.info("Task [expire_travel_requests_task] Completed in %.2f seconds.", duration)
    except Exception as exc:
        logger.error("Task [expire_travel_requests_task] Failed: %s", str(exc), exc_info=exc)
        clear_request_context()
        raise self.retry(exc=exc)
    finally:
        clear_request_context()
