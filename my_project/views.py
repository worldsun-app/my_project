from django.shortcuts import render
from django.views.generic import TemplateView
from announcements.models import Announcement
from documents.models import InsuranceDocument, InvestmentDocument
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
import json
from datetime import datetime

class HomeView(LoginRequiredMixin, TemplateView):
    template_name = 'home.html'

    def get(self, request, *args, **kwargs):
        # 重定向到保险产品页面
        return redirect('documents:insurance_documents_list', category='products')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['latest_announcements'] = Announcement.objects.filter(is_active=True).order_by('-created_at')[:5]
        context['latest_insurance_documents'] = InsuranceDocument.objects.filter(is_active=True).order_by('-upload_time')[:3]
        context['latest_investment_documents'] = InvestmentDocument.objects.filter(is_active=True).order_by('-upload_time')[:3]
        return context 

@login_required
@require_GET
def get_content(request, category, subcategory):
    """
    根据分类和子分类获取内容
    """
    # 这里可以根据实际需求从数据库获取数据
    # 示例数据
    sample_data = {
        'insurance': {
            'products': [
                {
                    'name': '終身壽險',
                    'description': '提供終身保障的壽險產品',
                    'upload_time': '2024-04-01'
                },
                {
                    'name': '醫療保險',
                    'description': '提供醫療費用保障的保險產品',
                    'upload_time': '2024-04-02'
                }
            ],
            'plans': [
                {
                    'name': '退休規劃方案',
                    'description': '針對退休規劃的保險方案',
                    'upload_time': '2024-04-03'
                }
            ]
        },
        'investment': {
            'quotes': [
                {
                    'name': '台股即時報價',
                    'description': '台灣股市即時行情',
                    'upload_time': '2024-04-01'
                }
            ],
            'daily': [
                {
                    'name': '每日市場分析',
                    'description': '每日市場動態分析報告',
                    'upload_time': '2024-04-01'
                }
            ]
        }
    }

    try:
        items = sample_data.get(category, {}).get(subcategory, [])
        return JsonResponse({
            'status': 'success',
            'items': items
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500) 