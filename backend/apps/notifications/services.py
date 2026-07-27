from .models import Notification


def create_notification(user, title, message, notification_type, related_object_id=None, sender=None):
    """
    Creates a notification for the given user if an identical notification does not already exist
    for this event/related object to avoid duplicates.
    """
    notification, created = Notification.objects.get_or_create(
        user=user,
        notification_type=notification_type,
        related_object_id=related_object_id,
        defaults={
            'title': title,
            'message': message,
            'sender': sender,
        }
    )
    return notification, created


def notify_ride_share_request_received(receiver, sender, related_object_id=None):
    title = "New Ride Share Request"
    message = f"{sender.username} wants to share a ride with you."
    return create_notification(
        user=receiver,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_RECEIVED,
        related_object_id=related_object_id,
        sender=sender,
    )


def notify_ride_share_request_accepted(sender, acceptor, related_object_id=None):
    title = "Ride Request Accepted"
    message = f"{acceptor.username} accepted your ride request."
    return create_notification(
        user=sender,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_ACCEPTED,
        related_object_id=related_object_id,
        sender=acceptor,
    )


def notify_ride_share_request_declined(sender, decliner, related_object_id=None):
    title = "Ride Request Declined"
    message = f"{decliner.username} declined your ride request."
    return create_notification(
        user=sender,
        title=title,
        message=message,
        notification_type=Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_DECLINED,
        related_object_id=related_object_id,
        sender=decliner,
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
