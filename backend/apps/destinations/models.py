from django.db import models


class Destination(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="Unique name of the travel destination."
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description or details about the destination."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this destination is available for travel requests."
    )
    
    objects = models.Manager()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Destination"
        verbose_name_plural = "Destinations"
        indexes = [
            models.Index(fields=['is_active', 'name'], name='idx_destination_active_name'),
        ]

    def __str__(self) -> str:
        return str(self.name)


class SavedDestination(models.Model):
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='saved_destinations',
        help_text="The user who saved this destination."
    )
    destination = models.ForeignKey(
        'Destination',
        on_delete=models.CASCADE,
        related_name='saved_by_users',
        help_text="The destination being saved."
    )
    label = models.CharField(
        max_length=50,
        blank=True,
        help_text="Optional custom label (e.g., 'Home', 'Work')."
    )
    
    objects = models.Manager()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Saved Destination"
        verbose_name_plural = "Saved Destinations"
        unique_together = ('user', 'destination')

    def __str__(self):
        username = getattr(self.user, 'username', str(self.user))
        dest_name = getattr(self.destination, 'name', str(self.destination))
        return f"{username} saved {dest_name}"
