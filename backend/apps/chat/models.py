from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ChatRoom(models.Model):
    ride_request = models.OneToOneField(
        'travel_requests.TravelRequest',
        on_delete=models.CASCADE,
        related_name='chat_room',
        help_text="The travel request for which this chat room is established."
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_chat_rooms',
        help_text="The travel request owner/requester."
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='joined_chat_rooms',
        blank=True,
        help_text="The accepted ride partners."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Active status. Becomes False when ride is completed or cancelled."
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the room was closed to new messages."
    )
    cleared_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='cleared_chat_rooms',
        blank=True,
        help_text="Users who have cleared chat history for themselves."
    )
    deleted_for = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='deleted_chat_rooms',
        blank=True,
        help_text="Users who have completely hidden this chat room from their inbox."
    )
    archived_for = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='archived_chat_rooms',
        blank=True,
        help_text="Users who have archived this chat room."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Chat Room"
        verbose_name_plural = "Chat Rooms"
        indexes = [
            models.Index(fields=['is_active'], name='idx_chatroom_active'),
            models.Index(fields=['created_by', 'is_active'], name='idx_chatroom_owner_active'),
        ]

    def __str__(self):
        return f"ChatRoom #{self.id} for RideRequest #{self.ride_request_id} (@{self.created_by.username})"

    def is_participant(self, user):
        """Returns True if the given user is a participant of this chat room."""
        if not user or not user.is_authenticated:
            return False
        return user.id == self.created_by_id or self.participants.filter(id=user.id).exists()

    def get_other_participants(self, user):
        """Returns all other users participating in this chat room."""
        all_participants = list(self.participants.all())
        if self.created_by not in all_participants:
            all_participants.append(self.created_by)
        return [p for p in all_participants if p.id != user.id]

    def close_room(self):
        """Closes the room so no new messages can be posted."""
        if self.is_active:
            self.is_active = False
            self.closed_at = timezone.now()
            self.save(update_fields=['is_active', 'closed_at', 'updated_at'])


class ChatMessage(models.Model):
    class MessageTypeChoices(models.TextChoices):
        TEXT = 'TEXT', _('Text Message')
        SYSTEM = 'SYSTEM', _('System Event')
        IMAGE = 'IMAGE', _('Image Attachment')
        LOCATION = 'LOCATION', _('Live Location')
        VOICE = 'VOICE', _('Voice Message')

    chat_room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="The chat room this message belongs to."
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_chat_messages',
        help_text="The user who sent this message. Null for system messages."
    )
    message = models.TextField(help_text="Encrypted text payload or system event description.")
    iv = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Base64 IV for AES-256-GCM encryption."
    )
    message_type = models.CharField(
        max_length=20,
        choices=MessageTypeChoices.choices,
        default=MessageTypeChoices.TEXT,
        help_text="Type of message (TEXT, SYSTEM, IMAGE, etc.)."
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the recipient has read this message."
    )
    is_deleted_everyone = models.BooleanField(
        default=False,
        help_text="True if soft deleted for all participants."
    )
    deleted_for = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='deleted_chat_messages',
        blank=True,
        help_text="Users who have deleted this message for themselves."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        indexes = [
            models.Index(fields=['chat_room', 'created_at'], name='idx_chatmsg_room_created'),
            models.Index(fields=['chat_room', 'is_read'], name='idx_chatmsg_room_read'),
            models.Index(fields=['chat_room', 'sender', 'is_read'], name='idx_chatmsg_room_sndr_read'),
        ]

    def __str__(self):
        sender_label = f"@{self.sender.username}" if self.sender else "SYSTEM"
        return f"[{sender_label}] {self.message[:30]}"
