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

    class Meta:
        model = ChatMessage
        fields = (
            'id',
            'chat_room',
            'sender',
            'sender_user',
            'message',
            'message_type',
            'is_read',
            'created_at',
        )
        read_only_fields = ('id', 'chat_room', 'sender', 'sender_user', 'message_type', 'is_read', 'created_at')


class ChatRoomSerializer(serializers.ModelSerializer):
    created_by_user = ChatMessageSenderSerializer(source='created_by', read_only=True)
    partner_user = ChatMessageSenderSerializer(source='partner', read_only=True)
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
            'partner',
            'partner_user',
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
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return ChatMessage.objects.filter(
            chat_room=obj,
            is_read=False
        ).exclude(sender=request.user).count()

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if not last_msg:
            return None
        return ChatMessageSerializer(last_msg, context=self.context).data
