from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import TravelRequest
from ..destinations.models import Destination

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'phone_number', 'institute_email', 'branch', 'hostel')


class DestinationMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ('id', 'name')


class TravelRequestListSerializer(serializers.ModelSerializer):
    destination = DestinationMinimalSerializer(read_only=True)
    user = UserMinimalSerializer(read_only=True)
    is_match = serializers.SerializerMethodField()
    match_info = serializers.SerializerMethodField()

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'user', 'direction', 'travel_datetime', 'status', 'created_at', 'is_match', 'match_info')

    def _get_matching_my_request(self, obj):
        if hasattr(obj, '_cached_match_req'):
            return obj._cached_match_req

        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            obj._cached_match_req = None
            return None

        if not hasattr(request, '_cached_my_open_requests'):
            request._cached_my_open_requests = list(
                request.user.travel_requests.filter(status='OPEN').select_related('destination')
            )

        match_found = None
        for my_req in request._cached_my_open_requests:
            if obj.destination_id == my_req.destination_id and obj.direction == my_req.direction:
                diff_seconds = abs((obj.travel_datetime - my_req.travel_datetime).total_seconds())
                if diff_seconds <= 7200:
                    match_found = my_req
                    break

        obj._cached_match_req = match_found
        return match_found

    def get_is_match(self, obj):
        return self._get_matching_my_request(obj) is not None

    def get_match_info(self, obj):
        my_req = self._get_matching_my_request(obj)
        if my_req:
            return f"Matches your trip on {my_req.travel_datetime.strftime('%b %d')} at {my_req.travel_datetime.strftime('%I:%M %p')}"
        return None


class MyTravelRequestSerializer(serializers.ModelSerializer):
    destination = DestinationMinimalSerializer(read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'direction', 'travel_datetime', 'status', 'created_at')


class TravelRequestSerializer(serializers.ModelSerializer):
    destination = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(),
        write_only=True
    )
    destination_details = DestinationMinimalSerializer(source='destination', read_only=True)
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'destination_details', 'user', 'direction', 'travel_datetime', 'status', 'created_at')
        read_only_fields = ('status', 'created_at')

    def validate_travel_datetime(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Travel date and time cannot be in the past.")
        return value


class TravelRequestMatchSerializer(serializers.ModelSerializer):
    destination = serializers.CharField(source='destination.name', read_only=True)
    user = UserMinimalSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    time_difference = serializers.IntegerField(read_only=True)

    class Meta:
        model = TravelRequest
        fields = ('id', 'destination', 'user', 'username', 'direction', 'travel_datetime', 'time_difference')
