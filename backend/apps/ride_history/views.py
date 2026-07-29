from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, MethodNotAllowed

from .models import RideHistory
from .serializers import (
    RideHistorySerializer,
    RideHistorySummarySerializer,
)


class IsOwnerPermission(permissions.BasePermission):
    """
    Object-level permission to ensure users can only view their own ride history.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class RideHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for Ride History.
    Users can only retrieve and filter their own ride activity.
    Manual creation, modification, or deletion by users is disallowed.
    """
    serializer_class = RideHistorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerPermission]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            RideHistory.objects
            .filter(user=user)
            .select_related('ride_partner', 'travel_request')
        )

        # 1. Filter by Status
        status_param = self.request.query_params.get('status')
        if status_param and status_param in ['COMPLETED', 'CANCELLED', 'EXPIRED']:
            queryset = queryset.filter(ride_status=status_param)

        # 2. Filter by Destination
        destination_param = self.request.query_params.get('destination')
        if destination_param:
            queryset = queryset.filter(destination__icontains=destination_param)

        # 3. Filter by Ride Partner
        partner_param = self.request.query_params.get('ride_partner')
        if partner_param:
            if partner_param.isdigit():
                queryset = queryset.filter(ride_partner_id=int(partner_param))
            else:
                queryset = queryset.filter(
                    Q(ride_partner__username__icontains=partner_param) |
                    Q(ride_partner__first_name__icontains=partner_param) |
                    Q(ride_partner__last_name__icontains=partner_param)
                )

        # 4. Filter by Date Shortcut or Custom Range
        date_shortcut = self.request.query_params.get('date_range')
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if date_shortcut == 'today':
            queryset = queryset.filter(departure_time__gte=today_start)
        elif date_shortcut == 'week':
            week_start = today_start - timedelta(days=7)
            queryset = queryset.filter(departure_time__gte=week_start)
        elif date_shortcut == 'month':
            month_start = today_start - timedelta(days=30)
            queryset = queryset.filter(departure_time__gte=month_start)

        from_date = self.request.query_params.get('from_date')
        if from_date:
            parsed_from = parse_date(from_date) or parse_datetime(from_date)
            if parsed_from:
                queryset = queryset.filter(departure_time__gte=parsed_from)

        to_date = self.request.query_params.get('to_date')
        if to_date:
            parsed_to = parse_date(to_date) or parse_datetime(to_date)
            if parsed_to:
                queryset = queryset.filter(departure_time__lte=parsed_to)

        # 5. Search query (Destination, Partner Name, Pickup Location)
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(destination__icontains=search_query) |
                Q(pickup_location__icontains=search_query) |
                Q(ride_partner__username__icontains=search_query) |
                Q(ride_partner__first_name__icontains=search_query) |
                Q(ride_partner__last_name__icontains=search_query)
            )

        # 6. Ordering (default newest first: -departure_time)
        ordering_param = self.request.query_params.get('ordering', '-departure_time')
        if ordering_param in ['departure_time', '-departure_time', 'created_at', '-created_at']:
            queryset = queryset.order_by(ordering_param)
        else:
            queryset = queryset.order_by('-departure_time')

        return queryset

    @action(detail=False, methods=['GET'], url_path='summary')
    def summary(self, request):
        """
        Returns summary count statistics for the user's ride history.
        """
        user_history = RideHistory.objects.filter(user=request.user)
        stats = user_history.aggregate(
            total_rides=Count('id'),
            completed_rides=Count('id', filter=Q(ride_status='COMPLETED')),
            cancelled_rides=Count('id', filter=Q(ride_status='CANCELLED')),
            expired_rides=Count('id', filter=Q(ride_status='EXPIRED')),
        )

        data = {
            'total_rides': stats['total_rides'] or 0,
            'completed_rides': stats['completed_rides'] or 0,
            'cancelled_rides': stats['cancelled_rides'] or 0,
            'expired_rides': stats['expired_rides'] or 0,
        }
        serializer = RideHistorySummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Enforce API immutability
    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST', detail='Ride History is created automatically and cannot be added manually.')

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT', detail='Ride History records are immutable.')

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH', detail='Ride History records are immutable.')

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE', detail='Ride History records cannot be deleted.')
