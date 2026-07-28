import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def cleanup_expired_otps(retention_hours=None):
    """
    Deletes expired OTP / verification records older than retention period.
    Designed to be extensible when custom verification models are registered.
    """
    if retention_hours is None:
        retention_hours = getattr(settings, 'OTP_RETENTION_HOURS', 1)

    cutoff = timezone.now() - timedelta(hours=retention_hours)
    deleted_count = 0

    # Safely query if OTP/Verification token model exists in accounts or auth apps
    try:
        from apps.accounts.models import EmailOTP  # Future model hook if added
        deleted_count, _ = EmailOTP.objects.filter(created_at__lt=cutoff).delete()
    except (ImportError, AttributeError):
        # Default fallback log for environment without EmailOTP table
        pass

    logger.info("Cleaned up expired OTP verification records created before %s. Total deleted: %d", cutoff, deleted_count)
    return deleted_count
