from django.conf import settings
from django.db import models


class AutoDriver(models.Model):
    """
    Directory model storing verified auto drivers and student driver suggestions.
    """
    full_name = models.CharField(
        max_length=255,
        help_text="Full name of the auto driver."
    )
    phone_number = models.CharField(
        max_length=15,
        unique=True,
        help_text="Unique 10-digit mobile phone number of the driver."
    )
    vehicle_number = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Optional vehicle registration / auto number (e.g. AP 39 AB 1234)."
    )
    notes = models.TextField(
        blank=True,
        default='',
        help_text="Optional notes or operating route details."
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggested_auto_drivers',
        help_text="The student user who suggested this driver (null if added directly by admin)."
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the driver record has been verified and approved by admin."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the driver is active and visible in the directory."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']
        verbose_name = "Auto Driver"
        verbose_name_plural = "Auto Drivers"
        indexes = [
            models.Index(fields=['is_verified', 'is_active'], name='idx_driver_verified_active'),
            models.Index(fields=['phone_number'], name='idx_driver_phone'),
            models.Index(fields=['full_name'], name='idx_driver_name'),
        ]

    def __str__(self):
        status_str = "Verified" if self.is_verified else "Pending Approval"
        return f"{self.full_name} ({self.phone_number}) - [{status_str}]"
