from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


def _resolve_user(user_or_username):
    if not user_or_username:
        return None
    if isinstance(user_or_username, User) or hasattr(user_or_username, 'username'):
        return user_or_username
    return User.objects.filter(username=str(user_or_username)).first()


def create_notification(user, title, message, notification_type, related_object_id=None, sender=None):
    """
    Creates a notification for the given user if an identical notification does not already exist
    for this event/related object to avoid duplicates.
    """
    sender_instance = _resolve_user(sender)
    notification, created = Notification.objects.get_or_create(
        user=user,
        notification_type=notification_type,
        related_object_id=related_object_id,
        defaults={
            'title': title,
            'message': message,
            'sender': sender_instance,
        }
    )
    return notification, created


def notify_ride_share_request_received(receiver, sender, related_object_id=None):
    sender_instance = _resolve_user(sender)
    sender_name = sender_instance.username if sender_instance else str(sender)
    title = "New Ride Share Request"
    message = f"{sender_name} wants to share a ride with you."
    return create_notification(
        user=receiver,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_RECEIVED,
        related_object_id=related_object_id,
        sender=sender_instance,
    )


def notify_ride_share_request_accepted(sender, acceptor, related_object_id=None):
    acceptor_instance = _resolve_user(acceptor)
    acceptor_name = acceptor_instance.username if acceptor_instance else str(acceptor)
    title = "Ride Request Accepted"
    message = f"{acceptor_name} accepted your ride request."
    return create_notification(
        user=sender,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_ACCEPTED,
        related_object_id=related_object_id,
        sender=acceptor_instance,
    )


def notify_ride_share_request_declined(sender, decliner, related_object_id=None):
    decliner_instance = _resolve_user(decliner)
    decliner_name = decliner_instance.username if decliner_instance else str(decliner)
    title = "Ride Request Declined"
    message = f"{decliner_name} declined your ride request."
    return create_notification(
        user=sender,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.TRAVEL_REQUEST_DECLINED if hasattr(Notification.NotificationTypeChoices, 'TRAVEL_REQUEST_DECLINED') else Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_DECLINED,
        related_object_id=related_object_id,
        sender=decliner_instance,
    )


def notify_travel_request_expired(owner, related_object_id=None):
    title = "Travel Request Expired"
    message = "Your travel request has expired."
    return create_notification(
        user=owner,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.TRAVEL_REQUEST_EXPIRED,
        related_object_id=related_object_id,
    )


def notify_new_match_found(user, related_object_id=None):
    title = "New Ride Match Found"
    message = "A new compatible ride match is available."
    return create_notification(
        user=user,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.NEW_MATCH_FOUND,
        related_object_id=related_object_id,
    )
