from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AuditLog

User = get_user_model()


class AdminPortalSecurityTests(APITestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="superadmin",
            password="superpassword123",
            institute_email="superadmin@iiitk.ac.in",
            roll_number="124AD9999"
        )
        self.staff_user = User.objects.create_user(
            username="staffadmin",
            password="staffpassword123",
            institute_email="staffadmin@iiitk.ac.in",
            roll_number="124AD8888",
            is_staff=True
        )
        self.normal_user = User.objects.create_user(
            username="normalstudent",
            password="studentpassword123",
            institute_email="normalstudent@iiitk.ac.in",
            roll_number="124AD7777"
        )

        self.dashboard_url = reverse('admin_portal:dashboard-stats')
        self.users_list_url = reverse('admin_portal:users-list')
        self.audit_logs_url = reverse('admin_portal:audit-logs')

    def test_superuser_access_granted(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", res.data)

    def test_staff_user_access_granted(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_normal_user_access_forbidden(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res_users = self.client.get(self.users_list_url)
        self.assertEqual(res_users.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_access_unauthorized(self):
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_user_active_creates_audit_log(self):
        self.client.force_authenticate(user=self.superuser)
        toggle_url = reverse('admin_portal:users-toggle-active', kwargs={'pk': self.normal_user.pk})
        res = self.client.patch(toggle_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['user']['is_active'])

        # Verify Audit Log entry created
        audit_entry = AuditLog.objects.filter(action="USER_DISABLED").first()
        self.assertIsNotNone(audit_entry)
        self.assertEqual(audit_entry.admin_user, self.superuser)
        self.assertIn("normalstudent", audit_entry.affected_object)

    def test_impersonation_superuser_only(self):
        impersonate_url = reverse('admin_portal:impersonate', kwargs={'user_id': self.normal_user.pk})

        # Staff user attempt -> 403 Forbidden
        self.client.force_authenticate(user=self.staff_user)
        staff_res = self.client.post(impersonate_url)
        self.assertEqual(staff_res.status_code, status.HTTP_403_FORBIDDEN)

        # Superuser attempt -> 200 OK
        self.client.force_authenticate(user=self.superuser)
        super_res = self.client.post(impersonate_url)
        self.assertEqual(super_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", super_res.data)

        # Verify audit log entry
        audit_entry = AuditLog.objects.filter(action="SUPERUSER_IMPERSONATION_STARTED").first()
        self.assertIsNotNone(audit_entry)
        self.assertEqual(audit_entry.admin_user, self.superuser)
