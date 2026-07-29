"""
Business logic services for ChatRoom management, system messages, and real-time event broadcasting.
"""
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from .models import ChatRoom, ChatMessage

logger = logging.getLogger(__name__)


def get_or_create_chat_room(travel_request, partner_user):
    """
    Creates or retrieves the ChatRoom for an accepted ride request.
    Automatically emits a SYSTEM greeting message when a new room is created.
    """
    if not travel_request or not partner_user:
        return None

    room, created = ChatRoom.objects.get_or_create(
        ride_request=travel_request,
        defaults={
            'created_by': travel_request.user,
            'partner': partner_user,
            'is_active': True,
        }
    )

    if created:
        logger.info(
            "Created ChatRoom #%d for TravelRequest #%d (@%s & @%s)",
            room.id, travel_request.id, travel_request.user.username, partner_user.username
        )
        # Emit initial SYSTEM message
        system_msg_text = (
            f"Ride Share Request Accepted! @{travel_request.user.username} and @{partner_user.username} "
            "can now chat here to coordinate pickup points and departure details."
        )
        create_system_chat_message(room, system_msg_text)

    return room


def create_system_chat_message(chat_room, message_text):
    """
    Creates a SYSTEM type ChatMessage and broadcasts it to the chat WebSocket channel layer group.
    """
    msg = ChatMessage.objects.create(
        chat_room=chat_room,
        sender=None,
        message=message_text,
        message_type=ChatMessage.MessageTypeChoices.SYSTEM,
        is_read=True,
    )
    broadcast_message_event(msg)
    return msg


def close_chat_room(travel_request, reason='Completed'):
    """
    Closes an active ChatRoom when the associated travel request is completed, cancelled, or expired.
    Posts a SYSTEM announcement and archives the room.
    """
    try:
        room = ChatRoom.objects.get(ride_request=travel_request)
    except ChatRoom.DoesNotExist:
        return None

    if room.is_active:
        room.close_room()
        reason_label = reason.capitalize()
        system_text = f"Ride {reason_label}! This chat room has been closed and archived."
        create_system_chat_message(room, system_text)
        logger.info("Closed ChatRoom #%d for TravelRequest #%d (Reason: %s)", room.id, travel_request.id, reason)
    return room


def broadcast_message_event(chat_message):
    """
    Broadcasts a ChatMessage payload to the Channels WebSocket group `chat_<ride_request_id>`.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    room_group_name = f"chat_{chat_message.chat_room.ride_request_id}"
    payload = {
        'type': 'chat_message_broadcast',
        'message_id': chat_message.id,
        'chat_room_id': chat_message.chat_room_id,
        'ride_request_id': chat_message.chat_room.ride_request_id,
        'sender': chat_message.sender.username if chat_message.sender else None,
        'sender_id': chat_message.sender_id,
        'message': chat_message.message,
        'iv': chat_message.iv,
        'message_type': chat_message.message_type,
        'is_read': chat_message.is_read,
        'is_deleted_everyone': chat_message.is_deleted_everyone,
        'created_at': chat_message.created_at.isoformat(),
    }

    try:
        async_to_sync(channel_layer.group_send)(room_group_name, payload)
    except Exception as exc:
        logger.warning("Failed to broadcast chat WebSocket event: %s", exc)


def broadcast_deletion_event(chat_message, mode='everyone'):
    """
    Broadcasts a message deletion event to channel group participants.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    room_group_name = f"chat_{chat_message.chat_room.ride_request_id}"
    payload = {
        'type': 'delete_message_broadcast',
        'message_id': chat_message.id,
        'chat_room_id': chat_message.chat_room_id,
        'mode': mode,
    }

    try:
        async_to_sync(channel_layer.group_send)(room_group_name, payload)
    except Exception as exc:
        logger.warning("Failed to broadcast chat deletion event: %s", exc)
