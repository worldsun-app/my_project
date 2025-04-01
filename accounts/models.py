from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, verbose_name='電話')
    company = models.CharField(max_length=100, blank=True, verbose_name='公司')
    department = models.CharField(max_length=100, blank=True, verbose_name='部門')
    position = models.CharField(max_length=100, blank=True, verbose_name='職位')
    
    class Meta:
        verbose_name = '用戶'
        verbose_name_plural = '用戶'
        
    def __str__(self):
        return self.username
