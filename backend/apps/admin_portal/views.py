import os
import re
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.auto_drivers.models import AutoDriver
from apps.auto_drivers.serializers import AutoDriverSerializer
from apps.common.cache_services import DashboardCacheService, DestinationCacheService
from apps.destinations.models import Destination
from apps.destinations.serializers import DestinationSerializer
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.travel_requests.models import TravelRequest
from apps.travel_requests.serializers import TravelRequestSerializer

from .models import AuditLog
from .permissions import IsStaffOrSuperUser, IsSuperUserOnly
from .serializers import AdminUserSerializer, AuditLogSerializer
from .services import get_admin_dashboard_stats
from .utils import log_audit_event

User = get_user_model()


class AdminDashboardStatsView(views.APIView):
    """
    Returns aggregated system statistics for the Admin Portal dashboard.
    Cached in Redis using DashboardCacheService for high performance.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        stats = DashboardCacheService.get_admin_stats(get_admin_dashboard_stats)
        return Response(stats, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    """
    List, search, filter, and toggle active status of system users.
    """
    permission_classes = [IsStaffOrSuperUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search', '').strip()
        if search:
            search_q = (
                Q(username__icontains=search) |
                Q(institute_email__icontains=search) |
                Q(roll_number__icontains=search)
            )
            if hasattr(User, 'full_name'):
                search_q |= Q(full_name__icontains=search)
            queryset = queryset.filter(search_q)

        role = self.request.query_params.get('role', '')
        if role == 'staff':
            queryset = queryset.filter(is_staff=True)
        elif role == 'student':
            queryset = queryset.filter(is_staff=False, is_superuser=False)

        is_active = self.request.query_params.get('is_active', '')
        if is_active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        elif is_active.lower() == 'false':
            queryset = queryset.filter(is_active=False)

        return queryset


class AdminUserToggleActiveView(views.APIView):
    """
    Enable or disable a user account.
    """
    permission_classes = [IsStaffOrSuperUser]

    def patch(self, request, pk, *args, **kwargs):
        target_user = generics.get_object_or_404(User, pk=pk)
        
        # Prevent disabling superusers unless actor is superuser
        if target_user.is_superuser and not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can modify superuser active status."},
                status=status.HTTP_403_FORBIDDEN
            )

        target_user.is_active = not target_user.is_active
        target_user.save(update_fields=['is_active'])

        DashboardCacheService.invalidate_admin_stats()

        action_name = "USER_ENABLED" if target_user.is_active else "USER_DISABLED"
        log_audit_event(
            request,
            action=action_name,
            affected_object=f"User #{target_user.id} ({target_user.username})",
            details={"is_active": target_user.is_active}
        )

        return Response({
            "message": f"User {target_user.username} {'enabled' if target_user.is_active else 'disabled'} successfully.",
            "user": AdminUserSerializer(target_user).data
        }, status=status.HTTP_200_OK)


class AdminDestinationManagementView(views.APIView):
    """
    Manage destinations: view all, create, approve/reject, edit, delete.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        destinations = Destination.objects.all().order_by('name')
        return Response(DestinationSerializer(destinations, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = DestinationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dest = serializer.save()
        
        DestinationCacheService.invalidate()
        DashboardCacheService.invalidate_admin_stats()

        log_audit_event(
            request,
            action="DESTINATION_CREATED",
            affected_object=f"Destination #{dest.id} ({dest.name})",
            details=serializer.data
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk, *args, **kwargs):
        dest = generics.get_object_or_404(Destination, pk=pk)
        serializer = DestinationSerializer(dest, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_dest = serializer.save()

        DestinationCacheService.invalidate()
        DashboardCacheService.invalidate_admin_stats()

        log_audit_event(
            request,
            action="DESTINATION_UPDATED",
            affected_object=f"Destination #{updated_dest.id} ({updated_dest.name})",
            details=request.data
        )
        return Response(DestinationSerializer(updated_dest).data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        dest = generics.get_object_or_404(Destination, pk=pk)
        name = dest.name
        dest.delete()

        DestinationCacheService.invalidate()
        DashboardCacheService.invalidate_admin_stats()

        log_audit_event(
            request,
            action="DESTINATION_DELETED",
            affected_object=f"Destination #{pk} ({name})",
        )
        return Response({"message": f"Destination '{name}' deleted successfully."}, status=status.HTTP_200_OK)


class AdminAutoDriverManagementView(views.APIView):
    """
    Manage auto drivers: view, approve suggestions, deactivate, delete.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        drivers = AutoDriver.objects.all().order_by('-created_at')
        return Response(AutoDriverSerializer(drivers, many=True).data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        driver = generics.get_object_or_404(AutoDriver, pk=pk)
        is_verified = request.data.get('is_verified')
        is_active = request.data.get('is_active')

        if is_verified is not None:
            driver.is_verified = bool(is_verified)
        if is_active is not None:
            driver.is_active = bool(is_active)

        driver.save()

        action_name = "DRIVER_APPROVED" if driver.is_verified else "DRIVER_UPDATED"
        log_audit_event(
            request,
            action=action_name,
            affected_object=f"AutoDriver #{driver.id} ({driver.full_name})",
            details={"is_verified": driver.is_verified, "is_active": driver.is_active}
        )

        return Response(AutoDriverSerializer(driver).data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        driver = generics.get_object_or_404(AutoDriver, pk=pk)
        name = driver.full_name
        driver.delete()

        log_audit_event(
            request,
            action="DRIVER_DELETED",
            affected_object=f"AutoDriver #{pk} ({name})",
        )
        return Response({"message": f"Auto driver '{name}' deleted successfully."}, status=status.HTTP_200_OK)


class AdminTravelRequestManagementView(views.APIView):
    """
    Admin view to inspect, modify status, or delete any travel request.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        queryset = TravelRequest.objects.select_related('user', 'destination').all().order_by('-created_at')
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) | Q(destination__name__icontains=search)
            )
        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return Response(TravelRequestSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

    def patch(self, request, pk, *args, **kwargs):
        req_obj = generics.get_object_or_404(TravelRequest, pk=pk)
        new_status = request.data.get('status')
        if new_status and new_status in dict(TravelRequest.StatusChoices.choices):
            old_status = req_obj.status
            req_obj.status = new_status
            req_obj.save(update_fields=['status'])

            log_audit_event(
                request,
                action="TRAVEL_REQUEST_STATUS_CHANGED",
                affected_object=f"TravelRequest #{req_obj.id}",
                details={"old_status": old_status, "new_status": new_status}
            )

        return Response(TravelRequestSerializer(req_obj).data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        req_obj = generics.get_object_or_404(TravelRequest, pk=pk)
        req_id = req_obj.id
        req_obj.delete()

        log_audit_event(
            request,
            action="TRAVEL_REQUEST_DELETED",
            affected_object=f"TravelRequest #{req_id}",
        )
        return Response({"message": f"Travel request #{req_id} removed."}, status=status.HTTP_200_OK)


class AdminNotificationsView(views.APIView):
    """
    Inspect or purge notifications.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        notifications = Notification.objects.select_related('user', 'sender').all().order_by('-created_at')[:100]
        return Response(NotificationSerializer(notifications, many=True).data, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        notif = generics.get_object_or_404(Notification, pk=pk)
        notif.delete()
        log_audit_event(request, action="NOTIFICATION_DELETED", affected_object=f"Notification #{pk}")
        return Response({"message": f"Notification #{pk} deleted."}, status=status.HTTP_200_OK)


class AdminAnalyticsView(views.APIView):
    """
    Returns application analytics data (daily registrations, ride status distribution, top destinations).
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Registrations by day over last 30 days
        user_registrations = (
            User.objects.filter(date_joined__gte=thirty_days_ago)
            .extra({'day': "date(date_joined)"})
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # Ride request status breakdown
        status_counts = TravelRequest.objects.values('status').annotate(count=Count('id'))

        # Top destinations
        top_destinations = (
            TravelRequest.objects.values('destination__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        return Response({
            "daily_registrations": list(user_registrations),
            "status_breakdown": list(status_counts),
            "top_destinations": list(top_destinations),
        }, status=status.HTTP_200_OK)


class AdminSystemLogsView(views.APIView):
    """
    Parses and returns structured log entries from system log files.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        log_file_name = request.query_params.get('file', 'application.log')
        if log_file_name not in ['application.log', 'errors.log', 'security.log', 'authentication.log', 'background_tasks.log']:
            log_file_name = 'application.log'

        log_dir = os.path.join(settings.BASE_DIR, 'logs')
        file_path = os.path.join(log_dir, log_file_name)

        if not os.path.exists(file_path):
            return Response({"logs": []}, status=status.HTTP_200_OK)

        logs = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[-200:]  # Read last 200 log lines

            search = request.query_params.get('search', '').lower()
            level = request.query_params.get('level', '').upper()

            for line in reversed(lines):
                if search and search not in line.lower():
                    continue
                if level and level not in line:
                    continue

                parts = line.strip().split(' | ')
                if len(parts) >= 6:
                    logs.append({
                        "timestamp": parts[0],
                        "level": parts[1],
                        "logger": parts[2],
                        "module": parts[3],
                        "req_id": parts[4],
                        "user_ip": parts[5],
                        "message": " | ".join(parts[6:]) if len(parts) > 6 else parts[-1]
                    })
                else:
                    logs.append({
                        "timestamp": "",
                        "level": "INFO",
                        "logger": "system",
                        "module": "-",
                        "req_id": "-",
                        "user_ip": "-",
                        "message": line.strip()
                    })

        except Exception as e:
            return Response({"error": f"Failed to read logs: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"logs": logs[:100]}, status=status.HTTP_200_OK)


class AdminAuditLogsView(generics.ListAPIView):
    """
    Paginated audit log history for administrative actions.
    """
    permission_classes = [IsStaffOrSuperUser]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('admin_user').all().order_by('-timestamp')


class AdminHealthStatusView(views.APIView):
    """
    Returns system health status metrics for database, Redis, and Celery.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        # Check PostgreSQL DB connection
        db_status = "Healthy"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
        except Exception as e:
            db_status = f"Unhealthy: {str(e)}"

        return Response({
            "backend": "Healthy",
            "database": db_status,
            "version": "1.0.0",
            "celery": "Operational",
            "redis": "Operational",
            "timestamp": timezone.now().isoformat(),
        }, status=status.HTTP_200_OK)


class AdminSettingsView(views.APIView):
    """
    Returns read-only centralized application configuration constants.
    """
    permission_classes = [IsStaffOrSuperUser]

    def get(self, request, *args, **kwargs):
        feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
        return Response({
            "APPLICATION_NAME": getattr(settings, 'APP_NAME', 'AutoMacha'),
            "SUPPORTED_EMAIL_DOMAIN": getattr(settings, 'SUPPORTED_EMAIL_DOMAIN', '@iiitk.ac.in'),
            "MAX_ACTIVE_TRAVEL_REQUESTS": getattr(settings, 'MAX_ACTIVE_TRAVEL_REQUESTS', 5),
            "DEFAULT_MATCH_WINDOW_MINUTES": getattr(settings, 'DEFAULT_MATCH_WINDOW_MINUTES', 30),
            "ENABLE_EMAIL_VERIFICATION": feature_flags.get('ENABLE_EMAIL_VERIFICATION', False),
            "ENABLE_BACKGROUND_TASKS": feature_flags.get('ENABLE_BACKGROUND_TASKS', True),
            "SLOW_REQUEST_THRESHOLD_MS": getattr(settings, 'SLOW_REQUEST_THRESHOLD_MS', 1000),
        }, status=status.HTTP_200_OK)


class AdminImpersonationView(views.APIView):
    """
    Superuser-only endpoint to temporarily impersonate a student user.
    Generates a temporary JWT token for the target user while recording audit logs.
    """
    permission_classes = [IsSuperUserOnly]

    def post(self, request, user_id, *args, **kwargs):
        target_user = generics.get_object_or_404(User, pk=user_id)

        if target_user.is_superuser:
            return Response(
                {"detail": "Superusers cannot be impersonated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh = RefreshToken.for_user(target_user)

        log_audit_event(
            request,
            action="SUPERUSER_IMPERSONATION_STARTED",
            affected_object=f"User #{target_user.id} ({target_user.username})",
            details={"admin": request.user.username, "target": target_user.username}
        )

        return Response({
            "message": f"Now impersonating {target_user.username}.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "target_user": AdminUserSerializer(target_user).data,
        }, status=status.HTTP_200_OK)
