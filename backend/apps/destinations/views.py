from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.common.cache_services import DestinationCacheService
from .models import Destination
from .serializers import DestinationSerializer


class DestinationListView(generics.ListAPIView):
    """
    Public endpoint — intentionally allows unauthenticated access.
    Destinations are displayed on the public home page for all visitors.
    Cached in Redis using DestinationCacheService for high performance.
    """
    serializer_class = DestinationSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Destination.objects.filter(is_active=True).order_by('name')

    def list(self, request, *args, **kwargs):
        def _fetch():
            qs = self.get_queryset()
            serializer = self.get_serializer(qs, many=True)
            return serializer.data

        cached_data = DestinationCacheService.get_active_destinations(_fetch)
        return Response(cached_data)


class SavedDestinationListCreateView(generics.ListCreateAPIView):
    from rest_framework.permissions import IsAuthenticated
    from .serializers import SavedDestinationSerializer
    
    permission_classes = [IsAuthenticated]
    serializer_class = SavedDestinationSerializer
    pagination_class = None

    def get_queryset(self):
        from .models import SavedDestination
        return SavedDestination.objects.filter(user=self.request.user).select_related('destination').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedDestinationDeleteView(generics.DestroyAPIView):
    from rest_framework.permissions import IsAuthenticated
    
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models import SavedDestination
        return SavedDestination.objects.filter(user=self.request.user)
