import logging
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView, RetrieveUpdateAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import CurrentUserSerializer, UserRegistrationSerializer, UserProfileSerializer


auth_logger = logging.getLogger('auth')


class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        auth_logger.info(
            "User Registration Success | User ID: %d | Username: %s | Roll Number: %s | Email: %s",
            user.id,
            user.username,
            user.roll_number,
            user.institute_email,
        )

        response_data = {
            "message": "User registered successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "roll_number": user.roll_number,
                "institute_email": user.institute_email,
            }
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


class CurrentUserView(RetrieveAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        # Check if profile_picture removal is explicitly requested (e.g. clear_picture=true or profile_picture='')
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('clear_picture') == 'true' or data.get('profile_picture') in ['', 'null', None]:
            if instance.profile_picture:
                instance.profile_picture.delete(save=False)
                instance.profile_picture = None
                instance.save()
            if 'profile_picture' in data and not isinstance(data['profile_picture'], (bytes, bytearray)):
                data.pop('profile_picture', None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        user = serializer.save()
        auth_logger.info("User Profile Updated | User ID: %d | Username: %s", user.id, user.username)

