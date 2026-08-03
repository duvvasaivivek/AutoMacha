from django.urls import path
from .views import (
    DestinationListView,
    SavedDestinationListCreateView,
    SavedDestinationDeleteView,
)

app_name = 'destinations'

urlpatterns = [
    path('', DestinationListView.as_view(), name='destination-list'),
    path('saved/', SavedDestinationListCreateView.as_view(), name='saved-destination-list-create'),
    path('saved/<int:pk>/', SavedDestinationDeleteView.as_view(), name='saved-destination-delete'),
]
