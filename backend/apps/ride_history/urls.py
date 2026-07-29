from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RideHistoryViewSet

app_name = 'ride_history'

router = DefaultRouter()
router.register(r'', RideHistoryViewSet, basename='ride-history')

urlpatterns = [
    path('', include(router.urls)),
]
