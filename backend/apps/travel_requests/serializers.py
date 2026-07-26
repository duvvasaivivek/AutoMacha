from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import TravelRequest
from apps.destinations.models import Destination
from apps.destinations.serializers import DestinationSerializer

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')


class DestinationMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ('id', 'name')


class TravelRequestListSerializer(serializers.ModelSerializer):
    destination = DestinationMinimalSerializer(read_only=True)
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'user', 'direction', 'travel_datetime', 'status', 'created_at')


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


class TravelRequestMatchSerializer(serializers.ModelSerializer):
    destination = serializers.CharField(source='destination.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    time_difference = serializers.IntegerField(read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'username', 'direction', 'travel_datetime', 'time_difference')
