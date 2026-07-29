from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class GenderChoices(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
        OTHER = 'O', 'Other'
        PREFER_NOT_TO_SAY = 'P', 'Prefer not to say'

    class VerificationStatusChoices(models.TextChoices):
        VERIFIED = 'verified', 'Verified'
        PENDING = 'pending', 'Pending Verification'
        UNVERIFIED = 'unverified', 'Unverified'

    roll_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique student roll number."
    )
    institute_email = models.EmailField(
        unique=True,
        help_text="Institute email address."
    )
    full_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Full display name of the user."
    )
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text="User profile picture."
    )
    branch = models.CharField(
        max_length=100,
        blank=True,
        help_text="Department or branch of study."
    )
    academic_year = models.CharField(
        max_length=50,
        blank=True,
        help_text="Academic year (e.g. 1st Year, 2nd Year, etc.)."
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
    bio = models.TextField(
        max_length=300,
        blank=True,
        help_text="Short user biography."
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when profile was last updated."
    )

    # Future-ready stats & status
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text="Average rating score."
    )
    total_ratings = models.PositiveIntegerField(
        default=0,
        help_text="Total number of ratings received."
    )
    total_completed_rides = models.PositiveIntegerField(
        default=0,
        help_text="Count of completed rides."
    )
    total_travel_requests = models.PositiveIntegerField(
        default=0,
        help_text="Total travel requests created."
    )
    total_ride_shares = models.PositiveIntegerField(
        default=0,
        help_text="Total ride shares joined or offered."
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatusChoices.choices,
        default=VerificationStatusChoices.VERIFIED,
        help_text="Account verification status."
    )

    class Meta:
        ordering = ['username']
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        name = self.full_name if self.full_name else self.username
        return f"{name} ({self.roll_number})"

    @property
    def role(self):
        if self.is_superuser:
            return "Super Admin"
        if self.is_staff:
            return "Admin"
        return "Student"


