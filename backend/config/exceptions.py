import logging
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    Preserves standard DRF API response contracts (e.g. validation error dicts/lists)
    while logging unhandled server errors safely.
    """
    response = exception_handler(exc, context)

    if response is None:
        # Log unhandled 500 server errors
        logger.error("Unhandled exception: %s", str(exc), exc_info=exc)

    return response
