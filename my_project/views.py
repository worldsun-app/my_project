from django.shortcuts import render
from django.views.generic import TemplateView
from announcements.models import Announcement
from documents.models import Document

class HomeView(TemplateView):
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['latest_announcements'] = Announcement.objects.filter(is_active=True).order_by('-created_at')[:5]
        context['latest_documents'] = Document.objects.filter(is_active=True).order_by('-upload_time')[:5]
        return context 