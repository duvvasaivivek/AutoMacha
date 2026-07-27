from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class GenderChoices(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
        OTHER = 'O', 'Other'
        PREFER_NOT_TO_SAY = 'P', 'Prefer not to say'

    roll_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique student roll number."
    )
    institute_email = models.EmailField(
        unique=True,
        help_text="Institute email address."
    )
    branch = models.CharField(
        max_length=100,
        blank=True,
        help_text="Department or branch of study."
    )
    hostel = models.CharField(
        max_length=100,
        blank=True,
        help_text="Hostel name or room details."
    )
    gender = models.CharField(
        max_length=20,
        choices=GenderChoices.choices,
        blank=True,
        help_text="Gender identity."
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number."
    )

    class Meta:
        ordering = ['username']
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} ({self.roll_number})"

