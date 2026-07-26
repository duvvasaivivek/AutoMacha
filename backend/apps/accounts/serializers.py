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
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        if 'institute_email' in validated_data and 'email' not in validated_data:
            validated_data['email'] = validated_data['institute_email']
        return User.objects.create_user(**validated_data)
