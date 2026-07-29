from django.db.models import Q, Count, Subquery, OuterRef, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import ChatRoom, ChatMessage
from .serializers import (
    ChatRoomSerializer,
    ChatMessageSerializer,
)


class ChatRoomListView(generics.ListAPIView):
    """
    Returns all active and past ChatRooms where the authenticated user is a participant.
    Optimized with annotated unread counts and prefetched latest messages to eliminate N+1 queries.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        user = self.request.user

        # Subquery to fetch the ID of the single latest non-deleted message per chat room
        last_msg_id_subquery = Subquery(
            ChatMessage.objects.filter(
                chat_room=OuterRef('chat_room')
            ).exclude(
                deleted_for=user
            ).order_by('-created_at', '-id').values('id')[:1]
        )

        # Prefetch to load only that 1 latest ChatMessage per room with sender details in 1 single bulk query
        last_msg_prefetch = Prefetch(
            'messages',
            queryset=ChatMessage.objects.filter(
                id__in=last_msg_id_subquery
            ).select_related('sender'),
            to_attr='prefetched_last_msg_list'
        )

        return ChatRoom.objects.filter(
            Q(created_by=user) | Q(partner=user)
        ).select_related(
            'created_by', 'partner', 'ride_request', 'ride_request__destination'
        ).annotate(
            annotated_unread_count=Count(
                'messages',
                filter=Q(messages__is_read=False) & ~Q(messages__sender=user) & ~Q(messages__deleted_for=user),
                distinct=True
            )
        ).prefetch_related(last_msg_prefetch).order_by('-updated_at')


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
    Requires participant authorization. Excludes messages deleted by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        ride_request_id = self.kwargs['ride_request_id']
        room = get_object_or_404(ChatRoom, ride_request_id=ride_request_id)
        if not room.is_participant(self.request.user):
            raise PermissionDenied("You do not have permission to view messages for this chat room.")

        return ChatMessage.objects.filter(
            chat_room=room
        ).exclude(
            deleted_for=self.request.user
        ).select_related('sender').order_by('created_at')


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
        ).exclude(sender=user).exclude(deleted_for=user).count()

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


class ChatMessageDeleteView(views.APIView):
    """
    Deletes a chat message.
    mode='everyone': Soft deletes for all participants (requires sender ownership).
    mode='me': Hides message for the requesting user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk=None, *args, **kwargs):
        msg = get_object_or_404(ChatMessage.objects.select_related('chat_room'), pk=pk)
        if not msg.chat_room.is_participant(request.user):
            raise PermissionDenied("You do not have permission to delete this message.")

        mode = request.query_params.get('mode', 'me')

        if mode == 'everyone':
            if msg.sender != request.user:
                raise PermissionDenied("Only the sender can delete a message for everyone.")
            msg.is_deleted_everyone = True
            msg.message = "This message was deleted"
            msg.save(update_fields=['is_deleted_everyone', 'message'])

            # Broadcast real-time deletion event
            from .services import broadcast_deletion_event
            broadcast_deletion_event(msg, mode='everyone')
            return Response({"status": "deleted_everyone", "id": msg.id}, status=status.HTTP_200_OK)
        else:
            msg.deleted_for.add(request.user)
            return Response({"status": "deleted_me", "id": msg.id}, status=status.HTTP_200_OK)


class ChatClearHistoryView(views.APIView):
    """
    Clears all conversation messages for the requesting user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ride_request_id=None, *args, **kwargs):
        room = get_object_or_404(ChatRoom, ride_request_id=ride_request_id)
        if not room.is_participant(request.user):
            raise PermissionDenied("You do not have permission to clear history for this room.")

        messages = ChatMessage.objects.filter(chat_room=room)
        for m in messages:
            m.deleted_for.add(request.user)

        room.cleared_by.add(request.user)
        return Response({"status": "cleared", "ride_request_id": ride_request_id}, status=status.HTTP_200_OK)
