from django.urls import path
from .views import TravelRequestListCreateView, TravelRequestMatchesView

app_name = 'travel_requests'

urlpatterns = [
    path('', TravelRequestListCreateView.as_view(), name='travel-request-list-create'),
    path('<int:pk>/matches/', TravelRequestMatchesView.as_view(), name='travel-request-matches'),
    path('<int:id>/matches/', TravelRequestMatchesView.as_view(), name='travel-request-matches-id'),
]
