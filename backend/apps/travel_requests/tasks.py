import logging
import time
import uuid
from celery import shared_task
from apps.common.logging import set_request_context, clear_request_context
from .services import expire_outdated_requests, notify_matches_for_request

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
    name='apps.travel_requests.tasks.dispatch_match_notifications_task'
)
def dispatch_match_notifications_task(self, travel_request_id, request_id=None):
    """
    Asynchronously finds matching travel request candidates and dispatches
    match notifications without delaying the travel request API creation response.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [dispatch_match_notifications_task] Started for TravelRequest #%s", travel_request_id)
    start_time = time.time()
    try:
        from .models import TravelRequest

        travel_request = TravelRequest.objects.select_related('user', 'destination').get(pk=travel_request_id)
        notify_matches_for_request(travel_request)
        duration = time.time() - start_time
        logger.info("Task [dispatch_match_notifications_task] Completed in %.2fs for TravelRequest #%s", duration, travel_request_id)
    except Exception as exc:
        logger.error("Task [dispatch_match_notifications_task] Failed for TravelRequest #%s: %s", travel_request_id, str(exc), exc_info=exc)
        clear_request_context()
        raise
    finally:
        clear_request_context()


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
