from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.authentication import JWTAuthentication

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


class JWTAuthenticationAPITests(APITestCase):
    def setUp(self):
        self.token_url = reverse('accounts:token_obtain_pair')
        self.refresh_url = reverse('accounts:token_refresh')
        self.username = 'jwtstudent'
        self.password = 'SecurePassword123!'
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            institute_email='jwt@institute.edu',
            roll_number='CS2026777',
        )

    def test_obtain_token_pair_success(self):
        """Test that a registered user can obtain an access token and refresh token."""
        payload = {
            'username': self.username,
            'password': self.password,
        }
        response = self.client.post(self.token_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_token_generates_new_access_token(self):
        """Test that refresh tokens generate new access tokens."""
        # Obtain tokens first
        payload = {
            'username': self.username,
            'password': self.password,
        }
        obtain_response = self.client.post(self.token_url, payload, format='json')
        self.assertEqual(obtain_response.status_code, status.HTTP_200_OK)
        refresh_token = obtain_response.data['refresh']

        # Use refresh token to get a new access token
        refresh_payload = {
            'refresh': refresh_token,
        }
        refresh_response = self.client.post(self.refresh_url, refresh_payload, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_invalid_credentials_return_401(self):
        """Test that invalid credentials return HTTP 401."""
        payload = {
            'username': self.username,
            'password': 'WrongPassword999!',
        }
        response = self.client.post(self.token_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_refresh_token_returns_401(self):
        """Test that invalid refresh tokens return HTTP 401."""
        payload = {
            'refresh': 'invalid.token.string',
        }
        response = self.client.post(self.refresh_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_default_authentication_class_is_jwt(self):
        """Verify that DRF uses JWTAuthentication as the default authentication class."""
        self.assertIn(JWTAuthentication, api_settings.DEFAULT_AUTHENTICATION_CLASSES)


class CurrentUserAPITests(APITestCase):
    def setUp(self):
        self.me_url = reverse('accounts:me')
        self.username = 'mestudent'
        self.password = 'SecurePassword123!'
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            institute_email='me@institute.edu',
            roll_number='CS2026888',
            branch='Computer Science',
            hostel='Hostel C',
            gender='F',
        )
        # Obtain access token
        token_url = reverse('accounts:token_obtain_pair')
        response = self.client.post(token_url, {'username': self.username, 'password': self.password}, format='json')
        self.access_token = response.data['access']

    def test_get_current_user_success(self):
        """Test Scenario 1: Call GET /api/accounts/me/ with valid JWT token and receive profile."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify returned fields
        expected_fields = {
            'id', 'username', 'full_name', 'institute_email', 'roll_number', 'branch',
            'academic_year', 'hostel', 'gender', 'phone_number', 'bio', 'profile_picture',
            'verification_status', 'role', 'is_email_verified', 'is_staff', 'is_superuser'
        }
        self.assertEqual(set(response.data.keys()), expected_fields)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['institute_email'], 'me@institute.edu')
        self.assertEqual(response.data['roll_number'], 'CS2026888')

        # Verify forbidden fields are never exposed
        for forbidden_field in ['password', 'groups', 'user_permissions', 'last_login']:
            self.assertNotIn(forbidden_field, response.data)

    def test_get_current_user_unauthorized_no_token(self):
        """Test Scenario 2: Call without Authorization header and receive HTTP 401."""
        self.client.credentials()  # No auth headers
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_unauthorized_invalid_token(self):
        """Test Scenario 3: Call with an invalid token and receive HTTP 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_jwt_token_string')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='profileuser',
            password='Password123!',
            institute_email='profileuser@iiitk.ac.in',
            roll_number='CS2026999',
            full_name='Test User',
            branch='Computer Science',
            academic_year='3rd Year',
            hostel='Hostel A',
            phone_number='9876543210',
            bio='CS student interested in ride sharing.'
        )
        token_url = reverse('accounts:token_obtain_pair')
        response = self.client.post(token_url, {'username': 'profileuser', 'password': 'Password123!'}, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_profile_success(self):
        url = reverse('direct-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'profileuser')
        self.assertEqual(response.data['institute_email'], 'profileuser@iiitk.ac.in')
        self.assertEqual(response.data['phone_number'], '9876543210')
        self.assertEqual(response.data['verification_status'], 'verified')
        self.assertEqual(response.data['role'], 'Student')

    def test_patch_profile_success(self):
        url = reverse('direct-profile')
        payload = {
            'bio': 'Updated bio for testing',
            'phone_number': '9123456789',
            'hostel': 'Hostel B',
            'gender': 'M',
            'academic_year': '4th Year',
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], 'Updated bio for testing')
        self.assertEqual(response.data['phone_number'], '9123456789')
        self.assertEqual(response.data['hostel'], 'Hostel B')

    def test_read_only_fields_cannot_be_modified(self):
        url = reverse('direct-profile')
        payload = {
            'institute_email': 'hacked@malicious.com',
            'verification_status': 'unverified',
            'average_rating': 5.0,
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.institute_email, 'profileuser@iiitk.ac.in')
        self.assertEqual(self.user.verification_status, 'verified')

    def test_invalid_phone_number_validation(self):
        url = reverse('direct-profile')
        payload = {'phone_number': '12345'}
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_invalid_bio_length_validation(self):
        url = reverse('direct-profile')
        payload = {'bio': 'a' * 301}
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('bio', response.data)

