# Generated manually to seed initial production destinations

from django.db import migrations

def seed_destinations(apps, schema_editor):
    Destination = apps.get_model('destinations', 'Destination')
    destinations_list = [
        "IIITDM Kurnool Campus",
        "Kurnool Railway Station",
        "Kurnool RTC Bus Stand",
        "Nandyal Checkpost",
        "9R Mandi",
        "SVC Cinemas"
    ]
    # Efficient bulk creation using ignore_conflicts
    Destination.objects.bulk_create(
        [Destination(name=name, is_active=True) for name in destinations_list],
        ignore_conflicts=True
    )

def reverse_seed_destinations(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('destinations', '0002_destination_idx_destination_active_name'),
    ]

    operations = [
        migrations.RunPython(seed_destinations, reverse_seed_destinations),
    ]
