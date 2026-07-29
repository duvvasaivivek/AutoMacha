"""
Production-Ready Caching Layer & Services for AutoMacha.
Provides safe, fault-tolerant Redis caching with graceful database fallbacks,
hit/miss observability, standardized TTLs, and explicit cache invalidations.
"""
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

# TTL Constants (in seconds)
TTL_SHORT = 30         # 30 seconds (Dashboard stats)
TTL_MEDIUM = 60        # 60 seconds (Unread counts)
TTL_LONG = 900         # 15 minutes (Destinations, reference metadata)

# Metrics Counters (In-memory observability)
_CACHE_METRICS = {
    'hits': 0,
    'misses': 0,
    'errors': 0,
    'invalidations': 0,
}


def get_cache_metrics():
    """Returns current cache hit/miss/invalidation statistics."""
    total = _CACHE_METRICS['hits'] + _CACHE_METRICS['misses']
    hit_rate = (_CACHE_METRICS['hits'] / total * 100) if total > 0 else 0.0
    return {
        **_CACHE_METRICS,
        'total_requests': total,
        'hit_rate_pct': round(hit_rate, 2),
    }


def safe_cache_get(key, default=None):
    """
    Safely retrieves a value from the cache backend.
    If Redis or Cache backend fails, logs warning and returns default without throwing.
    """
    try:
        val = cache.get(key)
        if val is not None:
            _CACHE_METRICS['hits'] += 1
            logger.debug("Cache HIT: %s", key)
            return val
        else:
            _CACHE_METRICS['misses'] += 1
            logger.debug("Cache MISS: %s", key)
            return default
    except Exception as exc:
        _CACHE_METRICS['errors'] += 1
        logger.warning("Cache GET failed for key '%s' (fallback to DB): %s", key, exc)
        return default


def safe_cache_set(key, value, timeout=TTL_SHORT):
    """
    Safely writes a value to the cache backend.
    If Redis fails, logs warning and continues execution cleanly.
    """
    try:
        cache.set(key, value, timeout=timeout)
        logger.debug("Cache SET: %s (TTL: %ds)", key, timeout)
        return True
    except Exception as exc:
        _CACHE_METRICS['errors'] += 1
        logger.warning("Cache SET failed for key '%s': %s", key, exc)
        return False


def safe_cache_delete(key):
    """Safely deletes a single key from cache."""
    try:
        cache.delete(key)
        _CACHE_METRICS['invalidations'] += 1
        logger.debug("Cache DELETE: %s", key)
        return True
    except Exception as exc:
        _CACHE_METRICS['errors'] += 1
        logger.warning("Cache DELETE failed for key '%s': %s", key, exc)
        return False


def safe_cache_delete_many(keys):
    """Safely deletes multiple keys from cache."""
    try:
        cache.delete_many(keys)
        _CACHE_METRICS['invalidations'] += len(keys)
        logger.debug("Cache DELETE MANY: %s keys", len(keys))
        return True
    except Exception as exc:
        _CACHE_METRICS['errors'] += 1
        logger.warning("Cache DELETE MANY failed: %s", exc)
        return False


# ==============================================================================
# DESTINATION CACHE SERVICE
# ==============================================================================
class DestinationCacheService:
    KEY_ALL = 'destinations:all'
    KEY_ACTIVE = 'destinations:active'

    @classmethod
    def get_active_destinations(cls, fetch_func):
        cached_data = safe_cache_get(cls.KEY_ACTIVE)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(cls.KEY_ACTIVE, data, timeout=TTL_LONG)
        return data

    @classmethod
    def get_all_destinations(cls, fetch_func):
        cached_data = safe_cache_get(cls.KEY_ALL)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(cls.KEY_ALL, data, timeout=TTL_LONG)
        return data

    @classmethod
    def invalidate(cls):
        safe_cache_delete_many([cls.KEY_ALL, cls.KEY_ACTIVE])


# ==============================================================================
# DASHBOARD CACHE SERVICE
# ==============================================================================
class DashboardCacheService:
    KEY_ADMIN_STATS = 'admin:dashboard_stats'

    @classmethod
    def get_admin_stats(cls, fetch_func):
        cached_data = safe_cache_get(cls.KEY_ADMIN_STATS)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(cls.KEY_ADMIN_STATS, data, timeout=TTL_SHORT)
        return data

    @classmethod
    def get_user_dashboard(cls, user_id, fetch_func):
        key = f'dashboard:summary:{user_id}'
        cached_data = safe_cache_get(key)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(key, data, timeout=TTL_SHORT)
        return data

    @classmethod
    def invalidate_admin_stats(cls):
        safe_cache_delete(cls.KEY_ADMIN_STATS)

    @classmethod
    def invalidate_user_dashboard(cls, user_id):
        key = f'dashboard:summary:{user_id}'
        safe_cache_delete(key)


# ==============================================================================
# NOTIFICATION CACHE SERVICE
# ==============================================================================
class NotificationCacheService:
    @classmethod
    def get_unread_count(cls, user_id, fetch_func):
        key = f'notifications:unread_count:{user_id}'
        cached_data = safe_cache_get(key)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(key, data, timeout=TTL_MEDIUM)
        return data

    @classmethod
    def invalidate_unread_count(cls, user_id):
        key = f'notifications:unread_count:{user_id}'
        safe_cache_delete(key)


# ==============================================================================
# CHAT CACHE SERVICE
# ==============================================================================
class ChatCacheService:
    @classmethod
    def get_unread_count(cls, user_id, fetch_func):
        key = f'chat:unread_count:{user_id}'
        cached_data = safe_cache_get(key)
        if cached_data is not None:
            return cached_data

        data = fetch_func()
        safe_cache_set(key, data, timeout=TTL_MEDIUM)
        return data

    @classmethod
    def invalidate_unread_count(cls, user_id):
        key = f'chat:unread_count:{user_id}'
        safe_cache_delete(key)
