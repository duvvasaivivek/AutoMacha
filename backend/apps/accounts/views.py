from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .serializers import UserRegistrationSerializer


class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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
