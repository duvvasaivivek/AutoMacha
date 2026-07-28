"""
Common reusable permissions across all Django apps.
"""
from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to view/edit/delete it.
    Assumes the model instance has a `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and hasattr(obj, 'user') and obj.user == request.user)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow read-only access to anyone,
    but write/delete operations only to the owner of the object.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and hasattr(obj, 'user') and obj.user == request.user)
