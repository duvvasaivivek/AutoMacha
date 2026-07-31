# Generated manually to remove the Campus destination from the database

from django.db import migrations

def remove_campus_destination(apps, schema_editor):
    Destination = apps.get_model('destinations', 'Destination')
    Destination.objects.filter(name="IIITDM Kurnool Campus").delete()

def restore_campus_destination(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('destinations', '0003_seed_destinations'),
    ]

    operations = [
        migrations.RunPython(remove_campus_destination, restore_campus_destination),
    ]
