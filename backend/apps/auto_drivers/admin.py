from django.contrib import admin
from .models import AutoDriver


@admin.register(AutoDriver)
class AutoDriverAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'vehicle_number', 'is_verified', 'is_active', 'created_by', 'created_at')
    list_filter = ('is_verified', 'is_active', 'created_at')
    search_fields = ('full_name', 'phone_number', 'vehicle_number', 'notes')
    ordering = ('-created_at',)
    actions = ['approve_drivers', 'reject_drivers', 'activate_drivers', 'deactivate_drivers']

    @admin.action(description="Approve selected drivers (Verify)")
    def approve_drivers(self, request, queryset):
        updated = queryset.update(is_verified=True, is_active=True)
        self.message_user(request, f"Successfully verified {updated} auto driver(s).")

    @admin.action(description="Reject selected drivers (Unverify)")
    def reject_drivers(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"Marked {updated} auto driver(s) as unverified.")

    @admin.action(description="Activate selected drivers")
    def activate_drivers(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Activated {updated} auto driver(s).")

    @admin.action(description="Deactivate selected drivers")
    def deactivate_drivers(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} auto driver(s).")
