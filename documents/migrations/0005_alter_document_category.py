# Generated by Django 4.2.20 on 2025-04-01 08:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_alter_document_category_alter_document_file_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='category',
            field=models.CharField(choices=[('calculator', '保險試算表'), ('promotion', '保險優惠'), ('company', '保司介紹'), ('us_stock', '美股報告'), ('monthly', '投資月報'), ('strategy', '策略報告')], default='strategy', max_length=20, verbose_name='類別'),
        ),
    ]
