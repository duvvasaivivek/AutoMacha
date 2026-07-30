"""
Redis-backed Real-time Presence Management Service for AutoMacha WebSockets.
"""
import logging
from apps.common.cache_services import safe_cache_set, safe_cache_get, safe_cache_delete

logger = logging.getLogger('apps.chat.presence')

PRESENCE_TTL_SECONDS = 60


class PresenceService:
    """
    Manages online/offline presence tracking in Redis without database overhead.
    """

    @classmethod
    def mark_online(cls, user_id: int):
        key = f"presence:user:{user_id}"
        safe_cache_set(key, "online", timeout=PRESENCE_TTL_SECONDS)

    @classmethod
    def mark_offline(cls, user_id: int):
        key = f"presence:user:{user_id}"
        safe_cache_delete(key)

    @classmethod
    def is_user_online(cls, user_id: int) -> bool:
        key = f"presence:user:{user_id}"
        return safe_cache_get(key) == "online"
