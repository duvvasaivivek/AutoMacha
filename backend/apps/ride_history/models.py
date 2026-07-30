from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class RideHistory(models.Model):
    class StatusChoices(models.TextChoices):
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')
        EXPIRED = 'EXPIRED', _('Expired')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ride_histories',
        help_text="The user for whom this ride activity is recorded."
    )
    travel_request = models.ForeignKey(
        'travel_requests.TravelRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ride_histories',
        help_text="Reference to original travel request if available."
    )
    ride_request_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Optional reference ID for the ride share request/notification."
    )
    ride_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='partner_ride_histories',
        help_text="The ride partner/companion for this ride, if applicable."
    )
    destination = models.CharField(
        max_length=255,
        help_text="Snapshot of the travel destination at time of ride."
    )
    pickup_location = models.CharField(
        max_length=255,
        default='Campus',
        help_text="Snapshot of pickup or starting location."
    )
    departure_time = models.DateTimeField(
        help_text="Scheduled departure date and time."
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the ride reached completed/cancelled/expired status."
    )
    ride_status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        help_text="Status of the recorded ride history entry."
    )

    # Future Ready Fields (Ratings, Reviews, Achievements, Analytics)
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="User rating for this ride (1 to 5 stars)."
    )
    review_text = models.TextField(
        blank=True,
        default='',
        help_text="Optional feedback or review comments."
    )
    achievements = models.JSONField(
        default=dict,
        blank=True,
        help_text="Future analytics and milestone achievement tags."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-departure_time', '-created_at']
        verbose_name = "Ride History"
        verbose_name_plural = "Ride Histories"
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'travel_request', 'ride_status'],
                name='unique_user_travelreq_status_history'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'ride_status'], name='idx_ridehist_user_status'),
            models.Index(fields=['user', '-departure_time'], name='idx_ridehist_user_deptime'),
            models.Index(fields=['user', 'destination'], name='idx_ridehist_user_dest'),
        ]

    def __str__(self):
        return f"[{self.get_ride_status_display()}] {self.user.username} -> {self.destination} ({self.departure_time.strftime('%Y-%m-%d %H:%M')})"
