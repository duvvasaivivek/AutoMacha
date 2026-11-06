from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Destination, SavedDestination

User = get_user_model()


class DestinationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student_dest",
            password="testpassword123",
            institute_email="student_dest@iiitk.ac.in",
            roll_number="124CS0111",
        )
        self.other_user = User.objects.create_user(
            username="other_dest",
            password="testpassword123",
            institute_email="other_dest@iiitk.ac.in",
            roll_number="124CS0222",
        )

        self.dest_active_1 = Destination.objects.create(
            name="Kurnool Railway Station",
            description="Main railway junction",
            is_active=True,
        )
        self.dest_active_2 = Destination.objects.create(
            name="RTC Bus Stand",
            description="Central bus terminal",
            is_active=True,
        )
        self.dest_inactive = Destination.objects.create(
            name="Old Closed Market",
            description="Inactive route",
            is_active=False,
        )

        self.list_url = reverse('destinations:destination-list')
        self.saved_list_url = reverse('destinations:saved-destination-list-create')

    def test_destination_str_representation(self):
        self.assertEqual(str(self.dest_active_1), "Kurnool Railway Station")

        saved = SavedDestination.objects.create(
            user=self.user,
            destination=self.dest_active_1,
            label="Daily Commute",
        )
        self.assertIn("student_dest", str(saved))
        self.assertIn("Kurnool Railway Station", str(saved))

    def test_public_destination_list(self):
        """Public endpoint should return only active destinations."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data]
        self.assertIn("Kurnool Railway Station", names)
        self.assertIn("RTC Bus Stand", names)
        self.assertNotIn("Old Closed Market", names)

    def test_saved_destination_requires_auth(self):
        """Unauthenticated user cannot access saved destinations."""
        response = self.client.get(self.saved_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        post_res = self.client.post(self.saved_list_url, {"destination": self.dest_active_1.id})
        self.assertEqual(post_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_list_saved_destination(self):
        """Authenticated user can bookmark and view saved destinations."""
        self.client.force_authenticate(user=self.user)

        # Create bookmark
        response = self.client.post(
            self.saved_list_url,
            {"destination": self.dest_active_1.id, "label": "Railway"},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['label'], "Railway")
        self.assertEqual(response.data['destination_details']['name'], "Kurnool Railway Station")

        # List bookmarks
        list_res = self.client.get(self.saved_list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

    def test_delete_saved_destination_isolation(self):
        """User can delete their own bookmark, but other users cannot."""
        saved = SavedDestination.objects.create(
            user=self.user,
            destination=self.dest_active_1,
            label="Station",
        )
        delete_url = reverse('destinations:saved-destination-delete', kwargs={'pk': saved.pk})

        # Other user cannot delete it (returns 404 because not in their queryset)
        self.client.force_authenticate(user=self.other_user)
        res_other = self.client.delete(delete_url)
        self.assertEqual(res_other.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(SavedDestination.objects.filter(pk=saved.pk).exists())

        # Owner can delete it
        self.client.force_authenticate(user=self.user)
        res_owner = self.client.delete(delete_url)
        self.assertEqual(res_owner.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavedDestination.objects.filter(pk=saved.pk).exists())

