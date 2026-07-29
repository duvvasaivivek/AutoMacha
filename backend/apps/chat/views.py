from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import ChatRoom, ChatMessage
from .serializers import (
    ChatRoomSerializer,
    ChatMessageSerializer,
)


class ChatRoomDetailView(generics.RetrieveAPIView):
    """
    Retrieves ChatRoom details for a given ride_request_id.
    Requires participant authorization.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_object(self):
        ride_request_id = self.kwargs['ride_request_id']
        room = get_object_or_404(
            ChatRoom.objects.select_related('created_by', 'partner', 'ride_request', 'ride_request__destination'),
            ride_request_id=ride_request_id
        )
        if not room.is_participant(self.request.user):
            raise PermissionDenied("You do not have permission to access this chat room.")
        return room


class ChatMessageListView(generics.ListAPIView):
    """
    Returns message history for a chat room.
    Requires participant authorization. Supports pagination.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        ride_request_id = self.kwargs['ride_request_id']
        room = get_object_or_404(ChatRoom, ride_request_id=ride_request_id)
        if not room.is_participant(self.request.user):
            raise PermissionDenied("You do not have permission to view messages for this chat room.")

        return ChatMessage.objects.filter(chat_room=room).select_related('sender').order_by('created_at')


class ChatUnreadCountView(views.APIView):
    """
    Returns the total unread chat message count across all active chat rooms for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        unread_count = ChatMessage.objects.filter(
            Q(chat_room__created_by=user) | Q(chat_room__partner=user),
            is_read=False,
        ).exclude(sender=user).count()

        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)


class ChatMarkReadView(views.APIView):
    """
    Marks all unread messages in a chat room as read for the authenticated recipient.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ride_request_id=None, *args, **kwargs):
        room = get_object_or_404(ChatRoom, ride_request_id=ride_request_id)
        if not room.is_participant(request.user):
            raise PermissionDenied("You do not have permission to modify messages in this chat room.")

        updated_count = ChatMessage.objects.filter(
            chat_room=room,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)

        return Response({"status": "success", "marked_read": updated_count}, status=status.HTTP_200_OK)
