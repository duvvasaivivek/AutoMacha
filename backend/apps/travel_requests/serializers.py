from django.utils import timezone
from rest_framework import serializers
from .models import TravelRequest
from apps.destinations.serializers import DestinationSerializer


class TravelRequestSerializer(serializers.ModelSerializer):
    destination_details = DestinationSerializer(source='destination', read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'destination_details', 'direction', 'travel_datetime', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at', 'destination_details')

    def validate_destination(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Selected destination is currently inactive or unavailable.")
        return value

    def validate_travel_datetime(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Travel date and time cannot be in the past.")
        return value
