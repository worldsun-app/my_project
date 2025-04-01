from django.views.generic import ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Document

class DocumentListView(LoginRequiredMixin, ListView):
    """文件列表視圖"""
    model = Document
    template_name = 'documents/document_list.html'
    context_object_name = 'documents'
    
    def get_queryset(self):
        """根據類別過濾文件"""
        queryset = super().get_queryset()
        category = self.request.GET.get('category')
        
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = dict(Document.CATEGORY_CHOICES)
        context['current_category'] = self.request.GET.get('category')
        return context

class DocumentDetailView(LoginRequiredMixin, DetailView):
    """文件詳情視圖"""
    model = Document
    template_name = 'documents/document_detail.html'
    context_object_name = 'document'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category_name'] = dict(Document.CATEGORY_CHOICES)[self.object.category]
        return context

def download_document(request, pk):
    """文件下載視圖"""
    document = get_object_or_404(Document, pk=pk)
    
    # 增加下載次數
    document.increment_download_count()
    
    # 返回文件
    response = FileResponse(document.file)
    response['Content-Disposition'] = f'attachment; filename="{document.file.name}"'
    return response 