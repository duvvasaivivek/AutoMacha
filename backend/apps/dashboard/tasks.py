import logging
import time
import uuid
from celery import shared_task
from apps.common.logging import set_request_context, clear_request_context
from apps.admin_portal.services import get_admin_dashboard_stats
from apps.common.cache_services import DashboardCacheService

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.dashboard.tasks.refresh_dashboard_cache_task'
)
def refresh_dashboard_cache_task(self, request_id=None):
    """
    Pre-warms and refreshes the Admin Dashboard stats cache in Redis.
    Runs periodically via Celery Beat or on-demand.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [refresh_dashboard_cache_task] Started | Request ID: %s", task_req_id)
    start_time = time.time()
    try:
        stats = DashboardCacheService.get_admin_stats(get_admin_dashboard_stats)
        duration = time.time() - start_time
        logger.info("Task [refresh_dashboard_cache_task] Completed in %.2f seconds.", duration)
        return stats
    except Exception as exc:
        logger.error("Task [refresh_dashboard_cache_task] Failed: %s", str(exc), exc_info=exc)
        clear_request_context()
        raise self.retry(exc=exc)
    finally:
        clear_request_context()
