import logging
import time
import uuid
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from apps.common.logging import set_request_context, clear_request_context

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=5,
    name='apps.common.tasks.send_email_async_task'
)
def send_email_async_task(self, subject, message, recipient_list, from_email=None, html_message=None, request_id=None):
    """
    Asynchronously delivers emails via SMTP/Django mail backend with automatic exponential backoff retries.
    Prevents HTTP views from blocking on network I/O.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [send_email_async_task] Sending email to %s | Subject: %s", recipient_list, subject)
    start_time = time.time()
    try:
        sent_count = send_mail(
            subject=subject,
            message=message,
            from_email=from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@automacha.edu'),
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        duration = time.time() - start_time
        logger.info("Task [send_email_async_task] Completed in %.2fs. Sent: %d", duration, sent_count)
        return {"sent_count": sent_count}
    except Exception as exc:
        logger.error(
            "Task [send_email_async_task] Failed (Attempt %d/%d): %s",
            self.request.retries + 1,
            self.max_retries,
            str(exc),
            exc_info=exc
        )
        clear_request_context()
        raise
    finally:
        clear_request_context()


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
