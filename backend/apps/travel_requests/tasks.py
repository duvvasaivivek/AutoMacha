import logging
import time
from celery import shared_task
from .services import expire_outdated_requests

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.travel_requests.tasks.expire_travel_requests_task'
)
def expire_travel_requests_task(self):
    """
    Periodic task to expire outdated open travel requests.
    Runs every 5 minutes via Celery Beat.
    """
    logger.info("Task [expire_travel_requests_task] Started.")
    start_time = time.time()
    try:
        expire_outdated_requests()
        duration = time.time() - start_time
        logger.info("Task [expire_travel_requests_task] Completed in %.2f seconds.", duration)
    except Exception as exc:
        logger.error("Task [expire_travel_requests_task] Failed: %s", str(exc), exc_info=exc)
        raise self.retry(exc=exc)
