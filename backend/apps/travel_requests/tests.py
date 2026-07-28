from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.destinations.models import Destination
from .models import TravelRequest

User = get_user_model()


class TravelRequestTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="student1",
            password="testpassword123",
            institute_email="student1@iiitk.ac.in",
            roll_number="124AD0001"
        )
        self.user2 = User.objects.create_user(
            username="student2",
            password="testpassword123",
            institute_email="student2@iiitk.ac.in",
            roll_number="124AD0002"
        )
        self.destination = Destination.objects.create(name="Railway Station")
        self.client.force_authenticate(user=self.user1)

    def test_create_travel_request(self):
        travel_time = timezone.now() + timedelta(days=1)
        data = {
            "destination": self.destination.id,
            "direction": "FROM_CAMPUS",
            "travel_datetime": travel_time.isoformat(),
        }
        res = self.client.post("/api/travel-requests/", data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TravelRequest.objects.count(), 1)
        req = TravelRequest.objects.first()
        self.assertEqual(req.user, self.user1)
        self.assertEqual(req.destination, self.destination)

    def test_list_travel_requests_excludes_own(self):
        travel_time = timezone.now() + timedelta(days=1)
        req1 = TravelRequest.objects.create(
            user=self.user1,
            destination=self.destination,
            direction="FROM_CAMPUS",
            travel_datetime=travel_time
        )
        req2 = TravelRequest.objects.create(
            user=self.user2,
            destination=self.destination,
            direction="FROM_CAMPUS",
            travel_datetime=travel_time
        )

        res = self.client.get("/api/travel-requests/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should only contain req2 created by user2, not req1 created by user1
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], req2.id)

    def test_cancel_travel_request(self):
        travel_time = timezone.now() + timedelta(days=1)
        req = TravelRequest.objects.create(
            user=self.user1,
            destination=self.destination,
            direction="FROM_CAMPUS",
            travel_datetime=travel_time
        )
        res = self.client.post(f"/api/travel-requests/{req.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, "CANCELLED")

    def test_permission_denied_for_other_user_request(self):
        travel_time = timezone.now() + timedelta(days=1)
        req2 = TravelRequest.objects.create(
            user=self.user2,
            destination=self.destination,
            direction="FROM_CAMPUS",
            travel_datetime=travel_time
        )
        res = self.client.post(f"/api/travel-requests/{req2.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
