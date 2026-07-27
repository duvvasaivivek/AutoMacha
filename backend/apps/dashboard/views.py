from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.travel_requests.models import TravelRequest


class DashboardStatsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Ensure outdated open requests transition to EXPIRED before stats calculation
        TravelRequest.expire_outdated()
        user = request.user

        user_requests = TravelRequest.objects.filter(user=user)
        total_requests = user_requests.count()
        active_requests = user_requests.filter(status='OPEN').count()
        expired_requests = user_requests.filter(status='EXPIRED').count()
        cancelled_requests = user_requests.filter(status='CANCELLED').count()

        # Calculate available matches across all user's OPEN travel requests
        open_user_requests = user_requests.filter(status='OPEN').select_related('destination')
        unique_candidate_ids = set()
        for u_req in open_user_requests:
            time_window_start = u_req.travel_datetime - timedelta(minutes=30)
            time_window_end = u_req.travel_datetime + timedelta(minutes=30)
            cands = TravelRequest.objects.filter(
                status='OPEN',
                destination=u_req.destination,
                direction=u_req.direction,
                travel_datetime__gte=time_window_start,
                travel_datetime__lte=time_window_end,
            ).exclude(user=user).values_list('id', flat=True)
            unique_candidate_ids.update(cands)

        available_matches = len(unique_candidate_ids)

        # Determine most frequently selected destination for user
        fav_dest_query = (
            user_requests
            .values('destination__id', 'destination__name')
            .annotate(count=Count('id'))
            .order_by('-count', 'destination__name')
            .first()
        )
        if fav_dest_query:
            favorite_destination = {
                "id": fav_dest_query['destination__id'],
                "name": fav_dest_query['destination__name'],
            }
        else:
            favorite_destination = None

        # Nearest upcoming OPEN trip
        next_trip_obj = (
            user_requests.filter(status='OPEN', travel_datetime__gte=timezone.now())
            .select_related('destination')
            .order_by('travel_datetime')
            .first()
        )
        if next_trip_obj:
            next_trip = {
                "id": next_trip_obj.id,
                "destination": next_trip_obj.destination.name,
                "travel_datetime": next_trip_obj.travel_datetime.isoformat(),
            }
        else:
            next_trip = None

        return Response({
            "active_requests": active_requests,
            "expired_requests": expired_requests,
            "cancelled_requests": cancelled_requests,
            "total_requests": total_requests,
            "available_matches": available_matches,
            "favorite_destination": favorite_destination,
            "next_trip": next_trip,
        }, status=status.HTTP_200_OK)
