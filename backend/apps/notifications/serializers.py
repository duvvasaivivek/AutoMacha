from rest_framework import serializers
from ..travel_requests.serializers import UserMinimalSerializer
from .models import Notification, WebPushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    sender_user = UserMinimalSerializer(source='sender', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'related_object_id', 'is_read', 'created_at', 'sender_user')
        read_only_fields = ('id', 'title', 'message', 'notification_type', 'related_object_id', 'created_at', 'sender_user')


class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ('endpoint', 'p256dh', 'auth')
