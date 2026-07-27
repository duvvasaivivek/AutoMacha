"""
Management command to expire outdated travel requests.

Usage:
    python manage.py expire_requests

This should be scheduled via cron or a task scheduler (e.g., every 5 minutes):
    */5 * * * * cd /path/to/project && python manage.py expire_requests
"""
from django.core.management.base import BaseCommand

from ...services import expire_outdated_requests


class Command(BaseCommand):
    help = 'Expire OPEN travel requests whose travel_datetime has passed.'

    def handle(self, *args, **options):
        expire_outdated_requests()
        self.stdout.write(self.style.SUCCESS('Successfully processed expired travel requests.'))
