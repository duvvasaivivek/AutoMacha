from datetime import timedelta

from django.contrib.auth import get_user_model
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

from apps.common.permissions import IsOwner
from .models import TravelRequest
from .serializers import (
    TravelRequestSerializer,
    TravelRequestListSerializer,
    TravelRequestMatchSerializer,
    MyTravelRequestSerializer,
)
from .services import find_matching_candidates, notify_matches_for_request, expire_outdated_requests

User = get_user_model()


class TravelRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TravelRequestSerializer
        return TravelRequestListSerializer

    def get_queryset(self):
        expire_outdated_requests()

        queryset = TravelRequest.objects.select_related('destination', 'user').order_by('travel_datetime')

        # Status filter (default to OPEN if not specified, unless ALL is specified)
        status_param = self.request.query_params.get('status')
        if status_param and status_param in ['OPEN', 'CLOSED', 'CANCELLED', 'EXPIRED']:
            queryset = queryset.filter(status=status_param)
        elif status_param != 'ALL':
            queryset = queryset.filter(status='OPEN')

        # Destination filter
        destination_param = self.request.query_params.get('destination')
        if destination_param:
            queryset = queryset.filter(destination_id=destination_param)

        # Direction filter
        direction_param = self.request.query_params.get('direction')
        if direction_param in ['TO_CAMPUS', 'FROM_CAMPUS']:
            queryset = queryset.filter(direction=direction_param)

        # Date filter (YYYY-MM-DD)
        date_param = self.request.query_params.get('date')
        if date_param:
            parsed_date = parse_date(date_param)
            if parsed_date:
                queryset = queryset.filter(travel_datetime__date=parsed_date)

        # From datetime filter
        from_dt_param = self.request.query_params.get('from_datetime')
        if from_dt_param:
            parsed_from = parse_datetime(from_dt_param)
            if parsed_from:
                if is_naive(parsed_from):
                    parsed_from = make_aware(parsed_from)
                queryset = queryset.filter(travel_datetime__gte=parsed_from)

        # To datetime filter
        to_dt_param = self.request.query_params.get('to_datetime')
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
            if self.request.query_params.get('matching_only') == 'true':
                my_open_reqs = self.request.user.travel_requests.filter(status='OPEN')
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
        notify_matches_for_request(travel_request)


class MyTravelRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MyTravelRequestSerializer
    pagination_class = None

    def get_queryset(self):
        expire_outdated_requests()
        now = timezone.now()
        # Sort by nearest upcoming first (future trips come first sorted ascending, then past trips)
        return TravelRequest.objects.filter(user=self.request.user).select_related('destination').annotate(
            is_past=Case(
                When(travel_datetime__lt=now, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_past', 'travel_datetime')


class TravelRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TravelRequestSerializer

    def get_queryset(self):
        return TravelRequest.objects.select_related('destination', 'user')

    def perform_update(self, serializer):
        if serializer.instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be edited.")
        travel_request = serializer.save()
        notify_matches_for_request(travel_request)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be cancelled.")
        instance.status = 'CANCELLED'
        instance.save(update_fields=['status'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TravelRequestCancelView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = TravelRequestSerializer

    def post(self, request, *args, **kwargs):
        instance = get_object_or_404(TravelRequest.objects.select_related('destination', 'user'), pk=kwargs['pk'])
        self.check_object_permissions(request, instance)
        if instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be cancelled.")
        instance.status = 'CANCELLED'
        instance.save(update_fields=['status'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        travel_request = get_object_or_404(TravelRequest, pk=pk)
        if travel_request.user != request.user:
            raise ValidationError("Only the owner of the travel request can respond to ride share requests.")

        sender_username = request.data.get('sender_username')
        action = request.data.get('action')
        if not sender_username or action not in ['ACCEPT', 'DECLINE']:
            raise ValidationError("Valid sender_username and action ('ACCEPT' or 'DECLINE') are required.")

        sender_user = get_object_or_404(User, username=sender_username)

        from apps.notifications.services import notify_ride_share_request_accepted, notify_ride_share_request_declined
        if action == 'ACCEPT':
            notify_ride_share_request_accepted(
                sender=sender_user,
                acceptor=request.user,
                related_object_id=travel_request.id
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
