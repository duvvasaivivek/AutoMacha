from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import AuditLog

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'institute_email',
            'roll_number',
            'branch',
            'hostel',
            'gender',
            'phone_number',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
        )
        read_only_fields = ('id', 'date_joined', 'last_login')


class AuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin_user.username', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = (
            'id',
            'admin_username',
            'action',
            'affected_object',
            'details',
            'request_id',
            'ip_address',
            'timestamp',
        )
