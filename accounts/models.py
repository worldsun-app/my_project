from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    """自定義用戶模型"""
    
    # 基本資料
    phone = models.CharField(_('電話'), max_length=15, blank=True)
    department = models.CharField(_('部門'), max_length=50, blank=True)
    position = models.CharField(_('職位'), max_length=50, blank=True)
    
    # 帳戶狀態
    is_active = models.BooleanField(_('啟用狀態'), default=True)
    last_login_ip = models.GenericIPAddressField(_('最後登入IP'), null=True, blank=True)
    last_login_time = models.DateTimeField(_('最後登入時間'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('用戶')
        verbose_name_plural = _('用戶')
        ordering = ['-date_joined']
        
    def __str__(self):
        return self.username 