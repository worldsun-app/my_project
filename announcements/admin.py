from django.contrib import admin
from .models import Announcement

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'created_at', 'start_date', 'end_date', 'is_active', 'is_important')
    list_filter = ('is_active', 'is_important', 'created_at', 'start_date', 'end_date', 'created_by')
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('title', 'content', 'is_active', 'is_important')}),
        ('時間設置', {'fields': ('start_date', 'end_date')}),
        ('系統資訊', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # 如果是新建公告
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
