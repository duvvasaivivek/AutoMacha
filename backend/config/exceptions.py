import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import PermissionDenied, NotAuthenticated, AuthenticationFailed

logger = logging.getLogger('apps')
error_logger = logging.getLogger('django')
sec_logger = logging.getLogger('security')


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    Preserves standard DRF API response contracts (e.g. validation error dicts/lists)
    while logging unhandled server errors safely to dedicated log files.
    """
    response = exception_handler(exc, context)

    request = context.get('request')
    path = request.path if request else '-'
    method = request.method if request else '-'

    if response is None:
        # Log unhandled 500 server errors with stack trace to errors.log
        error_logger.error(
            "Unhandled Server Exception [%s] on %s %s: %s",
            exc.__class__.__name__,
            method,
            path,
            str(exc),
            exc_info=exc,
        )
    else:
        # Log authorization / security violations
        if isinstance(exc, (PermissionDenied, NotAuthenticated, AuthenticationFailed)):
            sec_logger.warning(
                "Security Exception [%s] (%d) on %s %s: %s",
                exc.__class__.__name__,
                response.status_code,
                method,
                path,
                str(exc),
            )
        elif response.status_code >= 400:
            logger.warning(
                "API Exception [%s] (%d) on %s %s: %s",
                exc.__class__.__name__,
                response.status_code,
                method,
                path,
                str(exc),
            )

    return response
