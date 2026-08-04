import os
import re
from django.conf import settings
from django.utils import timezone
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
            'full_name',
            'institute_email',
            'roll_number',
            'branch',
            'academic_year',
            'hostel',
            'gender',
            'phone_number',
        )
        read_only_fields = ('id',)

    def validate_institute_email(self, value):
        if not value:
            return value
        
        # Strictly enforce the supported email domain
        domain = getattr(settings, 'SUPPORTED_EMAIL_DOMAIN', '@iiitk.ac.in')
        if not value.lower().endswith(domain.lower()):
            raise serializers.ValidationError(
                f"Email must belong to the authorized domain '{domain}'."
            )
        return value.lower()

    def validate_username(self, value):
        return value.lower() if value else value

    def validate_roll_number(self, value):
        return value.lower() if value else value

    def create(self, validated_data):
        if 'institute_email' in validated_data and 'email' not in validated_data:
            validated_data['email'] = validated_data['institute_email']
        return User.objects.create_user(**validated_data)


class CurrentUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    is_email_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'full_name',
            'institute_email',
            'roll_number',
            'branch',
            'academic_year',
            'hostel',
            'gender',
            'phone_number',
            'bio',
            'profile_picture',
            'verification_status',
            'role',
            'is_email_verified',
            'is_staff',
            'is_superuser',
        )
        read_only_fields = fields

    def get_is_email_verified(self, obj):
        return bool(obj.institute_email)


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    is_email_verified = serializers.SerializerMethodField()
    account_age_days = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'full_name',
            'institute_email',
            'roll_number',
            'branch',
            'academic_year',
            'hostel',
            'gender',
            'phone_number',
            'bio',
            'profile_picture',
            'date_joined',
            'last_updated',
            'average_rating',
            'total_ratings',
            'total_completed_rides',
            'total_travel_requests',
            'total_ride_shares',
            'verification_status',
            'role',
            'is_email_verified',
            'account_age_days',
        )
        read_only_fields = (
            'id',
            'username',
            'institute_email',
            'roll_number',
            'date_joined',
            'last_updated',
            'average_rating',
            'total_ratings',
            'total_completed_rides',
            'total_travel_requests',
            'total_ride_shares',
            'verification_status',
            'role',
            'is_email_verified',
            'account_age_days',
        )

    def get_is_email_verified(self, obj):
        return bool(obj.institute_email)

    def get_account_age_days(self, obj):
        if not obj.date_joined:
            return 0
        delta = timezone.now() - obj.date_joined
        return max(0, delta.days)

    def validate_phone_number(self, value):
        if value:
            cleaned = re.sub(r'[\s\-+()]', '', value)
            if not cleaned.isdigit() or len(cleaned) != 10:
                raise serializers.ValidationError("Phone number must contain exactly 10 digits.")
            return cleaned
        return value

    def validate_bio(self, value):
        if value and len(value) > 300:
            raise serializers.ValidationError("Bio cannot exceed 300 characters.")
        return value

    def validate_profile_picture(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture size must not exceed 5 MB.")

            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
            if ext not in valid_extensions:
                raise serializers.ValidationError("Only image files (.jpg, .jpeg, .png, .webp) are allowed.")

            # Validate MIME Content-Type
            valid_content_types = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif']
            if hasattr(value, 'content_type') and value.content_type and value.content_type.lower() not in valid_content_types:
                raise serializers.ValidationError("Invalid image content type.")

            # Verify image file integrity using PIL
            try:
                from PIL import Image
                img = Image.open(value)
                img.verify()
                if hasattr(value, 'seek'):
                    value.seek(0)
            except Exception:
                raise serializers.ValidationError("Uploaded file is corrupted or not a valid image.")

            # Sanitize filename to UUID to prevent path traversal or malicious naming
            import uuid
            value.name = f"{uuid.uuid4().hex}{ext}"

        return value

