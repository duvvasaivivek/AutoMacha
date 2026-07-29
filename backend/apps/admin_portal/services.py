"""
Services for Admin Portal business logic and statistics retrieval.
Designed for high performance and easy Redis caching integration.
"""
from django.contrib.auth import get_user_model
from django.db import connection
from django.utils import timezone

User = get_user_model()


def get_admin_dashboard_stats():
    """
    Retrieves system dashboard statistics using a single combined database query.
    Reduces query count from 8 independent SQL round trips down to EXACTLY 1 query.
    """
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

    raw_sql = """
        SELECT
            (SELECT COUNT(*) FROM accounts_user) AS total_users,
            (SELECT COUNT(*) FROM accounts_user WHERE is_active = true) AS verified_users,
            (SELECT COUNT(*) FROM accounts_user WHERE date_joined >= %s) AS today_registrations,
            (SELECT COUNT(*) FROM travel_requests_travelrequest WHERE status = 'OPEN') AS active_travel_requests,
            (SELECT COUNT(*) FROM travel_requests_travelrequest WHERE status = 'CLOSED') AS completed_rides,
            (SELECT COUNT(*) FROM auto_drivers_autodriver WHERE is_verified = false) AS pending_driver_suggestions,
            (SELECT COUNT(*) FROM destinations_destination WHERE is_active = false) AS pending_destination_suggestions,
            (SELECT COUNT(*) FROM notifications_notification WHERE is_read = false) AS unread_notifications;
    """

    with connection.cursor() as cursor:
        cursor.execute(raw_sql, [today_start])
        row = cursor.fetchone()

    return {
        "total_users": row[0] or 0,
        "verified_users": row[1] or 0,
        "today_registrations": row[2] or 0,
        "active_travel_requests": row[3] or 0,
        "completed_rides": row[4] or 0,
        "pending_driver_suggestions": row[5] or 0,
        "pending_destination_suggestions": row[6] or 0,
        "unread_notifications": row[7] or 0,
    }
