import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatRoom, ChatMessage


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer for real-time in-app ride chat.
    Enforces strict participant security and read-only archiving upon ride completion/cancellation.
    """

    async def connect(self):
        self.ride_request_id = self.scope['url_route']['kwargs']['ride_request_id']
        self.room_group_name = f"chat_{self.ride_request_id}"
        self.user = self.scope.get('user')

        # 1. Authenticated User Check
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)  # Unauthorized
            return

        # 2. Participant Security Check
        self.room = await self.get_room_and_verify_access(self.ride_request_id, self.user)
        if not self.room:
            await self.close(code=4003)  # Forbidden / Not a participant
            return

        # Join channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get('type')

        if event_type == 'chat_message':
            message_text = data.get('message', '').strip()
            iv_str = data.get('iv')
            if not message_text:
                return

            # Check if chat room is active
            is_active = await self.is_room_active()
            if not is_active:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Chat room is closed for new messages because the ride has been completed or cancelled.'
                }))
                return

            # Save ChatMessage to DB
            chat_msg = await self.save_chat_message(self.user, message_text, iv_str)

            # Broadcast to channel layer group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message_broadcast',
                    'message_id': chat_msg.id,
                    'chat_room_id': self.room.id,
                    'ride_request_id': int(self.ride_request_id),
                    'sender': self.user.username,
                    'sender_id': self.user.id,
                    'message': chat_msg.message,
                    'iv': chat_msg.iv,
                    'message_type': chat_msg.message_type,
                    'is_read': chat_msg.is_read,
                    'is_deleted_everyone': chat_msg.is_deleted_everyone,
                    'created_at': chat_msg.created_at.isoformat(),
                }
            )

        elif event_type == 'typing':
            is_typing = bool(data.get('is_typing', False))
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_broadcast',
                    'sender': self.user.username,
                    'sender_id': self.user.id,
                    'is_typing': is_typing,
                }
            )

        elif event_type == 'mark_read':
            marked_count = await self.mark_room_messages_as_read(self.user)
            if marked_count > 0:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'read_receipt_broadcast',
                        'chat_room_id': self.room.id,
                        'reader': self.user.username,
                        'reader_id': self.user.id,
                    }
                )

    # Broadcast Event Handlers
    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    async def read_receipt_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    async def delete_message_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    # Database Helpers
    @database_sync_to_async
    def get_room_and_verify_access(self, ride_request_id, user):
        try:
            room = ChatRoom.objects.select_related('created_by', 'partner').get(ride_request_id=ride_request_id)
            if room.is_participant(user):
                return room
            return None
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def is_room_active(self):
        try:
            self.room.refresh_from_db(fields=['is_active'])
            return self.room.is_active
        except Exception:
            return False

    @database_sync_to_async
    def save_chat_message(self, sender, text, iv=None):
        return ChatMessage.objects.create(
            chat_room=self.room,
            sender=sender,
            message=text,
            iv=iv,
            message_type=ChatMessage.MessageTypeChoices.TEXT,
            is_read=False,
        )

    @database_sync_to_async
    def mark_room_messages_as_read(self, reader_user):
        return ChatMessage.objects.filter(
            chat_room=self.room,
            is_read=False,
        ).exclude(sender=reader_user).update(is_read=True)
