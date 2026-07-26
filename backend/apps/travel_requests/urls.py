from django.urls import path
from .views import TravelRequestCreateView

app_name = 'travel_requests'

urlpatterns = [
    path('', TravelRequestCreateView.as_view(), name='travel-request-create'),
]
