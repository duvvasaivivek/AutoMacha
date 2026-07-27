from django.urls import path
from .views import (
    TravelRequestListCreateView,
    MyTravelRequestsView,
    TravelRequestDetailView,
    TravelRequestCancelView,
    TravelRequestMatchesView,
    TravelRequestShareView,
    TravelRequestRespondShareView,
)

app_name = 'travel_requests'

urlpatterns = [
    path('', TravelRequestListCreateView.as_view(), name='travel-request-list-create'),
    path('my/', MyTravelRequestsView.as_view(), name='my-travel-requests'),
    path('<int:pk>/', TravelRequestDetailView.as_view(), name='travel-request-detail'),
    path('<int:pk>/cancel/', TravelRequestCancelView.as_view(), name='travel-request-cancel'),
    path('<int:pk>/matches/', TravelRequestMatchesView.as_view(), name='travel-request-matches'),
    path('<int:pk>/request-share/', TravelRequestShareView.as_view(), name='travel-request-share'),
    path('<int:pk>/respond-share/', TravelRequestRespondShareView.as_view(), name='travel-request-respond-share'),
]
