from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView
from django.contrib import messages
from django.http import FileResponse, Http404
from django.urls import reverse_lazy
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Document
from .forms import DocumentForm

# Create your views here.

class DocumentListView(ListView):
    model = Document
    template_name = 'documents/document_list.html'
    context_object_name = 'documents'
    paginate_by = 10

    def get_queryset(self):
        queryset = Document.objects.filter(is_active=True)
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('-upload_time')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category_choices'] = Document.CATEGORY_CHOICES
        return context

class DocumentDetailView(DetailView):
    model = Document
    template_name = 'documents/document_detail.html'
    context_object_name = 'document'

    def get_queryset(self):
        return Document.objects.filter(is_active=True)

class DocumentCreateView(LoginRequiredMixin, CreateView):
    model = Document
    form_class = DocumentForm
    template_name = 'documents/document_form.html'
    success_url = reverse_lazy('documents:list')

    def form_valid(self, form):
        form.instance.uploaded_by = self.request.user
        messages.success(self.request, '文件上傳成功！')
        return super().form_valid(form)

def download_document(request, pk):
    document = get_object_or_404(Document, pk=pk)
    document.increment_download_count()
    
    if document.source == 'manual' and document.file:
        return FileResponse(document.file, as_attachment=True)
    elif document.source in ['google_drive', 'n8n'] and document.external_url:
        return redirect(document.external_url)
    else:
        raise Http404('文件不存在')

@csrf_exempt
@require_http_methods(["POST"])
def upload_document_api(request):
    """API接口用於n8n上傳文件"""
    try:
        # 解析請求數據
        data = json.loads(request.body)
        
        # 驗證必要字段
        required_fields = ['title', 'category', 'file_url']
        for field in required_fields:
            if field not in data:
                return JsonResponse({
                    'status': 'error',
                    'message': f'缺少必要字段: {field}'
                }, status=400)
        
        # 創建文件記錄
        document = Document.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            external_url=data['file_url'],
            source='n8n',
            category=data['category'],
            uploaded_by=request.user if request.user.is_authenticated else None
        )
        
        return JsonResponse({
            'status': 'success',
            'message': '文件上傳成功',
            'document_id': document.id,
            'title': document.title
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': '無效的JSON數據'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
