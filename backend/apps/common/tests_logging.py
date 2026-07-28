import logging
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.logging import RequestContextFilter, StructuredFormatter

User = get_user_model()


class StructuredLoggingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="loguser",
            password="testpassword123",
            institute_email="loguser@iiitk.ac.in",
            roll_number="124AD0888"
        )

    def test_request_id_header_injected(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('X-Request-ID', res.headers)
        self.assertTrue(len(res.headers['X-Request-ID']) > 10)

    def test_structured_formatter(self):
        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test log message",
            args=(),
            exc_info=None
        )
        record.request_id = "test-uuid-1234"
        record.username = "loguser"
        record.user_id = "1"
        record.client_ip = "127.0.0.1"
        record.http_method = "GET"
        record.path = "/api/health/"

        formatted = formatter.format(record)
        self.assertIn("INFO", formatted)
        self.assertIn("test.logger", formatted)
        self.assertIn("req_id=test-uuid-1234", formatted)
        self.assertIn("user=loguser#1", formatted)
        self.assertIn("GET /api/health/", formatted)
        self.assertIn("Test log message", formatted)

    def test_log_files_created(self):
        logs_dir = getattr(settings, 'LOGS_DIR', None)
        self.assertIsNotNone(logs_dir)
        self.assertTrue(os.path.exists(logs_dir))

        # Make request to generate logs
        self.client.get('/api/health/')

        app_log_path = os.path.join(logs_dir, 'application.log')
        self.assertTrue(os.path.exists(app_log_path))

    def test_registration_generates_auth_log(self):
        reg_data = {
            "username": "newloguser",
            "password": "testpassword123",
            "institute_email": "newloguser@iiitk.ac.in",
            "roll_number": "124AD0889",
            "branch": "CSE",
            "hostel": "B1"
        }
        res = self.client.post('/api/accounts/register/', reg_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        logs_dir = getattr(settings, 'LOGS_DIR', None)
        auth_log_path = os.path.join(logs_dir, 'authentication.log')
        self.assertTrue(os.path.exists(auth_log_path))

        with open(auth_log_path, 'r', encoding='utf-8') as f:
            log_content = f.read()
            self.assertIn("User Registration Success", log_content)
            self.assertIn("newloguser", log_content)
            # Ensure password is NOT leaked in logs
            self.assertNotIn("testpassword123", log_content)
