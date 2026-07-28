import logging
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import AutoDriver
from .serializers import AutoDriverSerializer, AutoDriverSuggestSerializer

logger = logging.getLogger('apps')


class AutoDriverListView(generics.ListAPIView):
    """
    Public directory endpoint returning verified & active auto drivers.
    Supports real-time search by driver full_name or phone_number via `?search=query`.
    """
    serializer_class = AutoDriverSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        queryset = AutoDriver.objects.filter(is_verified=True, is_active=True).order_by('full_name')

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | Q(phone_number__icontains=search)
            )

        return queryset


class AutoDriverSuggestView(generics.CreateAPIView):
    """
    Authenticated student endpoint to suggest a new auto driver.
    Submissions default to is_verified=False and require admin approval.
    """
    serializer_class = AutoDriverSuggestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = serializer.save(
            created_by=request.user,
            is_verified=False,
            is_active=True,
        )

        logger.info(
            "Auto Driver Suggested | Driver ID: %d | Name: %s | Phone: %s | Suggested By: %s",
            driver.id,
            driver.full_name,
            driver.phone_number,
            request.user.username,
        )

        return Response({
            "message": "Your driver suggestion has been submitted for review.",
            "driver": AutoDriverSerializer(driver).data
        }, status=status.HTTP_201_CREATED)


class MyAutoDriverSuggestionsView(generics.ListAPIView):
    """
    Authenticated student portal endpoint returning auto drivers suggested by the current user.
    """
    serializer_class = AutoDriverSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return AutoDriver.objects.filter(created_by=self.request.user).order_by('-created_at')
