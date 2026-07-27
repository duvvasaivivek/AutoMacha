from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..travel_requests.serializers import UserMinimalSerializer
from .models import Notification

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    sender_user = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'related_object_id', 'is_read', 'created_at', 'sender_user')
        read_only_fields = ('id', 'title', 'message', 'notification_type', 'related_object_id', 'created_at', 'sender_user')

    def get_sender_user(self, obj):
        if obj.notification_type in ['RIDE_SHARE_REQUEST_RECEIVED', 'RIDE_SHARE_REQUEST_ACCEPTED', 'RIDE_SHARE_REQUEST_DECLINED']:
            parts = obj.message.split(' ')
            if parts:
                username = parts[0]
                user = User.objects.filter(username=username).first()
                if user:
                    return UserMinimalSerializer(user).data
        return None
