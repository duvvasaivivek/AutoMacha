from datetime import timedelta
from django.db.models import Case, When, Value, IntegerField
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import TravelRequest
from .serializers import (
    TravelRequestSerializer,
    TravelRequestListSerializer,
    TravelRequestMatchSerializer,
    MyTravelRequestSerializer,
)


class TravelRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TravelRequestSerializer
        return TravelRequestListSerializer

    def get_queryset(self):
        TravelRequest.expire_outdated()
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
            from django.utils.dateparse import parse_date
            parsed_date = parse_date(date_param)
            if parsed_date:
                queryset = queryset.filter(travel_datetime__date=parsed_date)

        # From datetime filter
        from_dt_param = self.request.query_params.get('from_datetime')
        if from_dt_param:
            from django.utils.dateparse import parse_datetime
            from django.utils.timezone import is_naive, make_aware
            from datetime import datetime
            parsed_from = parse_datetime(from_dt_param)
            if parsed_from and isinstance(parsed_from, datetime):
                if is_naive(parsed_from):
                    parsed_from = make_aware(parsed_from)
                queryset = queryset.filter(travel_datetime__gte=parsed_from)
            else:
                try:
                    queryset = queryset.filter(travel_datetime__gte=from_dt_param)
                except (ValueError, TypeError):
                    pass

        # To datetime filter
        to_dt_param = self.request.query_params.get('to_datetime')
        if to_dt_param:
            from django.utils.dateparse import parse_datetime
            from django.utils.timezone import is_naive, make_aware
            from datetime import datetime
            parsed_to = parse_datetime(to_dt_param)
            if parsed_to and isinstance(parsed_to, datetime):
                if is_naive(parsed_to):
                    parsed_to = make_aware(parsed_to)
                queryset = queryset.filter(travel_datetime__lte=parsed_to)
            else:
                try:
                    queryset = queryset.filter(travel_datetime__lte=to_dt_param)
                except (ValueError, TypeError):
                    pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyTravelRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MyTravelRequestSerializer

    def get_queryset(self):
        TravelRequest.expire_outdated()
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
    permission_classes = [IsAuthenticated]
    serializer_class = TravelRequestSerializer

    def get_queryset(self):
        TravelRequest.expire_outdated()
        return TravelRequest.objects.select_related('destination', 'user')

    def get_object(self):
        pk = self.kwargs.get('pk') or self.kwargs.get('id')
        obj = get_object_or_404(self.get_queryset(), pk=pk)
        if obj.user != self.request.user:
            raise PermissionDenied("You do not have permission to access or modify this travel request.")
        return obj

    def perform_update(self, serializer):
        if serializer.instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be edited.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be cancelled.")
        instance.status = 'CANCELLED'
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TravelRequestCancelView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TravelRequestSerializer

    def post(self, request, *args, **kwargs):
        TravelRequest.expire_outdated()
        pk = kwargs.get('pk') or kwargs.get('id')
        instance = get_object_or_404(TravelRequest.objects.select_related('destination', 'user'), pk=pk)
        if instance.user != request.user:
            raise PermissionDenied("You do not have permission to modify this travel request.")
        if instance.status != 'OPEN':
            raise ValidationError("Only open travel requests can be cancelled.")
        instance.status = 'CANCELLED'
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TravelRequestMatchesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TravelRequestMatchSerializer

    def get_queryset(self):
        TravelRequest.expire_outdated()
        pk = self.kwargs.get('pk') or self.kwargs.get('id')
        travel_request = get_object_or_404(TravelRequest, pk=pk)

        # Verify the authenticated user owns the request
        if travel_request.user != self.request.user:
            raise PermissionDenied("You do not have permission to view matches for this travel request.")

        # Calculate time window: ±30 minutes
        time_window_start = travel_request.travel_datetime - timedelta(minutes=30)
        time_window_end = travel_request.travel_datetime + timedelta(minutes=30)

        # Return only OPEN travel requests with same destination, direction, different user, within time window
        candidates = TravelRequest.objects.filter(
            status='OPEN',
            destination=travel_request.destination,
            direction=travel_request.direction,
            travel_datetime__gte=time_window_start,
            travel_datetime__lte=time_window_end,
        ).exclude(
            user=self.request.user
        ).select_related('destination', 'user')

        # Calculate time difference and sort by smallest time difference
        candidates_list = list(candidates)
        for cand in candidates_list:
            diff_seconds = abs((cand.travel_datetime - travel_request.travel_datetime).total_seconds())
            cand.time_difference = int(round(diff_seconds / 60.0))

        candidates_list.sort(key=lambda x: (x.time_difference, x.travel_datetime, x.id))
        return candidates_list
