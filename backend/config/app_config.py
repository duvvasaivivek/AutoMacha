"""
Centralized Application Configuration System for AutoMacha.
Provides environment-aware configuration defaults and feature toggles.
"""
from datetime import timedelta
import environ

env = environ.Env()

# Application Identity
APP_NAME = env('APP_NAME', default='AutoMacha')
APP_VERSION = env('APP_VERSION', default='1.0.0')
API_VERSION = env('API_VERSION', default='v1')
SUPPORTED_EMAIL_DOMAIN = env('SUPPORTED_EMAIL_DOMAIN', default='@iiitk.ac.in')
DEFAULT_TIMEZONE = env('DEFAULT_TIMEZONE', default='Asia/Kolkata')

# Authentication Configuration
OTP_EXPIRY_MINUTES = env.int('OTP_EXPIRY_MINUTES', default=10)
OTP_LENGTH = env.int('OTP_LENGTH', default=6)
MAX_LOGIN_ATTEMPTS = env.int('MAX_LOGIN_ATTEMPTS', default=5)
ACCOUNT_LOCK_DURATION_MINUTES = env.int('ACCOUNT_LOCK_DURATION_MINUTES', default=15)
RESEND_OTP_DELAY_SECONDS = env.int('RESEND_OTP_DELAY_SECONDS', default=60)
PASSWORD_RESET_EXPIRY_HOURS = env.int('PASSWORD_RESET_EXPIRY_HOURS', default=24)
JWT_ACCESS_TOKEN_LIFETIME = timedelta(minutes=env.int('JWT_ACCESS_MINUTES', default=60))
JWT_REFRESH_TOKEN_LIFETIME = timedelta(days=env.int('JWT_REFRESH_DAYS', default=7))

# Travel Requests Configuration
TRAVEL_REQUEST_EXPIRY_HOURS = env.int('TRAVEL_REQUEST_EXPIRY_HOURS', default=24)
MAX_ACTIVE_TRAVEL_REQUESTS = env.int('MAX_ACTIVE_TRAVEL_REQUESTS', default=5)
MAX_TRAVEL_REQUESTS_PER_DAY = env.int('MAX_TRAVEL_REQUESTS_PER_DAY', default=10)
ALLOW_EDIT_AFTER_MATCH = env.bool('ALLOW_EDIT_AFTER_MATCH', default=False)

# Matching Configuration
DEFAULT_MATCH_WINDOW_MINUTES = env.int('DEFAULT_MATCH_WINDOW_MINUTES', default=30)
MAX_MATCH_DISTANCE_METERS = env.int('MAX_MATCH_DISTANCE_METERS', default=5000)
MAX_MATCH_RESULTS = env.int('MAX_MATCH_RESULTS', default=20)

# Notifications Configuration
NOTIFICATION_RETENTION_DAYS = env.int('NOTIFICATION_RETENTION_DAYS', default=30)
MAX_NOTIFICATIONS_PER_USER = env.int('MAX_NOTIFICATIONS_PER_USER', default=100)
AUTO_MARK_READ_AFTER_DAYS = env.int('AUTO_MARK_READ_AFTER_DAYS', default=7)

# Email Configuration
EMAIL_VERIFICATION_EXPIRY_HOURS = env.int('EMAIL_VERIFICATION_EXPIRY_HOURS', default=24)
EMAIL_RESEND_DELAY_SECONDS = env.int('EMAIL_RESEND_DELAY_SECONDS', default=60)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@automacha.com')
EMAIL_SUBJECT_PREFIX = env('EMAIL_SUBJECT_PREFIX', default='[AutoMacha] ')

# Pagination Configuration
DEFAULT_PAGE_SIZE = env.int('DEFAULT_PAGE_SIZE', default=10)
MAX_PAGE_SIZE = env.int('MAX_PAGE_SIZE', default=100)
DEFAULT_ORDERING = env('DEFAULT_ORDERING', default='-created_at')

# Rate Limiting Configuration
LOGIN_RATE_LIMIT = env('LOGIN_RATE_LIMIT', default='5/min')
REGISTER_RATE_LIMIT = env('REGISTER_RATE_LIMIT', default='3/min')
OTP_RATE_LIMIT = env('OTP_RATE_LIMIT', default='3/min')
API_RATE_LIMIT = env('API_RATE_LIMIT', default='1000/day')

# Background Tasks Configuration
TRAVEL_REQUEST_EXPIRY_CHECK_INTERVAL = env.int('TRAVEL_REQUEST_EXPIRY_CHECK_INTERVAL', default=300)
OTP_CLEANUP_INTERVAL = env.int('OTP_CLEANUP_INTERVAL', default=3600)
NOTIFICATION_CLEANUP_INTERVAL = env.int('NOTIFICATION_CLEANUP_INTERVAL', default=86400)
HEALTH_CHECK_INTERVAL = env.int('HEALTH_CHECK_INTERVAL', default=3600)
OTP_RETENTION_HOURS = env.int('OTP_RETENTION_HOURS', default=1)

# Feature Flags
FEATURE_FLAGS = {
    'ENABLE_EMAIL_VERIFICATION': env.bool('ENABLE_EMAIL_VERIFICATION', default=False),
    'ENABLE_NOTIFICATIONS': env.bool('ENABLE_NOTIFICATIONS', default=True),
    'ENABLE_BACKGROUND_TASKS': env.bool('ENABLE_BACKGROUND_TASKS', default=True),
    'ENABLE_ANALYTICS': env.bool('ENABLE_ANALYTICS', default=False),
    'ENABLE_LOCATION_MATCHING': env.bool('ENABLE_LOCATION_MATCHING', default=True),
    'ENABLE_CUSTOM_DESTINATIONS': env.bool('ENABLE_CUSTOM_DESTINATIONS', default=True),
}
