from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import FileExtensionValidator
import os

def document_upload_path(instance, filename):
    """生成文件上传路径"""
    return f'documents/{instance.__class__.__name__.lower()}/{filename}'

class BaseDocument(models.Model):
    """基礎文件模型"""
    SOURCE_CHOICES = [
        ('manual', '手動上傳'),
        ('google_drive', 'Google Drive'),
        ('n8n', 'n8n生成'),
    ]

    title = models.CharField('標題', max_length=200)
    description = models.TextField('描述', blank=True)
    file = models.FileField(
        '文件',
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'])],
        blank=True,
        null=True
    )
    external_url = models.URLField('外部連結', max_length=500, null=True, blank=True)
    source = models.CharField('來源', max_length=20, choices=SOURCE_CHOICES, default='manual')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='上傳者',
        db_index=True
    )
    upload_time = models.DateTimeField('上傳時間', auto_now_add=True, db_index=True)
    last_modified = models.DateTimeField('最後修改', auto_now=True)
    download_count = models.PositiveIntegerField('下載次數', default=0)
    is_active = models.BooleanField('是否啟用', default=True, db_index=True)

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['source']),
        ]

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
        self.save(update_fields=['download_count'])

class InsuranceDocument(BaseDocument):
    """保險文件模型"""
    CATEGORY_CHOICES = [
        ('products', '產品資料'),
        ('proposals', '計畫書'),
        ('promotions', '產品優惠'),
        ('info', '保險資訊'),
    ]

    category = models.CharField('類別', max_length=20, choices=CATEGORY_CHOICES, db_index=True)

    class Meta:
        verbose_name = '保險文件'
        verbose_name_plural = '保險文件'
        ordering = ['-upload_time']
        indexes = [
            models.Index(fields=['category']),
        ]

class InvestmentDocument(BaseDocument):
    """投資文件模型"""
    CATEGORY_CHOICES = [
        ('quotes', '行情報價'),
        ('daily', '每日報告'),
        ('macro', '總經報告'),
        ('stocks', '個股報告'),
    ]

    category = models.CharField('類別', max_length=20, choices=CATEGORY_CHOICES, db_index=True)

    class Meta:
        verbose_name = '投資文件'
        verbose_name_plural = '投資文件'
        ordering = ['-upload_time']
        indexes = [
            models.Index(fields=['category']),
        ]
