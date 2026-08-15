import time
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage
from .presence import PresenceService
from apps.common.cache_services import safe_cache_get, safe_cache_set
from apps.common.metrics import metrics_registry

logger = logging.getLogger('apps.chat.consumer')


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Production-Grade WebSocket Consumer for real-time in-app ride chat.
    Includes ping/pong heartbeats, presence tracking, authorization caching,
    typing throttling, and fault-tolerant message handling.
    """

    async def connect(self):
        self.ride_request_id = self.scope['url_route']['kwargs']['ride_request_id']
        self.room_group_name = f"chat_{self.ride_request_id}"
        self.user = self.scope.get('user')
        self.last_typing_time = 0

        # 1. Authenticated User Check
        if not self.user or not self.user.is_authenticated:
            metrics_registry.record_websocket_auth_failure()
            await self.close(code=4001)  # Unauthorized
            return

        # 2. Participant Security Check
        self.room = await self.get_room_and_verify_access(self.ride_request_id, self.user)
        if not self.room:
            metrics_registry.record_websocket_auth_failure()
            await self.close(code=4003)  # Forbidden / Not a participant
            return

        # Join channel group & mark presence
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        PresenceService.mark_online(self.user.id)
        metrics_registry.websocket_connect()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user and self.user.is_authenticated:
            PresenceService.mark_offline(self.user.id)
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        metrics_registry.websocket_disconnect()

    async def receive(self, text_data):
        metrics_registry.record_websocket_message_received()
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        event_type = data.get('type')

        # 1. Heartbeat Ping / Pong
        if event_type == 'ping':
            PresenceService.mark_online(self.user.id)
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': time.time(),
            }))
            return

        # 2. Chat Message Broadcast
        if event_type == 'chat_message':
            try:
                message_text = data.get('message', '').strip()
                iv_str = data.get('iv')
                if not message_text:
                    return

                if len(message_text) > 5000:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Message exceeds maximum allowable length of 5000 characters.'
                    }))
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
            except Exception as exc:
                logger.error("Error processing chat_message: %s", exc, exc_info=True)
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to process chat message.'
                }))

        # 3. Typing Indicator (Throttled to max 1 per 2 seconds)
        elif event_type == 'typing':
            now = time.time()
            if now - getattr(self, 'last_typing_time', 0) < 2.0:
                return  # Throttle duplicate typing events
            self.last_typing_time = now

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

        # 4. Mark Messages Read
        elif event_type == 'mark_read':
            try:
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
            except Exception as exc:
                logger.error("Error marking read: %s", exc)

    # Broadcast Event Handlers
    async def chat_message_broadcast(self, event):
        metrics_registry.record_websocket_message_sent()
        await self.send(text_data=json.dumps(event))

    async def typing_broadcast(self, event):
        metrics_registry.record_websocket_message_sent()
        await self.send(text_data=json.dumps(event))

    async def read_receipt_broadcast(self, event):
        metrics_registry.record_websocket_message_sent()
        await self.send(text_data=json.dumps(event))

    async def delete_message_broadcast(self, event):
        metrics_registry.record_websocket_message_sent()
        await self.send(text_data=json.dumps(event))

    # Database Helpers
    @database_sync_to_async
    def get_room_and_verify_access(self, ride_request_id, user):
        cache_key = f"chat:access:{ride_request_id}:{user.id}"
        cached_access = safe_cache_get(cache_key)

        try:
            room = ChatRoom.objects.select_related('created_by', 'ride_request').prefetch_related('participants').only(
                'id', 'ride_request_id', 'is_active', 'created_by_id'
            ).get(ride_request_id=ride_request_id)
            
            if cached_access is True or room.is_participant(user):
                safe_cache_set(cache_key, True, timeout=60)
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
