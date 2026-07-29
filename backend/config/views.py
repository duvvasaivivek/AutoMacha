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
    """Simple health check endpoint for load balancers and monitoring."""
    return Response({"status": "healthy"})
