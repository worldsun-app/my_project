from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'upload_time', 'download_count')
    list_filter = ('category', 'upload_time')
    search_fields = ('title', 'description')
    readonly_fields = ('upload_time', 'last_modified', 'download_count')
    ordering = ('-upload_time',)
    
    fieldsets = (
        ('基本資料', {
            'fields': ('title', 'description', 'category', 'file')
        }),
        ('上傳資訊', {
            'fields': ('uploaded_by', 'upload_time', 'last_modified')
        }),
        ('統計資訊', {
            'fields': ('download_count',)
        }),
    ) 