import logging
import time
from celery import shared_task
from .services import delete_old_read_notifications

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.notifications.tasks.cleanup_old_notifications_task'
)
def cleanup_old_notifications_task(self):
    """
    Periodic task to clean up read notifications older than retention days.
    Runs daily via Celery Beat.
    """
    logger.info("Task [cleanup_old_notifications_task] Started.")
    start_time = time.time()
    try:
        deleted_count = delete_old_read_notifications()
        duration = time.time() - start_time
        logger.info("Task [cleanup_old_notifications_task] Completed in %.2f seconds. Deleted: %d", duration, deleted_count)
        return {"deleted_count": deleted_count}
    except Exception as exc:
        logger.error("Task [cleanup_old_notifications_task] Failed: %s", str(exc), exc_info=exc)
        raise self.retry(exc=exc)
