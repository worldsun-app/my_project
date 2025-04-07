from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from announcements.models import Announcement
from documents.models import InsuranceDocument, InvestmentDocument

@login_required
def home(request):
    # 獲取最新的5條有效公告
    latest_announcements = Announcement.objects.filter(is_active=True).order_by('-created_at')[:5]
    
    # 獲取最新的5個保險文件
    latest_insurance_docs = InsuranceDocument.objects.all().order_by('-upload_time')[:5]
    
    # 獲取最新的5個投資文件
    latest_investment_docs = InvestmentDocument.objects.all().order_by('-upload_time')[:5]
    
    context = {
        'announcements': latest_announcements,
        'insurance_docs': latest_insurance_docs,
        'investment_docs': latest_investment_docs,
    }
    
    return render(request, 'home.html', context) 