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

    def validate_gender(self, value):
        if value and value not in [choice[0] for choice in User.GenderChoices.choices]:
            raise serializers.ValidationError("Invalid gender choice.")
        return value
