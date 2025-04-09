from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib import messages
from django.http import FileResponse, Http404
from django.urls import reverse_lazy
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import Q, Count
from django.core.paginator import Paginator
import json
from .models import InsuranceDocument, InvestmentDocument, Tag
from .forms import InsuranceDocumentForm, InvestmentDocumentForm
from django.conf import settings
from my_project.utils import cache_page, query_optimizer, activity_logger

# Create your views here.

# 保險相關視圖
class InsuranceDocumentListView(LoginRequiredMixin, ListView):
    model = InsuranceDocument
    template_name = 'documents/insurancedocument_list.html'
    context_object_name = 'documents'

    def get_queryset(self):
        category = self.kwargs.get('category')
        return InsuranceDocument.objects.filter(category=category, is_active=True)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        category = self.kwargs.get('category')
        category_names = {
            'products': '保險產品資料',
            'plans': '保險計畫書',
            'promotions': '保險產品優惠',
            'info': '保險資訊'
        }
        context['category_display_name'] = category_names.get(category, '文件列表')
        return context

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
@login_required
@cache_page(300)
@activity_logger('view', 'investment')
def investment_document_list(request, category):
    # 使用優化後的查詢
    documents = query_optimizer(
        InvestmentDocument.objects.filter(
            Q(created_by=request.user) | Q(is_public=True),
            category=category
        ).order_by('-created_at'),
        select_related=['created_by'],
        prefetch_related=['tags']
    )
    
    # 獲取類別顯示名稱
    category_names = {
        'market_quotes': '行情報價',
        'daily_reports': '每日報告',
        'macro_reports': '總經報告',
        'stock_reports': '個股報告'
    }
    
    return render(request, 'documents/investment_document_list.html', {
        'documents': documents,
        'category_display_name': category_names.get(category, '文件列表')
    })

@login_required
@activity_logger('view', 'investment')
def investment_document_detail(request, pk):
    document = get_object_or_404(
        InvestmentDocument.objects.select_related('created_by').prefetch_related('tags'),
        pk=pk
    )
    return render(request, 'documents/investment_document_detail.html', {
        'document': document
    })

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
@activity_logger('download', 'investment')
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
        # 驗證API金鑰
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != settings.API_KEY:
            return JsonResponse({
                'status': 'error',
                'message': '無效的API金鑰'
            }, status=401)

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
        
        # 驗證文件類型
        if data['document_type'] not in ['insurance', 'investment']:
            return JsonResponse({
                'status': 'error',
                'message': '無效的文件類型'
            }, status=400)

        # 驗證類別
        valid_categories = {
            'insurance': ['products', 'plans', 'promotions', 'info'],
            'investment': ['quotes', 'daily', 'macro', 'stocks']
        }
        if data['category'] not in valid_categories[data['document_type']]:
            return JsonResponse({
                'status': 'error',
                'message': '無效的文件類別'
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
            is_active=True
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

@login_required
def api_document_list(request, category):
    """API接口用於獲取分類文件列表"""
    try:
        # 解析分類
        doc_type, sub_category = category.split('-', 1)
        
        # 根據文件類型選擇模型和查詢條件
        if doc_type == 'insurance':
            model = InsuranceDocument
            category_mapping = {
                'products': 'products',
                'plans': 'plans',
                'promotions': 'promotions',
                'info': 'info'
            }
        else:  # investment
            model = InvestmentDocument
            category_mapping = {
                'quotes': 'market_quotes',
                'daily': 'daily_reports',
                'macro': 'macro_reports',
                'stocks': 'stock_reports'
            }
        
        # 獲取對應的數據庫分類
        db_category = category_mapping.get(sub_category)
        if not db_category:
            return JsonResponse({
                'status': 'error',
                'message': '無效的分類'
            }, status=400)
        
        # 查詢文件
        documents = model.objects.filter(
            category=db_category,
            is_active=True
        ).values('id', 'title', 'description', 'upload_time')
        
        # 格式化數據
        document_list = list(documents)
        for doc in document_list:
            doc['upload_time'] = doc['upload_time'].isoformat()
        
        return JsonResponse({
            'status': 'success',
            'data': document_list
        })
        
    except ValueError:
        return JsonResponse({
            'status': 'error',
            'message': '無效的分類格式'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

class InvestmentDocumentUpdateView(LoginRequiredMixin, UpdateView):
    model = InvestmentDocument
    form_class = InvestmentDocumentForm
    template_name = 'investment/document_form.html'

    def get_success_url(self):
        return reverse_lazy('documents:investment_document_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, '文件更新成功！')
        return super().form_valid(form)

class InvestmentDocumentDeleteView(LoginRequiredMixin, DeleteView):
    model = InvestmentDocument
    template_name = 'investment/document_confirm_delete.html'

    def get_success_url(self):
        return reverse_lazy('documents:investment_documents_list', kwargs={'category': self.object.category})

    def delete(self, request, *args, **kwargs):
        messages.success(request, '文件已刪除！')
        return super().delete(request, *args, **kwargs)

# 搜索和過濾相關視圖
@login_required
@activity_logger
def search_documents(request):
    query = request.GET.get('q', '')
    if query:
        # 搜索保險文件
        insurance_docs = InsuranceDocument.objects.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) |
            Q(content__icontains=query),
            is_active=True
        )
        
        # 搜索投資文件
        investment_docs = InvestmentDocument.objects.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) |
            Q(content__icontains=query),
            is_active=True
        )
        
        context = {
            'query': query,
            'insurance_documents': insurance_docs,
            'investment_documents': investment_docs,
            'has_results': insurance_docs.exists() or investment_docs.exists()
        }
    else:
        context = {
            'query': '',
            'insurance_documents': [],
            'investment_documents': [],
            'has_results': False
        }
    
    return render(request, 'documents/search_results.html', context)

@login_required
def document_preview(request, pk):
    """文檔預覽"""
    # 嘗試獲取保險文檔
    document = get_object_or_404(InsuranceDocument, pk=pk)
    if not document:
        # 如果找不到保險文檔，嘗試獲取投資文檔
        document = get_object_or_404(InvestmentDocument, pk=pk)
    
    if not document.preview_url:
        raise Http404('預覽不可用')
    
    return render(request, 'documents/preview.html', {
        'document': document,
        'preview_url': document.preview_url
    })

# 數據分析相關視圖
@login_required
def document_analytics(request):
    """文檔分析"""
    # 獲取下載統計
    download_stats = {
        'insurance': InsuranceDocument.objects.aggregate(
            total=Count('id'),
            downloads=Count('download_count')
        ),
        'investment': InvestmentDocument.objects.aggregate(
            total=Count('id'),
            downloads=Count('download_count')
        )
    }
    
    # 獲取分類統計
    category_stats = {
        'insurance': InsuranceDocument.objects.values('category').annotate(
            count=Count('id'),
            downloads=Count('download_count')
        ),
        'investment': InvestmentDocument.objects.values('category').annotate(
            count=Count('id'),
            downloads=Count('download_count')
        )
    }
    
    # 獲取標籤統計
    tag_stats = Tag.objects.annotate(
        doc_count=Count('basedocument'),
        download_count=Count('basedocument__download_count')
    ).order_by('-doc_count')[:10]
    
    return render(request, 'documents/analytics.html', {
        'download_stats': download_stats,
        'category_stats': category_stats,
        'tag_stats': tag_stats
    })
