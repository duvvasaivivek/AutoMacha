from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest
from .models import RideHistory
from .services import (
    record_completed_ride,
    record_cancelled_ride,
    record_expired_ride,
)

User = get_user_model()


class RideHistoryModelAndServiceTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='student1',
            email='student1@iiitk.ac.in',
            institute_email='student1@iiitk.ac.in',
            password='Password123!',
            roll_number='124AD0001'
        )
        self.user2 = User.objects.create_user(
            username='student2',
            email='student2@iiitk.ac.in',
            institute_email='student2@iiitk.ac.in',
            password='Password123!',
            roll_number='124AD0002'
        )
        self.destination, _ = Destination.objects.get_or_create(
            name='Kurnool Railway Station',
            defaults={'description': 'Main railway station'}
        )
        self.travel_request = TravelRequest.objects.create(
            user=self.user1,
            destination=self.destination,
            direction='FROM_CAMPUS',
            travel_datetime=timezone.now() + timedelta(hours=2),
            status='OPEN'
        )

    def test_record_completed_ride(self):
        history_user, history_partner = record_completed_ride(
            travel_request=self.travel_request,
            partner_user=self.user2,
            ride_request_id=101
        )
        self.assertIsNotNone(history_user)
        self.assertIsNotNone(history_partner)
        self.assertEqual(history_user.user, self.user1)
        self.assertEqual(history_user.ride_partner, self.user2)
        self.assertEqual(history_user.ride_status, 'COMPLETED')
        self.assertEqual(history_partner.user, self.user2)
        self.assertEqual(history_partner.ride_partner, self.user1)
        self.assertEqual(history_partner.ride_status, 'COMPLETED')

    def test_record_cancelled_ride(self):
        history_user, _ = record_cancelled_ride(self.travel_request)
        self.assertEqual(history_user.user, self.user1)
        self.assertEqual(history_user.ride_status, 'CANCELLED')

    def test_record_expired_ride(self):
        history = record_expired_ride(self.travel_request)
        self.assertEqual(history.user, self.user1)
        self.assertEqual(history.ride_status, 'EXPIRED')

    def test_duplicate_prevention(self):
        record_expired_ride(self.travel_request)
        # Call second time
        record_expired_ride(self.travel_request)
        # Count should remain 1 due to unique constraint / get_or_create
        self.assertEqual(RideHistory.objects.filter(user=self.user1, travel_request=self.travel_request, ride_status='EXPIRED').count(), 1)


class RideHistoryAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@iiitk.ac.in',
            institute_email='user1@iiitk.ac.in',
            password='Password123!',
            roll_number='124CS0001'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@iiitk.ac.in',
            institute_email='user2@iiitk.ac.in',
            password='Password123!',
            roll_number='124CS0002'
        )
        self.dest = Destination.objects.create(name='Kurnool Bus Stand')

        self.req1 = TravelRequest.objects.create(
            user=self.user1,
            destination=self.dest,
            direction='TO_CAMPUS',
            travel_datetime=timezone.now(),
            status='OPEN'
        )
        record_completed_ride(self.req1, partner_user=self.user2)

    def test_user_can_only_access_own_history(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/ride-history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['destination'], 'Kurnool Bus Stand')

        # Log in as user2
        self.client.force_authenticate(user=self.user2)
        response2 = self.client.get('/api/ride-history/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        results2 = response2.data.get('results', response2.data)
        self.assertEqual(len(results2), 1)
        self.assertEqual(results2[0]['ride_partner']['username'], 'user1')

    def test_disallow_manual_mutation(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/ride-history/', {'destination': 'Fake'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
