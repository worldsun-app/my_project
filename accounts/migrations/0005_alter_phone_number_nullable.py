from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_remove_phone_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='phone_number',
            field=models.CharField(max_length=15, null=True, blank=True),
        ),
    ] 