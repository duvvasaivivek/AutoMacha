from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.destinations.models import Destination
from apps.chat.models import ChatRoom
from apps.notifications.models import Notification
from apps.ride_history.models import RideHistory
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


class TravelRequestConcurrencyTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_student",
            password="testpassword123",
            institute_email="owner@iiitk.ac.in",
            roll_number="124AD0010"
        )
        self.partner = User.objects.create_user(
            username="partner_student",
            password="testpassword123",
            institute_email="partner@iiitk.ac.in",
            roll_number="124AD0020"
        )
        self.destination = Destination.objects.create(name="Bus Stand")
        self.travel_request = TravelRequest.objects.create(
            user=self.owner,
            destination=self.destination,
            direction="FROM_CAMPUS",
            travel_datetime=timezone.now() + timedelta(hours=3),
            status="OPEN"
        )

    def test_double_click_acceptance_idempotency(self):
        """Simulates rapid double-click on Accept button."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "sender_username": self.partner.username,
            "action": "ACCEPT"
        }

        # First acceptance attempt
        res1 = self.client.post(f"/api/travel-requests/{self.travel_request.id}/respond-share/", payload)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertIn("Accepted ride share request", res1.data['message'])

        # Verify request status changed to CLOSED
        self.travel_request.refresh_from_db()
        self.assertEqual(self.travel_request.status, "CLOSED")

        # Second rapid acceptance attempt (Double Click)
        res2 = self.client.post(f"/api/travel-requests/{self.travel_request.id}/respond-share/", payload)
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("no longer open", res2.data['detail'])

        # Verify exact single ChatRoom created
        self.assertEqual(ChatRoom.objects.filter(ride_request=self.travel_request).count(), 1)
        # Verify exact single RideHistory for owner & partner
        self.assertEqual(RideHistory.objects.filter(travel_request=self.travel_request).count(), 2)

    def test_duplicate_chat_room_prevention(self):
        """Verifies get_or_create_chat_room guarantees uniqueness."""
        from apps.chat.services import get_or_create_chat_room
        room1 = get_or_create_chat_room(self.travel_request, self.partner)
        room2 = get_or_create_chat_room(self.travel_request, self.partner)

        self.assertIsNotNone(room1)
        self.assertEqual(room1.id, room2.id)
        self.assertEqual(ChatRoom.objects.filter(ride_request=self.travel_request).count(), 1)

    def test_duplicate_notification_prevention(self):
        """Verifies duplicate notifications cannot be generated."""
        from apps.notifications.services import notify_ride_share_request_accepted
        notif1, created1 = notify_ride_share_request_accepted(
            sender=self.partner,
            acceptor=self.owner,
            related_object_id=self.travel_request.id
        )
        notif2, created2 = notify_ride_share_request_accepted(
            sender=self.partner,
            acceptor=self.owner,
            related_object_id=self.travel_request.id
        )

        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(notif1.id, notif2.id)
        self.assertEqual(Notification.objects.filter(related_object_id=self.travel_request.id).count(), 1)

    def test_transaction_rollback_on_failure(self):
        """Verifies that an error inside acceptance rolls back the status change and partial writes."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "sender_username": self.partner.username,
            "action": "ACCEPT"
        }

        # Mock get_or_create_chat_room to raise DatabaseError
        with patch('apps.chat.services.get_or_create_chat_room', side_effect=DatabaseError("Simulated DB Crash")):
            res = self.client.post(f"/api/travel-requests/{self.travel_request.id}/respond-share/", payload)
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("A database error occurred", res.data['detail'])

        # Verify atomic rollback: travel_request status remains OPEN
        self.travel_request.refresh_from_db()
        self.assertEqual(self.travel_request.status, "OPEN")
        self.assertEqual(ChatRoom.objects.filter(ride_request=self.travel_request).count(), 0)

    def test_api_response_format_remains_unchanged(self):
        """Verifies successful acceptance API output format."""
        self.client.force_authenticate(user=self.owner)
        payload = {
            "sender_username": self.partner.username,
            "action": "ACCEPT"
        }
        res = self.client.post(f"/api/travel-requests/{self.travel_request.id}/respond-share/", payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, {"message": f"Accepted ride share request from @{self.partner.username}."})
