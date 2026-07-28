"""
Request Logging Middleware for request tracking, execution timing, and security context.
"""
import logging
import time
import uuid
from .logging import set_request_context, clear_request_context

logger = logging.getLogger('api.request')
sec_logger = logging.getLogger('security')


class RequestLoggingMiddleware:
    """
    Middleware to inject unique X-Request-ID, measure performance duration,
    and log every incoming request and response safely.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate or extract Request ID
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        request.request_id = request_id

        # Extract Client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR', '-')

        # User details (if authenticated)
        user_id = '-'
        username = 'anonymous'
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = str(request.user.id)
            username = request.user.username

        # Set thread-local request context for logger records
        context = {
            'request_id': request_id,
            'user_id': user_id,
            'username': username,
            'client_ip': client_ip,
            'http_method': request.method,
            'path': request.path,
        }
        set_request_context(context)

        start_time = time.time()

        logger.info("Incoming %s request to %s", request.method, request.path)

        try:
            response = self.get_response(request)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                "Request failed with unhandled exception: %s | Duration: %.2fms",
                str(exc),
                duration_ms,
                exc_info=exc,
            )
            clear_request_context()
            raise exc

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Log completion status
        if response.status_code >= 500:
            logger.error("Response %d for %s %s | Duration: %.2fms", response.status_code, request.method, request.path, duration_ms)
        elif response.status_code in (401, 403):
            sec_logger.warning("Unauthorized/Forbidden %d response for %s %s | Duration: %.2fms", response.status_code, request.method, request.path, duration_ms)
        elif response.status_code >= 400:
            logger.warning("Response %d for %s %s | Duration: %.2fms", response.status_code, request.method, request.path, duration_ms)
        else:
            logger.info("Response %d for %s %s | Duration: %.2fms", response.status_code, request.method, request.path, duration_ms)

        # Warn if endpoint execution is slow (> 500ms)
        if duration_ms > 500:
            logger.warning("Slow API Endpoint Detected: %s %s took %.2fms", request.method, request.path, duration_ms)

        response['X-Request-ID'] = request_id
        clear_request_context()
        return response
