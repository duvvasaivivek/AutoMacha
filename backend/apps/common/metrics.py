"""
Application Metrics Registry for Prometheus Exposition & Observability.
"""
import math
import os
import time
import threading
from collections import defaultdict


class MetricsRegistry:
    """
    Thread-safe Metrics Registry collecting HTTP, Database, Redis, Celery, WebSocket, and System metrics.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init_metrics()
            return cls._instance

    def _init_metrics(self):
        self.lock = threading.Lock()
        
        # HTTP Metrics
        self.http_requests_total = defaultdict(int)  # (method, endpoint, status) -> count
        self.http_latencies = defaultdict(list)     # (method, endpoint) -> list of durations in ms

        # Database Metrics
        self.db_queries_total = 0
        self.db_slow_queries_total = 0
        self.db_latencies = []

        # Redis Metrics
        self.redis_cache_hits_total = 0
        self.redis_cache_misses_total = 0
        self.redis_operation_durations = []

        # Celery Metrics
        self.celery_tasks_total = defaultdict(int)  # (task_name, status) -> count

        # WebSocket Metrics
        self.websocket_active_connections = 0
        self.websocket_messages_sent_total = 0
        self.websocket_messages_received_total = 0
        self.websocket_auth_failures_total = 0

    def record_http_request(self, method: str, endpoint: str, status_code: int, duration_ms: float):
        with self.lock:
            key = (method, endpoint, str(status_code))
            self.http_requests_total[key] += 1

            latency_key = (method, endpoint)
            latencies = self.http_latencies[latency_key]
            latencies.append(duration_ms)
            if len(latencies) > 1000:
                self.http_latencies[latency_key] = latencies[-1000:]

    def record_db_query(self, duration_ms: float, is_slow: bool = False):
        with self.lock:
            self.db_queries_total += 1
            if is_slow:
                self.db_slow_queries_total += 1
            self.db_latencies.append(duration_ms)
            if len(self.db_latencies) > 1000:
                self.db_latencies = self.db_latencies[-1000:]

    def record_redis_hit(self):
        with self.lock:
            self.redis_cache_hits_total += 1

    def record_redis_miss(self):
        with self.lock:
            self.redis_cache_misses_total += 1

    def record_celery_task(self, task_name: str, status: str):
        with self.lock:
            self.celery_tasks_total[(task_name, status)] += 1

    def websocket_connect(self):
        with self.lock:
            self.websocket_active_connections += 1

    def websocket_disconnect(self):
        with self.lock:
            self.websocket_active_connections = max(0, self.websocket_active_connections - 1)

    def record_websocket_message_sent(self):
        with self.lock:
            self.websocket_messages_sent_total += 1

    def record_websocket_message_received(self):
        with self.lock:
            self.websocket_messages_received_total += 1

    def record_websocket_auth_failure(self):
        with self.lock:
            self.websocket_auth_failures_total += 1

    def get_summary(self):
        with self.lock:
            total_requests = sum(self.http_requests_total.values())
            error_requests = sum(count for (m, e, s), count in self.http_requests_total.items() if int(s) >= 400)
            
            all_durations = [d for sublist in self.http_latencies.values() for d in sublist]
            avg_latency = round(sum(all_durations) / len(all_durations), 2) if all_durations else 0.0
            
            sorted_durations = sorted(all_durations)
            p95 = round(sorted_durations[math.ceil(0.95 * len(sorted_durations)) - 1], 2) if sorted_durations else 0.0
            p99 = round(sorted_durations[math.ceil(0.99 * len(sorted_durations)) - 1], 2) if sorted_durations else 0.0

            total_cache_ops = self.redis_cache_hits_total + self.redis_cache_misses_total
            hit_rate = round((self.redis_cache_hits_total / total_cache_ops) * 100, 2) if total_cache_ops > 0 else 0.0

            return {
                "http": {
                    "total_requests": total_requests,
                    "error_requests": error_requests,
                    "error_rate_percent": round((error_requests / total_requests) * 100, 2) if total_requests > 0 else 0.0,
                    "avg_latency_ms": avg_latency,
                    "p95_latency_ms": p95,
                    "p99_latency_ms": p99,
                },
                "database": {
                    "total_queries": self.db_queries_total,
                    "slow_queries": self.db_slow_queries_total,
                    "avg_query_latency_ms": round(sum(self.db_latencies) / len(self.db_latencies), 2) if self.db_latencies else 0.0,
                },
                "redis": {
                    "hits": self.redis_cache_hits_total,
                    "misses": self.redis_cache_misses_total,
                    "hit_rate_percent": hit_rate,
                },
                "celery": {
                    "task_counts": {f"{t}:{s}": c for (t, s), c in self.celery_tasks_total.items()},
                },
                "websockets": {
                    "active_connections": self.websocket_active_connections,
                    "messages_sent": self.websocket_messages_sent_total,
                    "messages_received": self.websocket_messages_received_total,
                    "auth_failures": self.websocket_auth_failures_total,
                }
            }

    def generate_prometheus_metrics(self) -> str:
        """
        Generates Prometheus exposition text format (version=0.0.4).
        """
        lines = []
        summary = self.get_summary()

        # HTTP Total
        lines.append("# HELP automacha_http_requests_total Total HTTP requests handled")
        lines.append("# TYPE automacha_http_requests_total counter")
        for (m, e, s), count in self.http_requests_total.items():
            lines.append(f'automacha_http_requests_total{{method="{m}",endpoint="{e}",status="{s}"}} {count}')

        # HTTP Latency
        lines.append("# HELP automacha_http_request_duration_seconds_avg Average HTTP request duration in seconds")
        lines.append("# TYPE automacha_http_request_duration_seconds_avg gauge")
        lines.append(f'automacha_http_request_duration_seconds_avg {summary["http"]["avg_latency_ms"] / 1000.0:.4f}')

        lines.append("# HELP automacha_http_request_duration_seconds_p95 95th percentile HTTP request duration in seconds")
        lines.append("# TYPE automacha_http_request_duration_seconds_p95 gauge")
        lines.append(f'automacha_http_request_duration_seconds_p95 {summary["http"]["p95_latency_ms"] / 1000.0:.4f}')

        lines.append("# HELP automacha_http_request_duration_seconds_p99 99th percentile HTTP request duration in seconds")
        lines.append("# TYPE automacha_http_request_duration_seconds_p99 gauge")
        lines.append(f'automacha_http_request_duration_seconds_p99 {summary["http"]["p99_latency_ms"] / 1000.0:.4f}')

        # Database
        lines.append("# HELP automacha_db_queries_total Total DB queries executed")
        lines.append("# TYPE automacha_db_queries_total counter")
        lines.append(f'automacha_db_queries_total {self.db_queries_total}')

        lines.append("# HELP automacha_db_slow_queries_total Total slow DB queries executed")
        lines.append("# TYPE automacha_db_slow_queries_total counter")
        lines.append(f'automacha_db_slow_queries_total {self.db_slow_queries_total}')

        # Redis
        lines.append("# HELP automacha_redis_hits_total Total Redis cache hits")
        lines.append("# TYPE automacha_redis_hits_total counter")
        lines.append(f'automacha_redis_hits_total {self.redis_cache_hits_total}')

        lines.append("# HELP automacha_redis_misses_total Total Redis cache misses")
        lines.append("# TYPE automacha_redis_misses_total counter")
        lines.append(f'automacha_redis_misses_total {self.redis_cache_misses_total}')

        # WebSockets
        lines.append("# HELP automacha_websocket_active_connections Current active WebSocket connections")
        lines.append("# TYPE automacha_websocket_active_connections gauge")
        lines.append(f'automacha_websocket_active_connections {self.websocket_active_connections}')

        lines.append("# HELP automacha_websocket_messages_sent_total Total WebSocket messages sent")
        lines.append("# TYPE automacha_websocket_messages_sent_total counter")
        lines.append(f'automacha_websocket_messages_sent_total {self.websocket_messages_sent_total}')

        lines.append("# HELP automacha_websocket_messages_received_total Total WebSocket messages received")
        lines.append("# TYPE automacha_websocket_messages_received_total counter")
        lines.append(f'automacha_websocket_messages_received_total {self.websocket_messages_received_total}')

        return "\n".join(lines) + "\n"


metrics_registry = MetricsRegistry()
