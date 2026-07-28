import logging
import time
import uuid
from celery import shared_task
from apps.common.logging import set_request_context, clear_request_context
from .services import cleanup_expired_otps

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.accounts.tasks.cleanup_expired_otps_task'
)
def cleanup_expired_otps_task(self, request_id=None):
    """
    Periodic task to clean up expired email verification OTP records.
    Supports Request ID propagation when invoked from API contexts.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [cleanup_expired_otps_task] Started | Request ID: %s", task_req_id)
    start_time = time.time()
    try:
        deleted_count = cleanup_expired_otps()
        duration = time.time() - start_time
        logger.info("Task [cleanup_expired_otps_task] Completed in %.2f seconds. Deleted: %d", duration, deleted_count)
        return {"deleted_count": deleted_count}
    except Exception as exc:
        logger.error("Task [cleanup_expired_otps_task] Failed: %s", str(exc), exc_info=exc)
        clear_request_context()
        raise self.retry(exc=exc)
    finally:
        clear_request_context()
