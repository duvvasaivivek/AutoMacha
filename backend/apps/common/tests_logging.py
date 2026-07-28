import logging
import os
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.logging import RequestContextFilter, StructuredFormatter
from apps.travel_requests.tasks import expire_travel_requests_task

User = get_user_model()


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_STORE_EAGER_RESULT=False,
)
class RequestIDAndLoggingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reqiduser",
            password="testpassword123",
            institute_email="reqiduser@iiitk.ac.in",
            roll_number="124AD0777"
        )

    def test_auto_generated_request_id_in_response_headers(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('X-Request-ID', res.headers)
        request_id = res.headers['X-Request-ID']
        self.assertTrue(len(request_id) > 10)

    def test_custom_incoming_request_id_preserved(self):
        custom_id = "custom-trace-id-9999"
        res = self.client.get('/api/health/', HTTP_X_REQUEST_ID=custom_id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.headers.get('X-Request-ID'), custom_id)

    def test_structured_formatter_contains_request_id(self):
        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=15,
            msg="Traceable log entry",
            args=(),
            exc_info=None
        )
        record.request_id = "trace-uuid-8888"
        record.username = "reqiduser"
        record.user_id = str(self.user.id)
        record.client_ip = "192.168.1.1"
        record.http_method = "POST"
        record.path = "/api/travel-requests/"

        formatted = formatter.format(record)
        self.assertIn("req_id=trace-uuid-8888", formatted)
        self.assertIn(f"user=reqiduser#{self.user.id}", formatted)
        self.assertIn("POST /api/travel-requests/", formatted)
        self.assertIn("Traceable log entry", formatted)

    def test_slow_request_threshold_logging(self):
        with patch('apps.common.middleware.SLOW_REQUEST_THRESHOLD_MS', -1):
            with self.assertLogs('api.request', level='WARNING') as cm:
                res = self.client.get('/api/health/')
                self.assertEqual(res.status_code, status.HTTP_200_OK)
                self.assertTrue(any("Slow API Endpoint Detected" in log for log in cm.output))

    def test_celery_task_preserves_request_id(self):
        custom_req_id = "req-id-task-correlation-5555"
        with patch('apps.travel_requests.tasks.expire_outdated_requests') as mock_service:
            expire_travel_requests_task.apply(kwargs={'request_id': custom_req_id})
            mock_service.assert_called_once()
