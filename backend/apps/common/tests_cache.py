from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.common.cache_services import (
    safe_cache_get,
    safe_cache_set,
    safe_cache_delete,
    get_cache_metrics,
    DestinationCacheService,
    DashboardCacheService,
    NotificationCacheService,
    ChatCacheService,
)

User = get_user_model()


class CacheLayerTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="cache_user",
            password="testpassword123",
            institute_email="cache@iiitk.ac.in",
            roll_number="124AD0099"
        )

    def test_destination_cache_service_caching_and_invalidation(self):
        called = {'count': 0}

        def fetch_destinations():
            called['count'] += 1
            return [{"id": 1, "name": "Bus Stand"}]

        # First call hits DB fetch function
        data1 = DestinationCacheService.get_active_destinations(fetch_destinations)
        self.assertEqual(called['count'], 1)
        self.assertEqual(len(data1), 1)

        # Second call returns cached data without calling fetch function
        data2 = DestinationCacheService.get_active_destinations(fetch_destinations)
        self.assertEqual(called['count'], 1)
        self.assertEqual(data1, data2)

        # Invalidation clears cache
        DestinationCacheService.invalidate()
        data3 = DestinationCacheService.get_active_destinations(fetch_destinations)
        self.assertEqual(called['count'], 2)

    def test_dashboard_cache_service(self):
        called = {'count': 0}

        def fetch_stats():
            called['count'] += 1
            return {"active_requests": 5}

        # First call fetches data
        data1 = DashboardCacheService.get_admin_stats(fetch_stats)
        self.assertEqual(called['count'], 1)

        # Second call uses cache
        data2 = DashboardCacheService.get_admin_stats(fetch_stats)
        self.assertEqual(called['count'], 1)

        # Invalidate admin stats
        DashboardCacheService.invalidate_admin_stats()
        data3 = DashboardCacheService.get_admin_stats(fetch_stats)
        self.assertEqual(called['count'], 2)

    def test_notification_and_chat_cache_services(self):
        def fetch_notifs():
            return 3

        def fetch_chats():
            return 2

        # Notification caching
        c1 = NotificationCacheService.get_unread_count(self.user.id, fetch_notifs)
        self.assertEqual(c1, 3)
        NotificationCacheService.invalidate_unread_count(self.user.id)

        # Chat caching
        c2 = ChatCacheService.get_unread_count(self.user.id, fetch_chats)
        self.assertEqual(c2, 2)
        ChatCacheService.invalidate_unread_count(self.user.id)

    def test_redis_failure_graceful_fallback(self):
        """Verifies that Redis or cache backend errors do NOT crash the application."""
        with patch('django.core.cache.cache.get', side_effect=Exception("Redis connection refused")):
            val = safe_cache_get("some_key", default="db_fallback")
            self.assertEqual(val, "db_fallback")

        with patch('django.core.cache.cache.set', side_effect=Exception("Redis write failure")):
            success = safe_cache_set("some_key", "value")
            self.assertFalse(success)

    def test_cache_metrics_observability(self):
        safe_cache_get("non_existent_key")
        metrics = get_cache_metrics()
        self.assertIn('hits', metrics)
        self.assertIn('misses', metrics)
        self.assertIn('hit_rate_pct', metrics)
