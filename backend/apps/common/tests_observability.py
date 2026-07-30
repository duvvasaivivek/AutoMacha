import json
import logging
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.common.logging import JSONFormatter, set_request_context, clear_request_context


class ObservabilityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_full_health_check_endpoint(self):
        """Verify GET /health/ and /api/health/ return 200 OK with component diagnostic details."""
        res1 = self.client.get('/health/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data.get('status'), 'healthy')
        self.assertIn('components', res1.data)
        self.assertEqual(res1.data['components']['database'], 'ok')

        res2 = self.client.get('/api/health/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

    def test_liveness_probe_endpoint(self):
        """Verify GET /health/live/ and /api/health/live/ return 200 OK."""
        res1 = self.client.get('/health/live/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data.get('status'), 'alive')

        res2 = self.client.get('/api/health/live/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

    def test_readiness_probe_endpoint(self):
        """Verify GET /health/ready/ and /api/health/ready/ return 200 OK when DB/Redis connected."""
        res1 = self.client.get('/health/ready/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data.get('status'), 'ready')

        res2 = self.client.get('/api/health/ready/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

    def test_metrics_export_prometheus_text(self):
        """Verify GET /metrics returns Prometheus text exposition format."""
        res = self.client.get('/metrics')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.content.startswith(b'# HELP') or b'automacha_http_requests_total' in res.content)
        self.assertIn('text/plain', res.headers.get('Content-Type'))

    def test_metrics_export_json_format(self):
        """Verify GET /api/metrics/?format=json returns JSON metric summary."""
        res = self.client.get('/api/metrics/?format=json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('http', res.data)
        self.assertIn('database', res.data)
        self.assertIn('redis', res.data)

    def test_request_id_tracing_header(self):
        """Verify every response contains an X-Request-ID header."""
        res = self.client.get('/api/health/')
        self.assertIn('X-Request-ID', res.headers)
        self.assertTrue(len(res.headers['X-Request-ID']) > 10)

    def test_json_formatter_structured_output(self):
        """Verify JSONFormatter produces valid JSON log records."""
        logger = logging.getLogger('test.json.formatter')
        formatter = JSONFormatter()
        
        ctx = {
            'request_id': 'test-uuid-1234',
            'user_id': '42',
            'username': 'student_tester',
            'client_ip': '127.0.0.1',
            'user_agent': 'pytest',
            'http_method': 'GET',
            'path': '/api/test/',
        }
        set_request_context(ctx)

        record = logger.makeRecord(
            name='test.logger',
            level=logging.INFO,
            fn='test_func',
            lno=10,
            msg='Test log message',
            args=(),
            exc_info=None,
        )

        formatted_json = formatter.format(record)
        clear_request_context()

        parsed = json.loads(formatted_json)
        self.assertEqual(parsed['level'], 'INFO')
        self.assertEqual(parsed['request_id'], 'test-uuid-1234')
        self.assertEqual(parsed['username'], 'student_tester')
        self.assertEqual(parsed['message'], 'Test log message')
