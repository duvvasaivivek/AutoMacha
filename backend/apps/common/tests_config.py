from django.conf import settings
from django.test import TestCase, override_settings


class AppConfigTests(TestCase):
    def test_centralized_config_values_loaded(self):
        self.assertEqual(settings.APP_NAME, 'AutoMacha')
        self.assertEqual(settings.SUPPORTED_EMAIL_DOMAIN, '@iiitk.ac.in')
        self.assertEqual(settings.TRAVEL_REQUEST_EXPIRY_HOURS, 24)
        self.assertEqual(settings.NOTIFICATION_RETENTION_DAYS, 30)
        self.assertEqual(settings.DEFAULT_PAGE_SIZE, 10)

    def test_feature_flags_configured(self):
        self.assertIn('FEATURE_FLAGS', dir(settings))
        flags = getattr(settings, 'FEATURE_FLAGS', {})
        self.assertIn('ENABLE_EMAIL_VERIFICATION', flags)
        self.assertTrue(flags.get('ENABLE_NOTIFICATIONS'))
        self.assertTrue(flags.get('ENABLE_BACKGROUND_TASKS'))
        self.assertTrue(flags.get('ENABLE_LOCATION_MATCHING'))

    @override_settings(SUPPORTED_EMAIL_DOMAIN='@customdomain.edu')
    def test_configuration_override_support(self):
        self.assertEqual(settings.SUPPORTED_EMAIL_DOMAIN, '@customdomain.edu')
