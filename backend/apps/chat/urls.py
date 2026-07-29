from django.urls import path
from .views import (
    ChatRoomDetailView,
    ChatMessageListView,
    ChatUnreadCountView,
    ChatMarkReadView,
)

app_name = 'chat'

urlpatterns = [
    path('room/<int:ride_request_id>/', ChatRoomDetailView.as_view(), name='room-detail'),
    path('room/<int:ride_request_id>/messages/', ChatMessageListView.as_view(), name='room-messages'),
    path('room/<int:ride_request_id>/mark-read/', ChatMarkReadView.as_view(), name='room-mark-read'),
    path('unread-count/', ChatUnreadCountView.as_view(), name='unread-count'),
]
