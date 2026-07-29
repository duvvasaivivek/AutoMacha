from rest_framework.permissions import BasePermission


class IsStaffOrSuperUser(BasePermission):
    """
    Permission check granting access ONLY to authenticated staff members or superusers.
    Normal users calling endpoints protected by this permission receive 403 Forbidden.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )


class IsSuperUserOnly(BasePermission):
    """
    Permission check granting access strictly to Django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )
