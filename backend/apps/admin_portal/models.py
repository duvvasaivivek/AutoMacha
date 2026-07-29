from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Tracks administrative actions taken within the Admin Portal.
    """
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_audit_logs',
        help_text="The admin/staff user who performed the action."
    )
    action = models.CharField(
        max_length=100,
        help_text="Name/type of the administrative action (e.g. USER_DISABLED, DRIVER_APPROVED)."
    )
    affected_object = models.CharField(
        max_length=255,
        help_text="Identifier or label of the target object affected (e.g. User #12, TravelRequest #4)."
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context or state changes associated with this audit event."
    )
    request_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="X-Request-ID correlated with the HTTP request."
    )
    ip_address = models.CharField(
        max_length=45,
        blank=True,
        default='',
        help_text="IP address of the client triggering the admin action."
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Admin Audit Log"
        verbose_name_plural = "Admin Audit Logs"
        indexes = [
            models.Index(fields=['action'], name='idx_audit_action'),
            models.Index(fields=['-timestamp'], name='idx_audit_timestamp'),
            models.Index(fields=['admin_user', '-timestamp'], name='idx_audit_user_ts'),
        ]

    def __str__(self):
        admin_name = self.admin_user.username if self.admin_user else 'System/Unknown'
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {admin_name} -> {self.action}: {self.affected_object}"
