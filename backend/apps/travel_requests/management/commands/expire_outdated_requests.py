from django.core.management.base import BaseCommand
from apps.travel_requests.services import expire_outdated_requests


class Command(BaseCommand):
    help = "Transitions outdated OPEN travel requests to EXPIRED status, records expired history, and notifies owners."

    def handle(self, *args, **options):
        count = expire_outdated_requests()
        self.stdout.write(self.style.SUCCESS(f"Successfully processed and expired {count} outdated travel request(s)."))
