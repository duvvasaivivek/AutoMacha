from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import TravelRequest
from .serializers import TravelRequestSerializer, TravelRequestListSerializer


class TravelRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TravelRequestSerializer
        return TravelRequestListSerializer

    def get_queryset(self):
        # Return only requests with status = OPEN, sorted by travel_datetime (earliest first)
        queryset = TravelRequest.objects.filter(status='OPEN').select_related('destination', 'user').order_by('travel_datetime')

        # Support optional query parameter: destination=<destination_id>
        destination_param = self.request.query_params.get('destination')
        if destination_param:
            queryset = queryset.filter(destination_id=destination_param)

        # Support optional query parameter: direction=TO_CAMPUS | FROM_CAMPUS
        direction_param = self.request.query_params.get('direction')
        if direction_param in ['TO_CAMPUS', 'FROM_CAMPUS']:
            queryset = queryset.filter(direction=direction_param)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
