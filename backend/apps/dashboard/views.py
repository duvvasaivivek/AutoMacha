from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.cache_services import DashboardCacheService
from ..travel_requests.models import TravelRequest


class DashboardStatsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        def _fetch():
            now = timezone.now()
            user_requests = TravelRequest.objects.filter(user=user)

            # 1 Single aggregated query for all request counts without making database writes
            counts = user_requests.aggregate(
                total_requests=Count('id'),
                active_requests=Count('id', filter=Q(status='OPEN', travel_datetime__gte=now)),
                expired_requests=Count('id', filter=Q(status='EXPIRED') | Q(status='OPEN', travel_datetime__lt=now)),
                cancelled_requests=Count('id', filter=Q(status='CANCELLED')),
            )

            # Efficient batch lookup for available matches without N+1 query loop
            open_user_requests = user_requests.filter(status='OPEN', travel_datetime__gte=now).select_related('destination')
            if open_user_requests.exists():
                match_query = Q()
                for u_req in open_user_requests:
                    time_window_start = u_req.travel_datetime - timedelta(minutes=30)
                    time_window_end = u_req.travel_datetime + timedelta(minutes=30)
                    match_query |= Q(
                        destination=u_req.destination,
                        direction=u_req.direction,
                        travel_datetime__gte=time_window_start,
                        travel_datetime__lte=time_window_end,
                    )

                available_matches = (
                    TravelRequest.objects.filter(match_query, status='OPEN', travel_datetime__gte=now)
                    .exclude(user=user)
                    .values('id')
                    .distinct()
                    .count()
                )
            else:
                available_matches = 0

            # Most frequently selected destination for user
            fav_dest_query = (
                user_requests
                .values('destination__id', 'destination__name')
                .annotate(count=Count('id'))
                .order_by('-count', 'destination__name')
                .first()
            )
            favorite_destination = (
                {
                    "id": fav_dest_query['destination__id'],
                    "name": fav_dest_query['destination__name'],
                }
                if fav_dest_query
                else None
            )

            # Nearest upcoming OPEN trip
            next_trip_obj = (
                user_requests.filter(status='OPEN', travel_datetime__gte=now)
                .select_related('destination')
                .order_by('travel_datetime')
                .first()
            )
            next_trip = (
                {
                    "id": next_trip_obj.id,
                    "destination": next_trip_obj.destination.name,
                    "travel_datetime": next_trip_obj.travel_datetime.isoformat(),
                }
                if next_trip_obj
                else None
            )

            return {
                "active_requests": counts['active_requests'] or 0,
                "expired_requests": counts['expired_requests'] or 0,
                "cancelled_requests": counts['cancelled_requests'] or 0,
                "total_requests": counts['total_requests'] or 0,
                "available_matches": available_matches,
                "favorite_destination": favorite_destination,
                "next_trip": next_trip,
            }

        stats = DashboardCacheService.get_user_dashboard(user.id, _fetch)
        return Response(stats, status=status.HTTP_200_OK)
