from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest
from .models import ChatMessage
from .services import (
    get_or_create_chat_room,
    close_chat_room,
)

User = get_user_model()


class ChatModelAndServiceTestCase(TestCase):
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
        self.user3 = User.objects.create_user(
            username='student3',
            email='student3@iiitk.ac.in',
            institute_email='student3@iiitk.ac.in',
            password='Password123!',
            roll_number='124AD0003'
        )
        self.destination = Destination.objects.create(name='Railway Station')
        self.travel_request = TravelRequest.objects.create(
            user=self.user1,
            destination=self.destination,
            direction='FROM_CAMPUS',
            travel_datetime=timezone.now() + timedelta(hours=2),
            status='OPEN'
        )

    def test_get_or_create_chat_room(self):
        room = get_or_create_chat_room(self.travel_request, partner_user=self.user2)
        self.assertIsNotNone(room)
        self.assertEqual(room.created_by, self.user1)
        self.assertEqual(room.partner, self.user2)
        self.assertTrue(room.is_active)
        self.assertTrue(room.is_participant(self.user1))
        self.assertTrue(room.is_participant(self.user2))
        self.assertFalse(room.is_participant(self.user3))

        # Check initial system message was posted
        self.assertEqual(room.messages.count(), 1)
        system_msg = room.messages.first()
        self.assertEqual(system_msg.message_type, ChatMessage.MessageTypeChoices.SYSTEM)

    def test_close_chat_room(self):
        room = get_or_create_chat_room(self.travel_request, partner_user=self.user2)
        self.assertTrue(room.is_active)

        close_chat_room(self.travel_request, reason='CANCELLED')
        room.refresh_from_db()
        self.assertFalse(room.is_active)
        self.assertIsNotNone(room.closed_at)

        # Check system cancellation announcement was posted
        self.assertEqual(room.messages.count(), 2)
        last_msg = room.messages.last()
        self.assertIn("Ride Cancelled", last_msg.message)


class ChatAPITestCase(TestCase):
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
        self.unauthorized_user = User.objects.create_user(
            username='user3',
            email='user3@iiitk.ac.in',
            institute_email='user3@iiitk.ac.in',
            password='Password123!',
            roll_number='124CS0003'
        )
        self.dest = Destination.objects.create(name='Kurnool Bus Stand')

        self.req = TravelRequest.objects.create(
            user=self.user1,
            destination=self.dest,
            direction='TO_CAMPUS',
            travel_datetime=timezone.now(),
            status='OPEN'
        )
        self.room = get_or_create_chat_room(self.req, partner_user=self.user2)

        # Post a text message from user2
        ChatMessage.objects.create(
            chat_room=self.room,
            sender=self.user2,
            message="Hey! What time should we meet at the auto stand?",
            message_type=ChatMessage.MessageTypeChoices.TEXT,
            is_read=False,
        )

    def test_authorized_participant_can_get_room_and_messages(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/chat/room/{self.req.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['destination_name'], 'Kurnool Bus Stand')

        msg_response = self.client.get(f'/api/chat/room/{self.req.id}/messages/')
        self.assertEqual(msg_response.status_code, status.HTTP_200_OK)
        results = msg_response.data.get('results', msg_response.data)
        self.assertGreaterEqual(len(results), 2)

    def test_unauthorized_user_cannot_access_chat(self):
        self.client.force_authenticate(user=self.unauthorized_user)
        response = self.client.get(f'/api/chat/room/{self.req.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        msg_response = self.client.get(f'/api/chat/room/{self.req.id}/messages/')
        self.assertEqual(msg_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unread_count_and_mark_read(self):
        self.client.force_authenticate(user=self.user1)
        unread_res = self.client.get('/api/chat/unread-count/')
        self.assertEqual(unread_res.status_code, status.HTTP_200_OK)
        self.assertEqual(unread_res.data['unread_count'], 1)

        mark_res = self.client.post(f'/api/chat/room/{self.req.id}/mark-read/')
        self.assertEqual(mark_res.status_code, status.HTTP_200_OK)

        unread_res2 = self.client.get('/api/chat/unread-count/')
        self.assertEqual(unread_res2.data['unread_count'], 0)
