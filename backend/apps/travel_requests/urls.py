from django.urls import path
from .views import TravelRequestListCreateView

app_name = 'travel_requests'

urlpatterns = [
    path('', TravelRequestListCreateView.as_view(), name='travel-request-list-create'),
]
