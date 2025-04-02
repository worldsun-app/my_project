from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_remove_unnecessary_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='phone_number',
        ),
    ] 