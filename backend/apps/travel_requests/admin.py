from django.contrib import admin
from .models import TravelRequest


@admin.register(TravelRequest)
class TravelRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'destination', 'direction', 'travel_datetime', 'status', 'created_at')
    list_filter = ('status', 'direction', 'destination')
    search_fields = ('user__username', 'user__roll_number', 'user__institute_email', 'destination__name')
    readonly_fields = ('created_at', 'updated_at')
