from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Destination
from .serializers import DestinationSerializer


class DestinationListView(generics.ListAPIView):
    serializer_class = DestinationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Destination.objects.filter(is_active=True).order_by('name')
