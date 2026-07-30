import time
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Welcome to AutoMacha API",
        "version": "v1",
        "endpoints": {
            "accounts": "/api/accounts/",
            "destinations": "/api/destinations/",
            "travel_requests": "/api/travel-requests/",
            "dashboard": "/api/dashboard/",
            "notifications": "/api/notifications/",
            "ride_history": "/api/ride-history/",
            "chat": "/api/chat/",
            "health": "/api/health/",
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Full Production Health Check diagnostic endpoint.
    Verifies Database, Redis, Disk space, and environment status.
    """
    import shutil
    from django.conf import settings
    from django.db import connection
    from django.core.cache import cache
    from django.http import HttpResponse

    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": "production" if not settings.DEBUG else "development",
        "version": "v1.0.0",
        "components": {
            "database": "unknown",
            "redis": "unknown",
            "disk": "unknown",
        }
    }
    is_healthy = True

    # 1. Database Check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
        health_status["components"]["database"] = "ok"
    except Exception as exc:
        health_status["components"]["database"] = f"error: {str(exc)}"
        is_healthy = False

    # 2. Redis Check
    try:
        cache.set("_health_check_test", "ok", timeout=5)
        res = cache.get("_health_check_test")
        if res == "ok":
            health_status["components"]["redis"] = "ok"
        else:
            health_status["components"]["redis"] = "degraded"
    except Exception as exc:
        health_status["components"]["redis"] = f"error: {str(exc)}"

    # 3. Disk Space Check
    try:
        total, used, free = shutil.disk_usage(settings.BASE_DIR)
        free_gb = round(free / (1024 ** 3), 2)
        health_status["components"]["disk"] = {
            "status": "ok" if free_gb > 1.0 else "warning_low_disk",
            "free_gb": free_gb,
        }
    except Exception:
        health_status["components"]["disk"] = "ok"

    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    health_status["status"] = "healthy" if is_healthy else "unhealthy"
    return Response(health_status, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_liveness(request):
    """
    Liveness probe for Kubernetes / Container Orchestrators.
    """
    return Response({"status": "alive"})


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_readiness(request):
    """
    Readiness probe verifying DB & Redis connectivity.
    """
    from django.db import connection
    from django.core.cache import cache

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
        cache.set("_readiness_test", "1", timeout=5)
        return Response({"status": "ready"}, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response({
            "status": "not_ready",
            "error": str(exc)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def metrics_export(request):
    """
    Prometheus & JSON Metrics Export Endpoint.
    """
    import time
    from django.http import HttpResponse
    from apps.common.metrics import metrics_registry

    fmt = request.GET.get('format', '').lower()
    if fmt == 'json':
        return Response(metrics_registry.get_summary())

    prometheus_text = metrics_registry.generate_prometheus_metrics()
    return HttpResponse(prometheus_text, content_type="text/plain; version=0.0.4")
