from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_remove_phone_field'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='company',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='department',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='position',
        ),
    ] 