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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Destination"
        verbose_name_plural = "Destinations"

    def __str__(self):
        return self.name
