from django.urls import path
from .views import (
    AdminDashboardStatsView,
    AdminUserListView,
    AdminUserToggleActiveView,
    AdminDestinationManagementView,
    AdminAutoDriverManagementView,
    AdminTravelRequestManagementView,
    AdminNotificationsView,
    AdminAnalyticsView,
    AdminSystemLogsView,
    AdminAuditLogsView,
    AdminHealthStatusView,
    AdminSettingsView,
    AdminImpersonationView,
)

app_name = 'admin_portal'

urlpatterns = [
    path('dashboard/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('users/', AdminUserListView.as_view(), name='users-list'),
    path('users/<int:pk>/toggle-active/', AdminUserToggleActiveView.as_view(), name='users-toggle-active'),
    path('destinations/', AdminDestinationManagementView.as_view(), name='destinations-list'),
    path('destinations/<int:pk>/', AdminDestinationManagementView.as_view(), name='destinations-detail'),
    path('auto-drivers/', AdminAutoDriverManagementView.as_view(), name='auto-drivers-list'),
    path('auto-drivers/<int:pk>/', AdminAutoDriverManagementView.as_view(), name='auto-drivers-detail'),
    path('travel-requests/', AdminTravelRequestManagementView.as_view(), name='travel-requests-list'),
    path('travel-requests/<int:pk>/', AdminTravelRequestManagementView.as_view(), name='travel-requests-detail'),
    path('notifications/', AdminNotificationsView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/', AdminNotificationsView.as_view(), name='notifications-detail'),
    path('analytics/', AdminAnalyticsView.as_view(), name='analytics'),
    path('logs/', AdminSystemLogsView.as_view(), name='system-logs'),
    path('audit-logs/', AdminAuditLogsView.as_view(), name='audit-logs'),
    path('health/', AdminHealthStatusView.as_view(), name='health'),
    path('settings/', AdminSettingsView.as_view(), name='settings'),
    path('impersonate/<int:user_id>/', AdminImpersonationView.as_view(), name='impersonate'),
]
