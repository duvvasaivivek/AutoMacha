"""
Business logic services for the travel_requests app.
Extracts reusable logic from views to avoid duplication and improve testability.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from .models import TravelRequest

logger = logging.getLogger(__name__)


def find_matching_candidates(travel_request, time_window_minutes=30):
    """
    Find OPEN travel requests that match the given request's destination,
    direction, and are within a time window (default ±30 minutes).
    Excludes the requesting user.

    Returns a QuerySet of matching TravelRequest objects.
    """
    time_window_start = travel_request.travel_datetime - timedelta(minutes=time_window_minutes)
    time_window_end = travel_request.travel_datetime + timedelta(minutes=time_window_minutes)

    return TravelRequest.objects.filter(
        status='OPEN',
        destination=travel_request.destination,
        direction=travel_request.direction,
        travel_datetime__gte=time_window_start,
        travel_datetime__lte=time_window_end,
    ).exclude(
        user=travel_request.user
    ).select_related('user', 'destination')


def notify_matches_for_request(travel_request):
    """
    Find matching candidates for a travel request and send NEW_MATCH_FOUND
    notifications to both the request owner and each matching candidate.
    """
    from ..notifications.services import notify_new_match_found

    candidates = find_matching_candidates(travel_request)
    if candidates.exists():
        notify_new_match_found(
            user=travel_request.user,
            related_object_id=travel_request.id,
        )
        for cand in candidates:
            notify_new_match_found(
                user=cand.user,
                related_object_id=cand.id,
            )


def expire_outdated_requests():
    """
    Transition any OPEN travel requests whose scheduled travel_datetime
    has passed to EXPIRED status, and notify the owners.
    Efficiently processes records to prevent duplicate SQL evaluations.
    """
    from ..notifications.services import notify_travel_request_expired
    from apps.ride_history.services import record_expired_ride

    outdated_list = list(TravelRequest.objects.filter(
        status='OPEN',
        travel_datetime__lt=timezone.now(),
    ).select_related('user', 'destination'))

    if not outdated_list:
        return 0

    expired_ids = [req.id for req in outdated_list]
    for req in outdated_list:
        notify_travel_request_expired(req.user, req.id)
        record_expired_ride(req)

    updated_count = TravelRequest.objects.filter(id__in=expired_ids).update(status='EXPIRED')
    logger.info("Expired %d outdated travel request(s).", updated_count)
    return updated_count
