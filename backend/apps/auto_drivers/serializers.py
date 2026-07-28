import re
from rest_framework import serializers
from .models import AutoDriver


class AutoDriverSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default=None)

    class Meta:
        model = AutoDriver
        fields = (
            'id',
            'full_name',
            'phone_number',
            'vehicle_number',
            'notes',
            'is_verified',
            'is_active',
            'created_by_username',
            'created_at',
        )
        read_only_fields = ('id', 'is_verified', 'is_active', 'created_by_username', 'created_at')


class AutoDriverSuggestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutoDriver
        fields = (
            'id',
            'full_name',
            'phone_number',
            'vehicle_number',
            'notes',
        )
        read_only_fields = ('id',)

    def validate_full_name(self, value):
        cleaned_name = value.strip()
        if not cleaned_name:
            raise serializers.ValidationError("Driver name is required.")
        return cleaned_name

    def validate_phone_number(self, value):
        cleaned_phone = re.sub(r'\D', '', value)
        if len(cleaned_phone) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")

        # Check for duplicate phone number
        if AutoDriver.objects.filter(phone_number=cleaned_phone).exists():
            raise serializers.ValidationError("An auto driver with this phone number already exists.")

        return cleaned_phone
