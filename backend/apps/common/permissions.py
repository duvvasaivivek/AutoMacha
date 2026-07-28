"""
Common reusable permissions across all Django apps with security audit logging.
"""
import logging
from rest_framework import permissions

sec_logger = logging.getLogger('security')


class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to view/edit/delete it.
    Assumes the model instance has a `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        is_granted = bool(
            request.user and request.user.is_authenticated and hasattr(obj, 'user') and obj.user == request.user
        )
        if not is_granted:
            sec_logger.warning(
                "Permission Denied: User %s attempted unauthorized access to %s owned by %s",
                getattr(request.user, 'username', 'anonymous'),
                obj.__class__.__name__,
                getattr(getattr(obj, 'user', None), 'username', 'unknown'),
            )
        return is_granted


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow read-only access to anyone,
    but write/delete operations only to the owner of the object.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        is_granted = bool(
            request.user and request.user.is_authenticated and hasattr(obj, 'user') and obj.user == request.user
        )
        if not is_granted:
            sec_logger.warning(
                "Permission Denied: User %s attempted unauthorized modification (%s) to %s owned by %s",
                getattr(request.user, 'username', 'anonymous'),
                request.method,
                obj.__class__.__name__,
                getattr(getattr(obj, 'user', None), 'username', 'unknown'),
            )
        return is_granted
