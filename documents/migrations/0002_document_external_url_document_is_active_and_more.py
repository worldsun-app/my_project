# Generated by Django 4.2.20 on 2025-04-01 07:44

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='external_url',
            field=models.URLField(blank=True, max_length=500, null=True, verbose_name='外部連結'),
        ),
        migrations.AddField(
            model_name='document',
            name='is_active',
            field=models.BooleanField(default=True, verbose_name='是否啟用'),
        ),
        migrations.AddField(
            model_name='document',
            name='source',
            field=models.CharField(choices=[('manual', '手動上傳'), ('google_drive', 'Google Drive'), ('n8n', 'n8n自動生成')], default='manual', max_length=20, verbose_name='來源'),
        ),
        migrations.AlterField(
            model_name='document',
            name='category',
            field=models.CharField(choices=[('news', '新聞'), ('report', '報告'), ('analysis', '分析'), ('other', '其他')], default='other', max_length=20, verbose_name='分類'),
        ),
        migrations.AlterField(
            model_name='document',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='documents/%Y/%m/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'])], verbose_name='檔案'),
        ),
    ]
