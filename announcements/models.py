from django.db import models
from django.conf import settings
from django.utils import timezone

class Announcement(models.Model):
    title = models.CharField('標題', max_length=200)
    content = models.TextField('內容')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='發布者'
    )
    created_at = models.DateTimeField('發布時間', auto_now_add=True)
    updated_at = models.DateTimeField('最後修改時間', auto_now=True)
    start_date = models.DateTimeField('開始時間', default=timezone.now)
    end_date = models.DateTimeField('結束時間', null=True, blank=True)
    is_active = models.BooleanField('是否啟用', default=True)
    is_important = models.BooleanField('是否重要', default=False)

    class Meta:
        verbose_name = '公告'
        verbose_name_plural = '公告'
        ordering = ['-is_important', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_current(self):
        """檢查公告是否在有效期間內"""
        now = timezone.now()
        if self.end_date:
            return self.is_active and self.start_date <= now <= self.end_date
        return self.is_active and self.start_date <= now
