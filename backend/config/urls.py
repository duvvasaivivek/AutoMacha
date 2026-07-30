"""
URL configuration for config project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from apps.accounts.views import UserProfileView
from .views import (
    api_root,
    health_check,
    health_check_liveness,
    health_check_readiness,
    metrics_export,
)

urlpatterns = [
    path('', api_root, name='root'),
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),

    # Health Check Probes
    path('health/', health_check, name='health-check-top'),
    path('health/live/', health_check_liveness, name='health-liveness-top'),
    path('health/ready/', health_check_readiness, name='health-readiness-top'),
    path('metrics', metrics_export, name='metrics-export-top'),

    # API Endpoints
    path('api/health/', health_check, name='health-check'),
    path('api/health/live/', health_check_liveness, name='health-liveness'),
    path('api/health/ready/', health_check_readiness, name='health-readiness'),
    path('api/metrics/', metrics_export, name='metrics-export'),
    path('api/profile/', UserProfileView.as_view(), name='direct-profile'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/destinations/', include('apps.destinations.urls')),
    path('api/travel-requests/', include('apps.travel_requests.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/auto-drivers/', include('apps.auto_drivers.urls')),
    path('api/admin-portal/', include('apps.admin_portal.urls')),
    path('api/ride-history/', include('apps.ride_history.urls')),
    path('api/chat/', include('apps.chat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

