from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import TravelRequest
from .serializers import TravelRequestSerializer


class TravelRequestCreateView(generics.CreateAPIView):
    serializer_class = TravelRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
