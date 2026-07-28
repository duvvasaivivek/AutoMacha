from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AutoDriver

User = get_user_model()


class AutoDriverAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="driverstudent",
            password="testpassword123",
            institute_email="driverstudent@iiitk.ac.in",
            roll_number="124AD0666"
        )
        self.other_user = User.objects.create_user(
            username="otherstudent",
            password="testpassword123",
            institute_email="otherstudent@iiitk.ac.in",
            roll_number="124AD0667"
        )

        # Create 1 verified active driver, 1 unverified driver, 1 inactive driver
        self.driver1 = AutoDriver.objects.create(
            full_name="Ramesh Kumar",
            phone_number="9876543210",
            vehicle_number="AP 39 AB 1234",
            notes="Campus main gate auto stand",
            is_verified=True,
            is_active=True
        )
        self.driver2 = AutoDriver.objects.create(
            full_name="Suresh Verma",
            phone_number="9876543211",
            vehicle_number="AP 39 CD 5678",
            is_verified=False,
            is_active=True,
            created_by=self.user
        )
        self.driver3 = AutoDriver.objects.create(
            full_name="Inactive Driver",
            phone_number="9876543212",
            is_verified=True,
            is_active=False
        )

        self.list_url = reverse('auto_drivers:list')
        self.suggest_url = reverse('auto_drivers:suggest')
        self.my_suggestions_url = reverse('auto_drivers:my-suggestions')

    def test_get_verified_auto_drivers_only(self):
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        driver_ids = [d['id'] for d in res.data]
        self.assertIn(self.driver1.id, driver_ids)
        self.assertNotIn(self.driver2.id, driver_ids)
        self.assertNotIn(self.driver3.id, driver_ids)

    def test_search_auto_drivers(self):
        res = self.client.get(self.list_url, {'search': 'Ramesh'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], self.driver1.id)

        res_phone = self.client.get(self.list_url, {'search': '9876543210'})
        self.assertEqual(res_phone.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_phone.data), 1)

    def test_suggest_auto_driver_success(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "full_name": "Mahesh Naidu",
            "phone_number": "9123456789",
            "vehicle_number": "AP 39 EF 9999",
            "notes": "Available night trips"
        }
        res = self.client.post(self.suggest_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['message'], "Your driver suggestion has been submitted for review.")

        new_driver = AutoDriver.objects.get(phone_number="9123456789")
        self.assertEqual(new_driver.full_name, "Mahesh Naidu")
        self.assertFalse(new_driver.is_verified)
        self.assertEqual(new_driver.created_by, self.user)

    def test_suggest_duplicate_phone_validation(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "full_name": "Duplicate Driver",
            "phone_number": "9876543210"  # Exists on driver1
        }
        res = self.client.post(self.suggest_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', res.data)

    def test_suggest_invalid_10_digit_phone(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "full_name": "Invalid Phone Driver",
            "phone_number": "12345"
        }
        res = self.client.post(self.suggest_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', res.data)

    def test_my_suggestions_view(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(self.my_suggestions_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], self.driver2.id)
