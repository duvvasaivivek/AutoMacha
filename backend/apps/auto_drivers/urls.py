from django.urls import path
from .views import AutoDriverListView, AutoDriverSuggestView, MyAutoDriverSuggestionsView

app_name = 'auto_drivers'

urlpatterns = [
    path('', AutoDriverListView.as_view(), name='list'),
    path('suggest/', AutoDriverSuggestView.as_view(), name='suggest'),
    path('my-suggestions/', MyAutoDriverSuggestionsView.as_view(), name='my-suggestions'),
]
