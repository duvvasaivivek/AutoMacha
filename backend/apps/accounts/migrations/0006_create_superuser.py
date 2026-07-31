# Generated manually to automatically create a superuser for Render deployments

import os
from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    
    # Securely fetch the password from Render Environment Variables
    admin_password = os.environ.get('ADMIN_PASSWORD')
    
    if admin_password and not User.objects.filter(username='124ad0048').exists():
        User.objects.create(
            username='124ad0048',
            email='124ad0048@iiitk.ac.in',
            institute_email='124ad0048@iiitk.ac.in',
            roll_number='124AD0048',
            password=make_password(admin_password),
            is_staff=True,
            is_superuser=True,
            is_active=True,
            verification_status='verified',
            full_name='Duvva Sai Vivek',
            gender='M',
            hostel='MVHR'
        )

def reverse_create_superuser(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_user_idx_user_active_joined'),
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_create_superuser),
    ]
