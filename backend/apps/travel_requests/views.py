import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError, DatabaseError
from django.db.models import Case, When, Value, IntegerField, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import is_naive, make_aware

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chat.services import close_chat_room
from apps.common.cache_services import DashboardCacheService
from apps.common.permissions import IsOwner
from apps.ride_history.services import record_cancelled_ride
from .models import TravelRequest
from .serializers import (
    TravelRequestSerializer,
    TravelRequestListSerializer,
    TravelRequestMatchSerializer,
    MyTravelRequestSerializer,
)
from .services import find_matching_candidates, notify_matches_for_request
from .tasks import dispatch_match_notifications_task

logger = logging.getLogger(__name__)
User = get_user_model()


class TravelRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TravelRequestSerializer
        return TravelRequestListSerializer

    def get_queryset(self):
        now = timezone.now()
        queryset = TravelRequest.objects.filter(is_deleted=False).select_related('destination', 'user').order_by('travel_datetime')

        query_params = getattr(self.request, 'query_params', getattr(self.request, 'GET', {}))

        # Status filter (default to OPEN if not specified, unless ALL is specified)
        status_param = query_params.get('status')
        if status_param and status_param in ['OPEN', 'CLOSED', 'CANCELLED', 'EXPIRED']:
            queryset = queryset.filter(status=status_param)
        elif status_param != 'ALL':
            queryset = queryset.filter(status='OPEN', travel_datetime__gte=now)

        # Destination filter
        destination_param = query_params.get('destination')
        if destination_param:
            queryset = queryset.filter(destination_id=destination_param)

        # Direction filter
        direction_param = query_params.get('direction')
        if direction_param in ['TO_CAMPUS', 'FROM_CAMPUS']:
            queryset = queryset.filter(direction=direction_param)

        # Date filter (YYYY-MM-DD)
        date_param = query_params.get('date')
        if date_param:
            parsed_date = parse_date(date_param)
            if parsed_date:
                queryset = queryset.filter(travel_datetime__date=parsed_date)

        # From datetime filter
        from_dt_param = query_params.get('from_datetime')
        if from_dt_param:
            parsed_from = parse_datetime(from_dt_param)
            if parsed_from:
                if is_naive(parsed_from):
                    parsed_from = make_aware(parsed_from)
                queryset = queryset.filter(travel_datetime__gte=parsed_from)

        # To datetime filter
        to_dt_param = query_params.get('to_datetime')
        if to_dt_param:
            parsed_to = parse_datetime(to_dt_param)
            if parsed_to:
                if is_naive(parsed_to):
                    parsed_to = make_aware(parsed_to)
                queryset = queryset.filter(travel_datetime__lte=parsed_to)

        # Exclude authenticated user's own requests from public exploration list
        if self.request.user and self.request.user.is_authenticated:
            queryset = queryset.exclude(user=self.request.user)

            # Support matching_only=true query param to show only rides matching user's open trips
            if query_params.get('matching_only') == 'true':
                my_open_reqs = self.request.user.travel_requests.filter(status='OPEN', travel_datetime__gte=now)
                if not my_open_reqs.exists():
                    return queryset.none()
                match_query = Q()
                for my_req in my_open_reqs:
                    start_win = my_req.travel_datetime - timedelta(hours=2)
                    end_win = my_req.travel_datetime + timedelta(hours=2)
                    match_query |= Q(
                        destination=my_req.destination,
                        direction=my_req.direction,
                        travel_datetime__range=(start_win, end_win)
                    )
                queryset = queryset.filter(match_query)

        return queryset

    def perform_create(self, serializer):
        travel_request = serializer.save(user=self.request.user)
        try:
            req_id = getattr(self.request, 'request_id', None)
            dispatch_match_notifications_task.delay(travel_request.id, request_id=req_id)
        except Exception:
            notify_matches_for_request(travel_request)

        DashboardCacheService.invalidate_user_dashboard(self.request.user.id)
        DashboardCacheService.invalidate_admin_stats()


class MyTravelRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MyTravelRequestSerializer
    pagination_class = None

    def get_queryset(self):
        now = timezone.now()
        # Sort by nearest upcoming first (future trips come first sorted ascending, then past trips)
        return TravelRequest.objects.filter(user=self.request.user, is_deleted=False).select_related('destination').annotate(
            is_past=Case(
                When(travel_datetime__lt=now, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_past', 'travel_datetime')


class TravelRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TravelRequestSerializer
    queryset = TravelRequest.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        if serializer.instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be edited.")
        travel_request = serializer.save()
        notify_matches_for_request(travel_request)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'CANCELLED'
        instance.save(update_fields=['status'])
        record_cancelled_ride(instance)
        close_chat_room(instance, reason='CANCELLED')
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TravelRequestCancelView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TravelRequestSerializer

    def post(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                instance = TravelRequest.objects.select_for_update().select_related('destination', 'user').get(pk=kwargs['pk'])
                self.check_object_permissions(request, instance)
                if instance.status != 'OPEN':
                    raise ValidationError("Only open travel requests can be cancelled.")
                instance.status = 'CANCELLED'
                instance.save(update_fields=['status', 'updated_at'])
                record_cancelled_ride(instance)
                close_chat_room(instance, reason='CANCELLED')
                serializer = self.get_serializer(instance)
                return Response(serializer.data, status=status.HTTP_200_OK)
        except TravelRequest.DoesNotExist:
            return Response({"detail": "Travel request not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as ve:
            raise ve
        except (IntegrityError, DatabaseError) as db_err:
            logger.error("Database error during cancellation for TravelRequest #%s: %s", kwargs.get('pk'), db_err)
            return Response({"detail": "Database error during cancellation."}, status=status.HTTP_400_BAD_REQUEST)


class TravelRequestMatchesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TravelRequestMatchSerializer
    pagination_class = None

    def get_queryset(self):
        travel_request = get_object_or_404(TravelRequest, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, travel_request)

        # Use the centralized service to find candidates
        candidates = find_matching_candidates(travel_request)

        candidates_list = list(candidates)
        for cand in candidates_list:
            diff_seconds = abs((cand.travel_datetime - travel_request.travel_datetime).total_seconds())
            cand.time_difference = int(round(diff_seconds / 60.0))

        candidates_list.sort(key=lambda x: (x.time_difference, x.travel_datetime, x.id))
        return candidates_list


class TravelRequestShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        travel_request = get_object_or_404(TravelRequest, pk=pk)
        if travel_request.user == request.user:
            raise ValidationError("You cannot request a ride share on your own travel request.")
        if travel_request.status != 'OPEN':
            raise ValidationError("You can only request a ride share on open travel requests.")

        from apps.notifications.services import notify_ride_share_request_received
        notify_ride_share_request_received(
            receiver=travel_request.user,
            sender=request.user,
            related_object_id=travel_request.id
        )
        return Response({"message": "Ride share request sent successfully!"}, status=status.HTTP_200_OK)


class TravelRequestRespondShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        sender_username = request.data.get('sender_username')
        action = request.data.get('action')
        if not sender_username or action not in ['ACCEPT', 'DECLINE']:
            raise ValidationError("Valid sender_username and action ('ACCEPT' or 'DECLINE') are required.")

        sender_user = get_object_or_404(User, username=sender_username)

        from apps.notifications.services import notify_ride_share_request_accepted, notify_ride_share_request_declined
        from apps.ride_history.services import record_completed_ride
        from apps.chat.services import get_or_create_chat_room

        try:
            with transaction.atomic():
                # Acquire row-level lock on the TravelRequest object being accepted/declined
                travel_request = TravelRequest.objects.select_for_update().select_related('destination', 'user').get(pk=pk)

                if travel_request.user != request.user:
                    raise ValidationError("Only the owner of the travel request can respond to ride share requests.")

                if action == 'ACCEPT':
                    # Re-verify latest state after lock acquisition to prevent duplicate ride acceptance
                    if travel_request.status != 'OPEN':
                        return Response(
                            {"detail": "This travel request is no longer open for ride acceptance."},
                            status=status.HTTP_409_CONFLICT
                        )

                    # Decrement available seats and update status to CLOSED if no seats left
                    travel_request.seats_available -= 1
                    update_fields = ['seats_available', 'updated_at']
                    if travel_request.seats_available <= 0:
                        travel_request.status = 'CLOSED'
                        update_fields.append('status')
                    travel_request.save(update_fields=update_fields)

                    notify_ride_share_request_accepted(
                        sender=sender_user,
                        acceptor=request.user,
                        related_object_id=travel_request.id
                    )
                    # Record completed ride history entries for both driver/owner and acceptor
                    record_completed_ride(
                        travel_request=travel_request,
                        partner_user=sender_user,
                        ride_request_id=travel_request.id
                    )
                    # Automatically establish ChatRoom for real-time coordination
                    get_or_create_chat_room(
                        travel_request=travel_request,
                        partner_user=sender_user
                    )
                    msg = f"Accepted ride share request from @{sender_username}."
                else:
                    notify_ride_share_request_declined(
                        sender=sender_user,
                        decliner=request.user,
                        related_object_id=travel_request.id
                    )
                    msg = f"Declined ride share request from @{sender_username}."

            return Response({"message": msg}, status=status.HTTP_200_OK)

        except TravelRequest.DoesNotExist:
            return Response({"detail": "Travel request not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as ve:
            raise ve
        except (IntegrityError, DatabaseError) as db_err:
            logger.error("Database error during ride response for TravelRequest #%s: %s", pk, db_err)
            return Response(
                {"detail": "A database error occurred during ride acceptance. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )
