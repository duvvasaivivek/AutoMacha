from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest
from apps.notifications.models import Notification
from apps.travel_requests.tasks import expire_travel_requests_task
from apps.notifications.tasks import cleanup_old_notifications_task
from apps.accounts.tasks import cleanup_expired_otps_task
from apps.common.tasks import system_health_check_task

User = get_user_model()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class CeleryTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="taskuser",
            password="testpassword123",
            institute_email="taskuser@iiitk.ac.in",
            roll_number="124AD0999"
        )
        self.destination = Destination.objects.create(name="Bus Stand")

    def test_expire_travel_requests_task(self):
        # Create an outdated request
        past_time = timezone.now() - timedelta(hours=2)
        req = TravelRequest.objects.create(
            user=self.user,
            destination=self.destination,
            direction="TO_CAMPUS",
            travel_datetime=past_time,
            status="OPEN"
        )
        
        # Execute eager task
        expire_travel_requests_task.delay()

        req.refresh_from_db()
        self.assertEqual(req.status, "EXPIRED")

    def test_cleanup_old_notifications_task(self):
        # Create old read notification and recent read notification
        old_time = timezone.now() - timedelta(days=40)
        recent_time = timezone.now() - timedelta(days=2)

        n_old = Notification.objects.create(
            user=self.user,
            title="Old Notification",
            message="Old test message",
            notification_type=Notification.NotificationTypeChoices.NEW_MATCH_FOUND,
            is_read=True
        )
        Notification.objects.filter(pk=n_old.pk).update(created_at=old_time)

        n_recent = Notification.objects.create(
            user=self.user,
            title="Recent Notification",
            message="Recent test message",
            notification_type=Notification.NotificationTypeChoices.NEW_MATCH_FOUND,
            is_read=True
        )

        n_unread_old = Notification.objects.create(
            user=self.user,
            title="Unread Old Notification",
            message="Unread old test message",
            notification_type=Notification.NotificationTypeChoices.NEW_MATCH_FOUND,
            is_read=False
        )
        Notification.objects.filter(pk=n_unread_old.pk).update(created_at=old_time)

        # Execute cleanup task with 30-day retention
        cleanup_old_notifications_task.delay()

        self.assertFalse(Notification.objects.filter(pk=n_old.pk).exists())
        self.assertTrue(Notification.objects.filter(pk=n_recent.pk).exists())
        self.assertTrue(Notification.objects.filter(pk=n_unread_old.pk).exists())

    def test_cleanup_expired_otps_task(self):
        res = cleanup_expired_otps_task.delay()
        self.assertEqual(res.result, {"deleted_count": 0})

    def test_system_health_check_task(self):
        res = system_health_check_task.delay()
        self.assertEqual(res.result["status"], "healthy")
        self.assertIn("timestamp", res.result)

    def test_celery_beat_schedule_configured(self):
        schedule = getattr(settings, 'CELERY_BEAT_SCHEDULE', {})
        self.assertIn('expire-travel-requests', schedule)
        self.assertIn('delete-expired-otps', schedule)
        self.assertIn('delete-old-notifications', schedule)
        self.assertIn('health-check-task', schedule)
