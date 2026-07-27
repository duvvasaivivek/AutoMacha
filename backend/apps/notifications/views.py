from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related('sender').order_by('-created_at')


class NotificationUnreadCountView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        notification = get_object_or_404(Notification, pk=kwargs['pk'])
        if notification.user != request.user:
            raise PermissionDenied("You do not have permission to modify this notification.")

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success"}, status=status.HTTP_200_OK)
