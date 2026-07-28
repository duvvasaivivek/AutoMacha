from django.conf import settings
from rest_framework import serializers
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'password',
            'institute_email',
            'roll_number',
            'branch',
            'hostel',
            'gender',
            'phone_number',
        )
        read_only_fields = ('id',)

    def validate_institute_email(self, value):
        feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
        if feature_flags.get('ENABLE_EMAIL_VERIFICATION', False):
            domain = getattr(settings, 'SUPPORTED_EMAIL_DOMAIN', '@iiitk.ac.in')
            if domain and not value.lower().endswith(domain.lower()):
                raise serializers.ValidationError(
                    f"Email must belong to the authorized domain '{domain}'."
                )
        return value

    def create(self, validated_data):
        if 'institute_email' in validated_data and 'email' not in validated_data:
            validated_data['email'] = validated_data['institute_email']
        return User.objects.create_user(**validated_data)


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'institute_email',
            'roll_number',
            'branch',
            'hostel',
            'gender',
            'phone_number',
        )
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'institute_email',
            'roll_number',
            'branch',
            'hostel',
            'gender',
            'phone_number',
        )
        read_only_fields = ('id', 'username', 'institute_email', 'roll_number')
