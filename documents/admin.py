from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'source', 'upload_time', 'download_count', 'is_active')
    list_filter = ('category', 'source', 'is_active')
    search_fields = ('title', 'description')
    readonly_fields = ('upload_time', 'last_modified', 'download_count')
    ordering = ('-upload_time',)
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'file', 'category')}),
        ('統計資訊', {'fields': ('upload_time', 'last_modified', 'download_count')}),
        ('上傳者資訊', {'fields': ('uploaded_by',)}),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('api-documentation/', self.admin_site.admin_view(self.api_documentation_view), name='api-documentation'),
        ]
        return custom_urls + urls

    def api_documentation_view(self, request):
        return render(request, 'admin/api_documentation.html')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_api_doc'] = True
        return super().changelist_view(request, extra_context=extra_context)
