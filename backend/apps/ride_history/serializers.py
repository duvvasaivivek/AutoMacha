from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RideHistory

User = get_user_model()


class RideHistoryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'branch',
            'hostel',
            'phone_number',
            'institute_email',
        )
        read_only_fields = fields


class RideHistorySerializer(serializers.ModelSerializer):
    ride_partner = RideHistoryPartnerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_ride_status_display', read_only=True)
    travel_request_id = serializers.IntegerField(source='travel_request.id', read_only=True, allow_null=True)

    class Meta:
        model = RideHistory
        fields = (
            'id',
            'user',
            'travel_request',
            'travel_request_id',
            'ride_request_id',
            'ride_partner',
            'destination',
            'pickup_location',
            'departure_time',
            'completed_at',
            'ride_status',
            'status_display',
            'rating',
            'review_text',
            'achievements',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields  # Entire serializer is read-only for security and immutability


class RideHistorySummarySerializer(serializers.Serializer):
    total_rides = serializers.IntegerField()
    completed_rides = serializers.IntegerField()
    cancelled_rides = serializers.IntegerField()
    expired_rides = serializers.IntegerField()
