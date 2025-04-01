from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import FileExtensionValidator
import os

class Document(models.Model):
    CATEGORY_CHOICES = [
        ('calculator', '保險試算表'),
        ('promotion', '保險優惠'),
        ('company', '保司介紹'),
        ('us_stock', '美股報告'),
        ('monthly', '投資月報'),
        ('strategy', '策略報告'),
    ]

    SOURCE_CHOICES = [
        ('manual', '手動上傳'),
        ('google_drive', 'Google Drive'),
        ('n8n', 'n8n生成'),
    ]

    title = models.CharField('標題', max_length=200)
    description = models.TextField('描述', blank=True)
    file = models.FileField(
        '文件',
        upload_to='documents/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'])],
        blank=True,
        null=True
    )
    external_url = models.URLField('外部連結', max_length=500, null=True, blank=True)
    source = models.CharField('來源', max_length=20, choices=SOURCE_CHOICES, default='manual')
    category = models.CharField('類別', max_length=20, choices=CATEGORY_CHOICES, default='strategy')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='上傳者'
    )
    upload_time = models.DateTimeField('上傳時間', auto_now_add=True)
    last_modified = models.DateTimeField('最後修改', auto_now=True)
    download_count = models.PositiveIntegerField('下載次數', default=0)
    is_active = models.BooleanField('是否啟用', default=True)

    class Meta:
        verbose_name = '文件'
        verbose_name_plural = '文件'
        ordering = ['-upload_time']

    def __str__(self):
        return self.title

    def get_file_url(self):
        """獲取文件URL"""
        if self.source == 'manual' and self.file:
            return self.file.url
        elif self.source in ['google_drive', 'n8n'] and self.external_url:
            return self.external_url
        return None

    def get_file_name(self):
        """獲取文件名稱"""
        if self.source == 'manual' and self.file:
            return os.path.basename(self.file.name)
        elif self.source in ['google_drive', 'n8n'] and self.external_url:
            return self.title
        return None

    def increment_download_count(self):
        """增加下載次數"""
        self.download_count += 1
        self.save()
