from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the User model with institute-specific fields."""

    list_display = (
        'username', 'roll_number', 'institute_email', 'branch',
        'hostel', 'is_staff', 'is_active', 'date_joined',
    )
    list_filter = ('is_staff', 'is_active', 'gender', 'branch', 'hostel')
    search_fields = ('username', 'roll_number', 'institute_email', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Institute Info', {
            'fields': ('roll_number', 'institute_email', 'branch', 'hostel', 'gender', 'phone_number'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Institute Info', {
            'fields': ('roll_number', 'institute_email', 'branch', 'hostel', 'gender', 'phone_number'),
        }),
    )
