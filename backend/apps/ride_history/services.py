"""
Business logic services for automatic Ride History creation and management.
Ensures history records are immutable snapshots and prevents duplicates.
"""
import logging
from django.utils import timezone
from .models import RideHistory

logger = logging.getLogger(__name__)


def create_ride_history_entry(
    user,
    travel_request=None,
    ride_status=RideHistory.StatusChoices.COMPLETED,
    ride_partner=None,
    ride_request_id=None,
    destination=None,
    pickup_location=None,
    departure_time=None,
    completed_at=None,
):
    """
    Safely creates a RideHistory record for a user, maintaining idempotency.
    If travel_request is provided, destination and departure_time are snapshotted.
    """
    if not user:
        return None

    if travel_request:
        dest_snapshot = destination or (travel_request.destination.name if travel_request.destination else 'Unknown Destination')
        dep_time_snapshot = departure_time or travel_request.travel_datetime
        direction_label = travel_request.get_direction_display()
        pickup_snapshot = pickup_location or ('Campus' if travel_request.direction == 'FROM_CAMPUS' else dest_snapshot)
    else:
        dest_snapshot = destination or 'Unknown Destination'
        dep_time_snapshot = departure_time or timezone.now()
        pickup_snapshot = pickup_location or 'Campus'

    comp_at = completed_at or timezone.now()

    # Avoid duplicate records for the same (user, travel_request, status)
    if travel_request:
        history, created = RideHistory.objects.get_or_create(
            user=user,
            travel_request=travel_request,
            ride_status=ride_status,
            defaults={
                'ride_request_id': ride_request_id,
                'ride_partner': ride_partner,
                'destination': dest_snapshot,
                'pickup_location': pickup_snapshot,
                'departure_time': dep_time_snapshot,
                'completed_at': comp_at,
            }
        )
    else:
        history = RideHistory.objects.create(
            user=user,
            ride_request_id=ride_request_id,
            ride_partner=ride_partner,
            destination=dest_snapshot,
            pickup_location=pickup_snapshot,
            departure_time=dep_time_snapshot,
            completed_at=comp_at,
            ride_status=ride_status,
        )
        created = True

    if created:
        logger.info(
            "Created RideHistory entry #%d for @%s (Status: %s, Destination: %s)",
            history.id, user.username, ride_status, dest_snapshot
        )
    return history


def record_completed_ride(travel_request, partner_user=None, ride_request_id=None):
    """
    Automatically creates COMPLETED history entries for both driver/requester and partner.
    """
    history_user = create_ride_history_entry(
        user=travel_request.user,
        travel_request=travel_request,
        ride_status=RideHistory.StatusChoices.COMPLETED,
        ride_partner=partner_user,
        ride_request_id=ride_request_id,
    )

    history_partner = None
    if partner_user and partner_user != travel_request.user:
        history_partner = create_ride_history_entry(
            user=partner_user,
            travel_request=travel_request,
            ride_status=RideHistory.StatusChoices.COMPLETED,
            ride_partner=travel_request.user,
            ride_request_id=ride_request_id,
        )

    return history_user, history_partner


def record_cancelled_ride(travel_request, partner_user=None, ride_request_id=None):
    """
    Automatically creates CANCELLED history entries for the user (and partner if applicable).
    """
    history_user = create_ride_history_entry(
        user=travel_request.user,
        travel_request=travel_request,
        ride_status=RideHistory.StatusChoices.CANCELLED,
        ride_partner=partner_user,
        ride_request_id=ride_request_id,
    )

    history_partner = None
    if partner_user and partner_user != travel_request.user:
        history_partner = create_ride_history_entry(
            user=partner_user,
            travel_request=travel_request,
            ride_status=RideHistory.StatusChoices.CANCELLED,
            ride_partner=travel_request.user,
            ride_request_id=ride_request_id,
        )

    return history_user, history_partner


def record_expired_ride(travel_request):
    """
    Automatically creates an EXPIRED history entry for a travel request.
    """
    return create_ride_history_entry(
        user=travel_request.user,
        travel_request=travel_request,
        ride_status=RideHistory.StatusChoices.EXPIRED,
    )
