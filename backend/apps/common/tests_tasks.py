from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.tasks import cleanup_expired_otps_task
from apps.notifications.tasks import cleanup_old_notifications_task, send_notification_async_task
from apps.travel_requests.tasks import expire_travel_requests_task, dispatch_match_notifications_task
from apps.dashboard.tasks import refresh_dashboard_cache_task
from apps.common.tasks import system_health_check_task, send_email_async_task
from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest

User = get_user_model()


class CeleryTaskUnitTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="task_test_user",
            password="testpassword123",
            institute_email="taskuser@iiitk.ac.in",
            roll_number="124CS999"
        )
        self.dest = Destination.objects.create(name="Bus Stand", is_active=True)

    def test_cleanup_expired_otps_task(self):
        result = cleanup_expired_otps_task()
        self.assertIn("deleted_count", result)

    def test_cleanup_old_notifications_task(self):
        result = cleanup_old_notifications_task()
        self.assertIn("deleted_count", result)

    def test_expire_travel_requests_task(self):
        # Create an expired travel request
        past_time = timezone.now() - timedelta(hours=2)
        TravelRequest.objects.create(
            user=self.user,
            destination=self.dest,
            direction='FROM_CAMPUS',
            travel_datetime=past_time,
            status='OPEN'
        )
        expire_travel_requests_task()
        req = TravelRequest.objects.get(user=self.user)
        self.assertEqual(req.status, 'EXPIRED')

    def test_system_health_check_task(self):
        result = system_health_check_task()
        self.assertEqual(result["status"], "healthy")

    def test_send_email_async_task(self):
        with patch('apps.common.tasks.send_mail', return_value=1) as mock_send:
            res = send_email_async_task("Test Subject", "Test Body", ["test@example.com"])
            self.assertEqual(res["sent_count"], 1)
            mock_send.assert_called_once()

    def test_send_notification_async_task(self):
        res = send_notification_async_task(
            user_id=self.user.id,
            title="Async Notification",
            message="Your ride has been matched",
            notification_type="NEW_MATCH_FOUND"
        )
        self.assertTrue(res["created"])

    def test_dispatch_match_notifications_task(self):
        req = TravelRequest.objects.create(
            user=self.user,
            destination=self.dest,
            direction='FROM_CAMPUS',
            travel_datetime=timezone.now() + timedelta(hours=2),
            status='OPEN'
        )
        dispatch_match_notifications_task(req.id)

    def test_refresh_dashboard_cache_task(self):
        stats = refresh_dashboard_cache_task()
        self.assertIsNotNone(stats)
