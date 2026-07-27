from django.urls import path
from .views import (
    TravelRequestListCreateView,
    MyTravelRequestsView,
    TravelRequestDetailView,
    TravelRequestCancelView,
    TravelRequestMatchesView,
)

app_name = 'travel_requests'

urlpatterns = [
    path('', TravelRequestListCreateView.as_view(), name='travel-request-list-create'),
    path('my/', MyTravelRequestsView.as_view(), name='my-travel-requests'),
    path('<int:pk>/', TravelRequestDetailView.as_view(), name='travel-request-detail'),
    path('<int:id>/', TravelRequestDetailView.as_view(), name='travel-request-detail-id'),
    path('<int:pk>/cancel/', TravelRequestCancelView.as_view(), name='travel-request-cancel'),
    path('<int:id>/cancel/', TravelRequestCancelView.as_view(), name='travel-request-cancel-id'),
    path('<int:pk>/matches/', TravelRequestMatchesView.as_view(), name='travel-request-matches'),
    path('<int:id>/matches/', TravelRequestMatchesView.as_view(), name='travel-request-matches-id'),
]
