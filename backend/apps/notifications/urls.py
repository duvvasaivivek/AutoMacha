from django.urls import path
from .views import (
    NotificationListView,
    NotificationUnreadCountView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    WebPushSubscribeView,
    WebPushUnsubscribeView,
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('read-all/', NotificationMarkAllReadView.as_view(), name='notification-read-all'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('webpush/subscribe/', WebPushSubscribeView.as_view(), name='webpush-subscribe'),
    path('webpush/unsubscribe/', WebPushUnsubscribeView.as_view(), name='webpush-unsubscribe'),
]
