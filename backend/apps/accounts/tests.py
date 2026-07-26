from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserRegistrationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.valid_payload = {
            'username': 'teststudent',
            'password': 'SecurePassword123!',
            'institute_email': 'student@institute.edu',
            'roll_number': 'CS2026001',
            'branch': 'Computer Science',
            'hostel': 'Hostel A',
            'gender': 'M',
        }

    def test_user_registration_success(self):
        """Test that a new user can register successfully with valid data."""
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'User registered successfully.')
        self.assertIn('user', response.data)
        
        user_data = response.data['user']
        self.assertEqual(user_data['username'], self.valid_payload['username'])
        self.assertEqual(user_data['roll_number'], self.valid_payload['roll_number'])
        self.assertEqual(user_data['institute_email'], self.valid_payload['institute_email'])
        self.assertIn('id', user_data)

        # Verify user is created in database
        user = User.objects.get(username=self.valid_payload['username'])
        self.assertEqual(user.roll_number, self.valid_payload['roll_number'])
        self.assertEqual(user.institute_email, self.valid_payload['institute_email'])

    def test_password_hashed_and_not_returned(self):
        """Test that password is stored as a hashed value and never returned in response."""
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify password is not in response
        self.assertNotIn('password', response.data)
        self.assertNotIn('password', response.data['user'])

        # Verify password is not exposed in any forbidden fields
        for forbidden_field in ['password', 'is_staff', 'is_superuser', 'groups', 'user_permissions']:
            self.assertNotIn(forbidden_field, response.data['user'])

        # Verify password in DB is hashed
        user = User.objects.get(username=self.valid_payload['username'])
        self.assertNotEqual(user.password, self.valid_payload['password'])
        self.assertTrue(user.check_password(self.valid_payload['password']))

    def test_duplicate_username_returns_400(self):
        """Test that registering with a duplicate username returns HTTP 400."""
        User.objects.create_user(
            username=self.valid_payload['username'],
            password='SomePassword123',
            institute_email='existing@institute.edu',
            roll_number='CS2026999',
        )
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_duplicate_institute_email_returns_400(self):
        """Test that registering with a duplicate institute_email returns HTTP 400."""
        User.objects.create_user(
            username='existinguser',
            password='SomePassword123',
            institute_email=self.valid_payload['institute_email'],
            roll_number='CS2026999',
        )
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('institute_email', response.data)

    def test_duplicate_roll_number_returns_400(self):
        """Test that registering with a duplicate roll_number returns HTTP 400."""
        User.objects.create_user(
            username='existinguser',
            password='SomePassword123',
            institute_email='existing@institute.edu',
            roll_number=self.valid_payload['roll_number'],
        )
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('roll_number', response.data)

    def test_invalid_email_returns_400(self):
        """Test that providing an invalid email returns HTTP 400."""
        payload = self.valid_payload.copy()
        payload['institute_email'] = 'not-an-email'
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('institute_email', response.data)

    def test_missing_required_fields_return_400(self):
        """Test that missing required fields return HTTP 400."""
        required_fields = ['username', 'password', 'institute_email', 'roll_number']
        for field in required_fields:
            payload = self.valid_payload.copy()
            payload.pop(field)
            response = self.client.post(self.register_url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected 400 when {field} is missing")
            self.assertIn(field, response.data)
