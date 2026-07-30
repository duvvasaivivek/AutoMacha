import io
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.destinations.models import Destination
from apps.travel_requests.models import TravelRequest

User = get_user_model()


class SecurityAuditTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create standard student user 1
        self.student1 = User.objects.create_user(
            username='student1',
            password='Password123!',
            institute_email='student1@iiitk.ac.in',
            roll_number='CS2026001',
        )

        # Create standard student user 2
        self.student2 = User.objects.create_user(
            username='student2',
            password='Password123!',
            institute_email='student2@iiitk.ac.in',
            roll_number='CS2026002',
        )

        # Create destination
        self.destination = Destination.objects.create(name='Railway Station', is_active=True)

    def test_security_headers_present(self):
        """Verify OWASP security headers are present on API responses."""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(response.headers.get('X-Frame-Options'), 'DENY')
        self.assertEqual(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
        self.assertIn('Permissions-Policy', response.headers)
        self.assertIn('Content-Security-Policy', response.headers)

    def test_jwt_logout_blacklisting(self):
        """Verify POST /api/accounts/logout/ blacklists the refresh token."""
        self.client.force_authenticate(user=self.student1)
        refresh = RefreshToken.for_user(self.student1)

        # Logout & blacklist token
        logout_res = self.client.post('/api/accounts/logout/', {'refresh_token': str(refresh)})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Subsequent refresh with blacklisted token must fail with 401
        failed_refresh = self.client.post('/api/accounts/token/refresh/', {'refresh': str(refresh)})
        self.assertEqual(failed_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_vertical_privilege_escalation_blocked(self):
        """Verify unprivileged students cannot access Admin Portal APIs."""
        self.client.force_authenticate(user=self.student1)
        res = self.client.get('/api/admin-portal/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res_users = self.client.get('/api/admin-portal/users/')
        self.assertEqual(res_users.status_code, status.HTTP_403_FORBIDDEN)

    def test_idor_travel_request_modification_blocked(self):
        """Verify student1 cannot modify or cancel student2's travel request."""
        req = TravelRequest.objects.create(
            user=self.student2,
            destination=self.destination,
            direction='TO_CAMPUS',
            travel_datetime='2026-12-01T10:00:00Z',
            status='OPEN'
        )

        self.client.force_authenticate(user=self.student1)
        
        # Student 1 attempting to cancel Student 2's request
        cancel_res = self.client.post(f'/api/travel-requests/{req.id}/cancel/')
        self.assertEqual(cancel_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_picture_upload_hardening(self):
        """Verify file upload hardening rejects invalid/fake image files."""
        self.client.force_authenticate(user=self.student1)

        # 1. Reject fake image file (text file disguised with .jpg extension)
        fake_jpg = SimpleUploadedFile("script.jpg", b"<?php echo 'malicious'; ?>", content_type="image/jpeg")
        res1 = self.client.patch('/api/profile/', {'profile_picture': fake_jpg}, format='multipart')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('profile_picture', res1.data)

        # 2. Reject executable extension file
        exe_file = SimpleUploadedFile("virus.exe", b"MZ...", content_type="application/octet-stream")
        res2 = self.client.patch('/api/profile/', {'profile_picture': exe_file}, format='multipart')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Accept genuine PIL image
        img_byte_arr = io.BytesIO()
        img = Image.new('RGB', (100, 100), color='blue')
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)

        valid_jpg = SimpleUploadedFile("avatar.jpg", img_byte_arr.read(), content_type="image/jpeg")
        res3 = self.client.patch('/api/profile/', {'profile_picture': valid_jpg}, format='multipart')
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res3.data.get('profile_picture'))
