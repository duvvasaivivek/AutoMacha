from django.urls import path
from .views import (
    ChatRoomListView,
    ChatRoomDetailView,
    ChatMessageListView,
    ChatUnreadCountView,
    ChatMarkReadView,
    ChatMessageDeleteView,
    ChatClearHistoryView,
    ChatRoomDeleteView,
)

app_name = 'chat'

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='room-list'),
    path('room/<int:ride_request_id>/', ChatRoomDetailView.as_view(), name='room-detail'),
    path('room/<int:ride_request_id>/messages/', ChatMessageListView.as_view(), name='room-messages'),
    path('room/<int:ride_request_id>/mark-read/', ChatMarkReadView.as_view(), name='room-mark-read'),
    path('room/<int:ride_request_id>/clear/', ChatClearHistoryView.as_view(), name='room-clear'),
    path('room/<int:ride_request_id>/delete/', ChatRoomDeleteView.as_view(), name='room-delete'),
    path('messages/<int:pk>/', ChatMessageDeleteView.as_view(), name='message-delete'),
    path('unread-count/', ChatUnreadCountView.as_view(), name='unread-count'),
]
