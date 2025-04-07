from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.utils.html import format_html
from .models import InsuranceDocument, InvestmentDocument

@admin.register(InsuranceDocument)
class InsuranceDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'source', 'uploaded_by', 'upload_time', 'download_count', 'is_active', 'view_file')
    list_filter = ('category', 'source', 'is_active', 'upload_time')
    search_fields = ('title', 'description', 'uploaded_by__username')
    readonly_fields = ('download_count', 'upload_time', 'last_modified')
    
    def view_file(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">查看文件</a>', obj.file.url)
        elif obj.external_url:
            return format_html('<a href="{}" target="_blank">查看外部链接</a>', obj.external_url)
        return "无文件"
    view_file.short_description = '查看'

@admin.register(InvestmentDocument)
class InvestmentDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'source', 'uploaded_by', 'upload_time', 'download_count', 'is_active', 'view_file')
    list_filter = ('category', 'source', 'is_active', 'upload_time')
    search_fields = ('title', 'description', 'uploaded_by__username')
    readonly_fields = ('download_count', 'upload_time', 'last_modified')
    
    def view_file(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">查看文件</a>', obj.file.url)
        elif obj.external_url:
            return format_html('<a href="{}" target="_blank">查看外部链接</a>', obj.external_url)
        return "无文件"
    view_file.short_description = '查看'

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
