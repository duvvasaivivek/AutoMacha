from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, override_settings
from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest
from apps.chat.models import ChatRoom
from apps.chat.consumers import ChatConsumer
from apps.chat.presence import PresenceService

User = get_user_model()


@override_settings(CHANNEL_LAYERS={
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
})
class WebSocketRealtimeTestCase(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        # Student 1 (Owner)
        self.student1 = User.objects.create_user(
            username='ws_student1',
            password='Password123!',
            institute_email='ws_student1@iiitk.ac.in',
            roll_number='CS2026010',
        )

        # Student 2 (Partner)
        self.student2 = User.objects.create_user(
            username='ws_student2',
            password='Password123!',
            institute_email='ws_student2@iiitk.ac.in',
            roll_number='CS2026011',
        )

        # Student 3 (Outsider)
        self.student3 = User.objects.create_user(
            username='ws_student3',
            password='Password123!',
            institute_email='ws_student3@iiitk.ac.in',
            roll_number='CS2026012',
        )

        self.destination = Destination.objects.create(name='Bus Stand', is_active=True)

        self.travel_request = TravelRequest.objects.create(
            user=self.student1,
            destination=self.destination,
            direction='TO_CAMPUS',
            travel_datetime='2026-12-01T10:00:00Z',
            status='MATCHED',
        )

        self.chat_room = ChatRoom.objects.create(
            ride_request=self.travel_request,
            created_by=self.student1,
            partner=self.student2,
            is_active=True,
        )

    async def test_websocket_connect_authenticated_participant(self):
        """Verify participant can connect successfully and presence is marked online."""
        application = ChatConsumer.as_asgi()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.travel_request.id}/"
        )
        communicator.scope['url_route'] = {'kwargs': {'ride_request_id': str(self.travel_request.id)}}
        communicator.scope['user'] = self.student1

        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        self.assertTrue(PresenceService.is_user_online(self.student1.id))

        await communicator.disconnect()

    async def test_websocket_connect_unauthorized_outsider_rejected(self):
        """Verify non-participant receives code 4003 and connection is rejected."""
        application = ChatConsumer.as_asgi()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.travel_request.id}/"
        )
        communicator.scope['url_route'] = {'kwargs': {'ride_request_id': str(self.travel_request.id)}}
        communicator.scope['user'] = self.student3

        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4003)

    async def test_websocket_ping_pong_heartbeat(self):
        """Verify ping frame receives pong response."""
        application = ChatConsumer.as_asgi()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.travel_request.id}/"
        )
        communicator.scope['url_route'] = {'kwargs': {'ride_request_id': str(self.travel_request.id)}}
        communicator.scope['user'] = self.student1

        await communicator.connect()

        await communicator.send_json_to({'type': 'ping'})
        response = await communicator.receive_json_from()

        self.assertEqual(response.get('type'), 'pong')
        self.assertIn('timestamp', response)

        await communicator.disconnect()

    async def test_websocket_typing_indicator_broadcast(self):
        """Verify typing event broadcasts to room participants."""
        application = ChatConsumer.as_asgi()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.travel_request.id}/"
        )
        communicator.scope['url_route'] = {'kwargs': {'ride_request_id': str(self.travel_request.id)}}
        communicator.scope['user'] = self.student1

        await communicator.connect()

        await communicator.send_json_to({'type': 'typing', 'is_typing': True})
        response = await communicator.receive_json_from()

        self.assertEqual(response.get('type'), 'typing_broadcast')
        self.assertEqual(response.get('sender'), 'ws_student1')
        self.assertTrue(response.get('is_typing'))

        await communicator.disconnect()
