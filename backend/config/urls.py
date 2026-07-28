"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import include, path
from .views import api_root, health_check

urlpatterns = [
    path('', api_root, name='root'),
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/health/', health_check, name='health-check'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/destinations/', include('apps.destinations.urls')),
    path('api/travel-requests/', include('apps.travel_requests.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/auto-drivers/', include('apps.auto_drivers.urls')),
]
