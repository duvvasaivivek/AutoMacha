from django.core.cache import cache
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Destination
from .serializers import DestinationSerializer

CACHE_KEY_DESTINATIONS = 'automacha_active_destinations_v1'
CACHE_TTL = 3600  # 1 hour


class DestinationListView(generics.ListAPIView):
    """
    Public endpoint — intentionally allows unauthenticated access.
    Destinations are displayed on the public home page for all visitors.
    Cached in Redis for high concurrency.
    """
    serializer_class = DestinationSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Destination.objects.filter(is_active=True).order_by('name')

    def list(self, request, *args, **kwargs):
        try:
            cached_data = cache.get(CACHE_KEY_DESTINATIONS)
            if cached_data is not None:
                return Response(cached_data)
        except Exception:
            pass

        response = super().list(request, *args, **kwargs)
        try:
            cache.set(CACHE_KEY_DESTINATIONS, response.data, timeout=CACHE_TTL)
        except Exception:
            pass
        return response
