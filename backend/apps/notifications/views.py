from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import IsOwner
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related('sender').order_by('-created_at')


from apps.common.cache_services import NotificationCacheService


class NotificationUnreadCountView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        def _fetch():
            return Notification.objects.filter(user=request.user, is_read=False).count()

        count = NotificationCacheService.get_unread_count(request.user.id, _fetch)
        return Response({"count": count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(views.APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def patch(self, request, *args, **kwargs):
        notification = get_object_or_404(Notification, pk=kwargs['pk'])
        self.check_object_permissions(request, notification)

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])
            NotificationCacheService.invalidate_unread_count(request.user.id)

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        NotificationCacheService.invalidate_unread_count(request.user.id)
        return Response({"status": "success"}, status=status.HTTP_200_OK)
