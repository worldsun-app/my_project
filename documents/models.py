from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator

class Document(models.Model):
    """文件模型"""
    
    # 文件類別選擇
    CATEGORY_CHOICES = [
        ('investment', _('投資報告')),
        ('insurance', _('保險試算')),
        ('quotation', _('金融報價')),
        ('family_office', _('家族辦公室簡報')),
    ]
    
    # 基本資料
    title = models.CharField(_('標題'), max_length=200)
    description = models.TextField(_('描述'), blank=True)
    category = models.CharField(_('類別'), max_length=20, choices=CATEGORY_CHOICES)
    file = models.FileField(
        _('檔案'),
        upload_to='documents/%Y/%m/',
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'xlsx', 'xls', 'doc', 'docx', 'ppt', 'pptx']
        )]
    )
    
    # 上傳資訊
    uploaded_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('上傳者')
    )
    upload_time = models.DateTimeField(_('上傳時間'), auto_now_add=True)
    last_modified = models.DateTimeField(_('最後修改時間'), auto_now=True)
    
    # 下載統計
    download_count = models.PositiveIntegerField(_('下載次數'), default=0)
    
    class Meta:
        verbose_name = _('文件')
        verbose_name_plural = _('文件')
        ordering = ['-upload_time']
        
    def __str__(self):
        return self.title
        
    def increment_download_count(self):
        """增加下載次數"""
        self.download_count += 1
        self.save() 