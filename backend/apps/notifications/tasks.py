import logging
import time
import uuid
from celery import shared_task
from apps.common.logging import set_request_context, clear_request_context
from .services import delete_old_read_notifications, create_notification

logger = logging.getLogger('apps.background_tasks')


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
    name='apps.notifications.tasks.send_notification_async_task'
)
def send_notification_async_task(self, user_id, title, message, notification_type, related_object_id=None, sender_id=None, request_id=None):
    """
    Asynchronously creates and delivers user notifications.
    Idempotent: Uses get_or_create to avoid duplicate notifications.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [send_notification_async_task] Started for User ID #%s", user_id)
    start_time = time.time()
    try:
        from apps.accounts.models import User

        user = User.objects.get(pk=user_id)
        sender = User.objects.filter(pk=sender_id).first() if sender_id else None

        notification, created = create_notification(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            related_object_id=related_object_id,
            sender=sender
        )
        
        if created:
            from .services import send_web_push
            send_web_push(user=user, title=title, message=message)
            
        duration = time.time() - start_time
        logger.info("Task [send_notification_async_task] Completed in %.2fs (Created: %s)", duration, created)
        return {"notification_id": notification.id, "created": created}
    except Exception as exc:
        logger.error("Task [send_notification_async_task] Failed: %s", str(exc), exc_info=exc)
        clear_request_context()
        raise
    finally:
        clear_request_context()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name='apps.notifications.tasks.cleanup_old_notifications_task'
)
def cleanup_old_notifications_task(self, request_id=None):
    """
    Periodic task to clean up read notifications older than retention days.
    Supports Request ID propagation when invoked from API contexts.
    """
    task_req_id = request_id or str(uuid.uuid4())
    set_request_context({'request_id': task_req_id})

    logger.info("Task [cleanup_old_notifications_task] Started | Request ID: %s", task_req_id)
    start_time = time.time()
    try:
        deleted_count = delete_old_read_notifications()
        duration = time.time() - start_time
        logger.info("Task [cleanup_old_notifications_task] Completed in %.2f seconds. Deleted: %d", duration, deleted_count)
        return {"deleted_count": deleted_count}
    except Exception as exc:
        logger.error("Task [cleanup_old_notifications_task] Failed: %s", str(exc), exc_info=exc)
        clear_request_context()
        raise self.retry(exc=exc)
    finally:
        clear_request_context()
