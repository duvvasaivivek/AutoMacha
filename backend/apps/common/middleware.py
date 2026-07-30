"""
Request ID Tracking & Performance Logging Middleware.
"""
import logging
import time
import uuid
from django.conf import settings
from django.db import connection
from .logging import set_request_context, clear_request_context
from .metrics import metrics_registry

logger = logging.getLogger('api.request')
sec_logger = logging.getLogger('security')
db_logger = logging.getLogger('db.query')

SLOW_REQUEST_THRESHOLD_MS = getattr(settings, 'SLOW_REQUEST_THRESHOLD_MS', 1000)
SLOW_QUERY_THRESHOLD_MS = getattr(settings, 'SLOW_QUERY_THRESHOLD_MS', 200)


class RequestLoggingMiddleware:
    """
    Middleware that assigns a unique Request ID (X-Request-ID) to every incoming HTTP request,
    attaches it to request.request_id, tracks execution duration, logs performance metrics,
    and sets the X-Request-ID response header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Extract or generate Request ID
        incoming_request_id = request.headers.get('X-Request-ID') or request.META.get('HTTP_X_REQUEST_ID')
        request_id = incoming_request_id.strip() if incoming_request_id else str(uuid.uuid4())
        
        # 2. Attach request.request_id for global access during request handling
        request.request_id = request_id

        # 3. Extract Client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR', '-')

        # 4. Extract User Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '-')

        # 5. Extract Authenticated User info
        user_id = '-'
        username = 'anonymous'
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = str(request.user.id)
            username = request.user.username

        # 6. Set thread-local context for all loggers
        context = {
            'request_id': request_id,
            'user_id': user_id,
            'username': username,
            'client_ip': client_ip,
            'user_agent': user_agent,
            'http_method': request.method,
            'path': request.path,
        }
        set_request_context(context)

        start_time = time.time()

        logger.info(
            "Incoming %s request to %s from %s (User-Agent: %s)",
            request.method,
            request.path,
            client_ip,
            user_agent,
        )

        try:
            response = self.get_response(request)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                "Request failed with unhandled exception [%s]: %s | Duration: %.2fms",
                exc.__class__.__name__,
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

        # Warn if endpoint execution is slow (> 1000ms threshold)
        if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow API Endpoint Detected: %s %s took %.2fms (Threshold: %dms)",
                request.method,
                request.path,
                duration_ms,
                SLOW_REQUEST_THRESHOLD_MS,
            )

        # 7. Record Metrics
        metrics_registry.record_http_request(request.method, request.path, response.status_code, duration_ms)

        # 8. Inject X-Request-ID into response header
        response['X-Request-ID'] = request_id
        clear_request_context()
        return response


class SecurityHeadersMiddleware:
    """
    Middleware that enforces security hardening response headers across all requests.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Enforce OWASP Security Headers
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.setdefault('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
        response.headers.setdefault(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:;"
        )

        return response


class DatabaseQueryLoggerMiddleware:
    """
    Middleware that monitors database queries per request, records latency metrics,
    and logs queries exceeding SLOW_QUERY_THRESHOLD_MS (200ms).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        initial_queries = len(connection.queries)
        response = self.get_response(request)

        queries = connection.queries[initial_queries:]
        for q in queries:
            try:
                q_time = float(q.get('time', 0)) * 1000
            except (ValueError, TypeError):
                q_time = 0.0

            is_slow = q_time > SLOW_QUERY_THRESHOLD_MS
            metrics_registry.record_db_query(q_time, is_slow=is_slow)

            if is_slow:
                sql_snippet = q.get('sql', '').replace('\n', ' ')[:200]
                db_logger.warning(
                    "Slow Database Query Detected: %.2fms | SQL: %s",
                    q_time,
                    sql_snippet,
                )

        return response
