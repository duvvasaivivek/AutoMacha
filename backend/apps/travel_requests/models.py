from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class TravelRequest(models.Model):
    class DirectionChoices(models.TextChoices):
        TO_CAMPUS = 'TO_CAMPUS', _('To Campus')
        FROM_CAMPUS = 'FROM_CAMPUS', _('From Campus')

    class StatusChoices(models.TextChoices):
        OPEN = 'OPEN', _('Open')
        CLOSED = 'CLOSED', _('Closed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='travel_requests',
        help_text="The student who created this travel request."
    )
    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.PROTECT,
        related_name='travel_requests',
        help_text="The approved outing or travel destination."
    )
    direction = models.CharField(
        max_length=20,
        choices=DirectionChoices.choices,
        help_text="Direction of travel (To Campus or From Campus)."
    )
    travel_datetime = models.DateTimeField(
        help_text="Scheduled date and time of departure/arrival."
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.OPEN,
        help_text="Current status of the travel request."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Travel Request"
        verbose_name_plural = "Travel Requests"

    def __str__(self):
        return f"{self.user.username} -> {self.destination.name} ({self.get_direction_display()})"
