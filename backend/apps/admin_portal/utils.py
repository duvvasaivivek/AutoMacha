import logging
from .models import AuditLog

logger = logging.getLogger('security')


def log_audit_event(request, action, affected_object, details=None):
    """
    Utility function to log admin operations into AuditLog model and security logger.
    """
    request_id = getattr(request, 'request_id', '') or request.headers.get('X-Request-ID', '')
    ip_address = getattr(request, 'client_ip', '') or request.META.get('REMOTE_ADDR', '')
    user = request.user if request and request.user.is_authenticated else None
    user_name = user.username if user else 'Anonymous'

    audit_entry = AuditLog.objects.create(
        admin_user=user,
        action=action,
        affected_object=affected_object,
        details=details or {},
        request_id=request_id,
        ip_address=ip_address,
    )

    logger.info(
        "AUDIT EVENT | Admin: %s | Action: %s | Object: %s | IP: %s | ReqID: %s",
        user_name,
        action,
        affected_object,
        ip_address,
        request_id,
    )

    return audit_entry
