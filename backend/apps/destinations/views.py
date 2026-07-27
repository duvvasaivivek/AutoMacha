from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Destination
from .serializers import DestinationSerializer


class DestinationListView(generics.ListAPIView):
    """
    Public endpoint — intentionally allows unauthenticated access.
    Destinations are displayed on the public home page for all visitors.
    """
    queryset = Destination.objects.all().order_by('name')
    serializer_class = DestinationSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Destinations are a small, fixed list — no pagination needed
