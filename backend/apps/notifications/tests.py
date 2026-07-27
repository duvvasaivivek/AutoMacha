from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Notification
from .services import (
    notify_ride_share_request_received,
    notify_ride_share_request_accepted,
    notify_ride_share_request_declined,
    notify_travel_request_expired,
    notify_new_match_found,
)

User = get_user_model()


class NotificationTests(APITestCase):
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
        self.client.force_authenticate(user=self.user1)

    def test_service_functions_and_duplicate_prevention(self):
        # Test ride share request received
        n1, c1 = notify_ride_share_request_received(self.user1, "student2", related_object_id=100)
        self.assertTrue(c1)
        self.assertEqual(n1.title, "New Ride Share Request")
        self.assertEqual(n1.message, "student2 wants to share a ride with you.")
        self.assertEqual(n1.notification_type, Notification.NotificationTypeChoices.RIDE_SHARE_REQUEST_RECEIVED)

        # Test duplicate prevention
        n1_dup, c1_dup = notify_ride_share_request_received(self.user1, "student2", related_object_id=100)
        self.assertFalse(c1_dup)
        self.assertEqual(n1.id, n1_dup.id)

        # Test accepted
        n2, c2 = notify_ride_share_request_accepted(self.user1, "student2", related_object_id=101)
        self.assertTrue(c2)
        self.assertEqual(n2.title, "Ride Request Accepted")

        # Test declined
        n3, c3 = notify_ride_share_request_declined(self.user1, "student2", related_object_id=102)
        self.assertTrue(c3)
        self.assertEqual(n3.title, "Ride Request Declined")

        # Test travel request expired
        n4, c4 = notify_travel_request_expired(self.user1, related_object_id=103)
        self.assertTrue(c4)
        self.assertEqual(n4.title, "Travel Request Expired")

        # Test new match found
        n5, c5 = notify_new_match_found(self.user1, related_object_id=104)
        self.assertTrue(c5)
        self.assertEqual(n5.title, "New Ride Match Found")

        self.assertEqual(Notification.objects.filter(user=self.user1).count(), 5)
        self.assertEqual(Notification.objects.filter(user=self.user2).count(), 0)

    def test_notification_endpoints(self):
        notify_ride_share_request_received(self.user1, "student2", related_object_id=1)
        notify_new_match_found(self.user1, related_object_id=2)

        # 1. GET list
        url_list = reverse('notifications:notification-list')
        res_list = self.client.get(url_list)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 2)
        self.assertIn('title', res_list.data[0])
        self.assertNotIn('user', res_list.data[0])
        self.assertIn('related_object_id', res_list.data[0])

        # 2. GET unread count
        url_unread = reverse('notifications:notification-unread-count')
        res_unread = self.client.get(url_unread)
        self.assertEqual(res_unread.status_code, status.HTTP_200_OK)
        self.assertEqual(res_unread.data['count'], 2)

        # 3. PATCH mark one read
        notif_id = res_list.data[0]['id']
        url_mark_one = reverse('notifications:notification-mark-read', kwargs={'pk': notif_id})
        res_mark_one = self.client.patch(url_mark_one)
        self.assertEqual(res_mark_one.status_code, status.HTTP_200_OK)
        self.assertTrue(res_mark_one.data['is_read'])

        res_unread2 = self.client.get(url_unread)
        self.assertEqual(res_unread2.data['count'], 1)

        # 4. PATCH mark all read
        url_mark_all = reverse('notifications:notification-read-all')
        res_mark_all = self.client.patch(url_mark_all)
        self.assertEqual(res_mark_all.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mark_all.data['status'], 'success')

        res_unread3 = self.client.get(url_unread)
        self.assertEqual(res_unread3.data['count'], 0)
