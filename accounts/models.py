from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class CustomUser(AbstractUser):
    class Meta:
        verbose_name = '用戶'
        verbose_name_plural = '用戶'
        
    def __str__(self):
        return self.username
