from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    class NotificationTypeChoices(models.TextChoices):
        RIDE_SHARE_REQUEST_RECEIVED = 'RIDE_SHARE_REQUEST_RECEIVED', _('Ride Share Request Received')
        RIDE_SHARE_REQUEST_ACCEPTED = 'RIDE_SHARE_REQUEST_ACCEPTED', _('Ride Share Request Accepted')
        RIDE_SHARE_REQUEST_DECLINED = 'RIDE_SHARE_REQUEST_DECLINED', _('Ride Share Request Declined')
        TRAVEL_REQUEST_EXPIRED = 'TRAVEL_REQUEST_EXPIRED', _('Travel Request Expired')
        NEW_MATCH_FOUND = 'NEW_MATCH_FOUND', _('New Match Found')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="The user receiving this notification."
    )
    title = models.CharField(max_length=255, help_text="Title of the notification.")
    message = models.TextField(help_text="Detailed message content.")
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationTypeChoices.choices,
        help_text="Type of notification event."
    )
    related_object_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the related object (e.g., TravelRequest or RideShareRequest ID)."
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the notification has been read by the user."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.user.username}: {self.title}"
