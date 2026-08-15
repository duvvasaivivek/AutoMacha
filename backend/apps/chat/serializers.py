from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, ChatMessage

User = get_user_model()


class ChatMessageSenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'branch',
            'hostel',
            'phone_number',
            'institute_email',
        )
        read_only_fields = fields


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_user = ChatMessageSenderSerializer(source='sender', read_only=True)
    message = serializers.SerializerMethodField()
    ride_request_id = serializers.IntegerField(source='chat_room.ride_request_id', read_only=True)

    class Meta:
        model = ChatMessage
        fields = (
            'id',
            'chat_room',
            'ride_request_id',
            'sender',
            'sender_user',
            'message',
            'iv',
            'message_type',
            'is_read',
            'is_deleted_everyone',
            'created_at',
        )
        read_only_fields = ('id', 'chat_room', 'ride_request_id', 'sender', 'sender_user', 'message_type', 'is_read', 'is_deleted_everyone', 'created_at')

    def get_message(self, obj):
        if obj.is_deleted_everyone:
            return "This message was deleted"
        return obj.message


class ChatRoomSerializer(serializers.ModelSerializer):
    created_by_user = ChatMessageSenderSerializer(source='created_by', read_only=True)
    participant_users = ChatMessageSenderSerializer(source='participants', many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    destination_name = serializers.CharField(source='ride_request.destination.name', read_only=True)
    travel_datetime = serializers.DateTimeField(source='ride_request.travel_datetime', read_only=True)
    ride_status = serializers.CharField(source='ride_request.status', read_only=True)

    class Meta:
        model = ChatRoom
        fields = (
            'id',
            'ride_request',
            'created_by',
            'created_by_user',
            'participants',
            'participant_users',
            'destination_name',
            'travel_datetime',
            'ride_status',
            'is_active',
            'closed_at',
            'unread_count',
            'last_message',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_unread_count(self, obj):
        if hasattr(obj, 'annotated_unread_count'):
            return obj.annotated_unread_count

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return ChatMessage.objects.filter(
            chat_room=obj,
            is_read=False
        ).exclude(sender=request.user).exclude(deleted_for=request.user).count()

    def get_last_message(self, obj):
        if hasattr(obj, 'prefetched_last_msg_list'):
            last_msg = obj.prefetched_last_msg_list[0] if obj.prefetched_last_msg_list else None
        else:
            request = self.context.get('request')
            user = request.user if request and request.user.is_authenticated else None
            last_msg = obj.messages.exclude(deleted_for=user).last() if user else obj.messages.last()

        if not last_msg:
            return None
        return ChatMessageSerializer(last_msg, context=self.context).data
