from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, DetailView, CreateView
from django.contrib import messages
from django.http import FileResponse, Http404
from django.urls import reverse_lazy
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import InsuranceDocument, InvestmentDocument
from .forms import InsuranceDocumentForm, InvestmentDocumentForm

# Create your views here.

# 保險相關視圖
class InsuranceDocumentListView(LoginRequiredMixin, ListView):
    model = InsuranceDocument
    template_name = 'insurance/documents_list.html'
    context_object_name = 'documents'

    def get_queryset(self):
        category = self.kwargs.get('category')
        return InsuranceDocument.objects.filter(category=category, is_active=True)

class InsuranceDocumentCreateView(LoginRequiredMixin, CreateView):
    model = InsuranceDocument
    form_class = InsuranceDocumentForm
    template_name = 'insurance/document_form.html'

    def get_success_url(self):
        return reverse_lazy('documents:insurance_documents_list', kwargs={'category': self.object.category})

    def form_valid(self, form):
        form.instance.uploaded_by = self.request.user
        messages.success(self.request, '文件上傳成功！')
        return super().form_valid(form)

class InsuranceDocumentDetailView(LoginRequiredMixin, DetailView):
    model = InsuranceDocument
    template_name = 'insurance/document_detail.html'
    context_object_name = 'document'

@login_required
def download_insurance_document(request, pk):
    document = get_object_or_404(InsuranceDocument, pk=pk)
    document.increment_download_count()
    
    if document.source == 'manual' and document.file:
        return FileResponse(document.file, as_attachment=True)
    elif document.source in ['google_drive', 'n8n'] and document.external_url:
        return redirect(document.external_url)
    else:
        raise Http404('文件不存在')

# 投資相關視圖
class InvestmentDocumentListView(LoginRequiredMixin, ListView):
    model = InvestmentDocument
    template_name = 'investment/documents_list.html'
    context_object_name = 'documents'

    def get_queryset(self):
        category = self.kwargs.get('category')
        return InvestmentDocument.objects.filter(category=category, is_active=True)

class InvestmentDocumentCreateView(LoginRequiredMixin, CreateView):
    model = InvestmentDocument
    form_class = InvestmentDocumentForm
    template_name = 'investment/document_form.html'

    def get_success_url(self):
        return reverse_lazy('documents:investment_documents_list', kwargs={'category': self.object.category})

    def form_valid(self, form):
        form.instance.uploaded_by = self.request.user
        messages.success(self.request, '文件上傳成功！')
        return super().form_valid(form)

class InvestmentDocumentDetailView(LoginRequiredMixin, DetailView):
    model = InvestmentDocument
    template_name = 'investment/document_detail.html'
    context_object_name = 'document'

@login_required
def download_investment_document(request, pk):
    document = get_object_or_404(InvestmentDocument, pk=pk)
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
        required_fields = ['title', 'category', 'file_url', 'document_type']
        for field in required_fields:
            if field not in data:
                return JsonResponse({
                    'status': 'error',
                    'message': f'缺少必要字段: {field}'
                }, status=400)
        
        # 根據文件類型選擇模型
        model = InsuranceDocument if data['document_type'] == 'insurance' else InvestmentDocument
        
        # 創建文件記錄
        document = model.objects.create(
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
