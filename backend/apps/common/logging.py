"""
Structured Logging Formatter and Request Context Filter.
"""
import logging
import threading
from datetime import datetime, timezone

# Thread-local storage for request context (request_id, user, IP, user_agent, method, path)
_thread_locals = threading.local()


def get_request_context():
    return getattr(_thread_locals, 'request_context', {})


def set_request_context(context):
    _thread_locals.request_context = context


def clear_request_context():
    if hasattr(_thread_locals, 'request_context'):
        del _thread_locals.request_context


class RequestContextFilter(logging.Filter):
    """
    Enriches log records with request context attributes (request_id, user_id, username, client_ip, user_agent, method, path).
    """

    def filter(self, record):
        ctx = get_request_context()
        record.request_id = ctx.get('request_id', '-')
        record.user_id = ctx.get('user_id', '-')
        record.username = ctx.get('username', 'anonymous')
        record.client_ip = ctx.get('client_ip', '-')
        record.user_agent = ctx.get('user_agent', '-')
        record.http_method = ctx.get('http_method', '-')
        record.path = ctx.get('path', '-')
        return True


class StructuredFormatter(logging.Formatter):
    """
    Consistent, structured log entry formatter for terminal console and production log files.
    """

    def format(self, record):
        now = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()

        req_id = getattr(record, 'request_id', '-')
        user_info = getattr(record, 'username', 'anonymous')
        if getattr(record, 'user_id', '-') != '-':
            user_info = f"{user_info}#{record.user_id}"

        method = getattr(record, 'http_method', '-')
        path = getattr(record, 'path', '-')
        ip = getattr(record, 'client_ip', '-')

        log_msg = record.getMessage()

        # Format: ISO_TIMESTAMP | LEVEL | LOGGER | MOD.FUNC | req_id=UUID | user=USER#ID | ip=IP | METHOD PATH | MESSAGE
        formatted_message = (
            f"{now} | {record.levelname:<7} | {record.name} | "
            f"{record.module}.{record.funcName} | req_id={req_id} | "
            f"user={user_info} | ip={ip} | {method} {path} | {log_msg}"
        )

        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
            if record.exc_text:
                formatted_message += f"\n{record.exc_text}"

        return formatted_message


class JSONFormatter(logging.Formatter):
    """
    JSON structured log entry formatter for production log ingestion (Elasticsearch, CloudWatch, Datadog).
    """

    def format(self, record):
        import json
        now = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        ctx = get_request_context()

        log_data = {
            "timestamp": now,
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "func_name": record.funcName,
            "request_id": getattr(record, 'request_id', ctx.get('request_id', '-')),
            "user_id": getattr(record, 'user_id', ctx.get('user_id', '-')),
            "username": getattr(record, 'username', ctx.get('username', 'anonymous')),
            "client_ip": getattr(record, 'client_ip', ctx.get('client_ip', '-')),
            "user_agent": getattr(record, 'user_agent', ctx.get('user_agent', '-')),
            "http_method": getattr(record, 'http_method', ctx.get('http_method', '-')),
            "path": getattr(record, 'path', ctx.get('path', '-')),
            "message": record.getMessage(),
        }

        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
            log_data["exception"] = record.exc_text

        return json.dumps(log_data)
