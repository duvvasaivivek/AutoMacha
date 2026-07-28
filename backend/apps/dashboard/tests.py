from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest

User = get_user_model()


class DashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dashstudent",
            password="testpassword123",
            institute_email="dashstudent@iiitk.ac.in",
            roll_number="124AD0099"
        )
        self.destination = Destination.objects.create(name="Airport")
        self.client.force_authenticate(user=self.user)

    def test_dashboard_stats(self):
        travel_time = timezone.now() + timedelta(days=2)
        TravelRequest.objects.create(
            user=self.user,
            destination=self.destination,
            direction="TO_CAMPUS",
            travel_datetime=travel_time,
            status="OPEN"
        )

        res = self.client.get("/api/dashboard/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['active_requests'], 1)
        self.assertEqual(res.data['total_requests'], 1)
        self.assertIsNotNone(res.data['next_trip'])
        self.assertEqual(res.data['next_trip']['destination'], "Airport")
