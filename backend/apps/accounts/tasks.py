import logging
import time
from celery import shared_task
from .services import cleanup_expired_otps

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.accounts.tasks.cleanup_expired_otps_task'
)
def cleanup_expired_otps_task(self):
    """
    Periodic task to clean up expired email verification OTP records.
    Runs hourly via Celery Beat.
    """
    logger.info("Task [cleanup_expired_otps_task] Started.")
    start_time = time.time()
    try:
        deleted_count = cleanup_expired_otps()
        duration = time.time() - start_time
        logger.info("Task [cleanup_expired_otps_task] Completed in %.2f seconds. Deleted: %d", duration, deleted_count)
        return {"deleted_count": deleted_count}
    except Exception as exc:
        logger.error("Task [cleanup_expired_otps_task] Failed: %s", str(exc), exc_info=exc)
        raise self.retry(exc=exc)
