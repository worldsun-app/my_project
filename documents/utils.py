from django.contrib.auth import get_user_model
from django.db import connection
from django.core.cache import cache
from functools import wraps
import time
import json
from .models import UserActivityLog

def log_user_activity(action, document_type, document_id=None, document_title=None, request=None, details=None):
    """
    記錄用戶行為日誌
    """
    if not request or not request.user.is_authenticated:
        return

    log_data = {
        'user': request.user,
        'action': action,
        'document_type': document_type,
        'document_id': document_id,
        'document_title': document_title,
        'ip_address': request.META.get('REMOTE_ADDR'),
        'user_agent': request.META.get('HTTP_USER_AGENT'),
        'details': details
    }

    # 使用 bulk_create 批量創建日誌
    UserActivityLog.objects.create(**log_data)

def activity_logger(action, document_type):
    """
    用戶行為日誌裝飾器
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # 獲取文檔信息
            document_id = kwargs.get('pk')
            document_title = None
            if document_id:
                try:
                    from .models import InsuranceDocument, InvestmentDocument
                    if document_type == 'insurance':
                        doc = InsuranceDocument.objects.get(id=document_id)
                    else:
                        doc = InvestmentDocument.objects.get(id=document_id)
                    document_title = doc.title
                except:
                    pass

            # 記錄日誌
            log_user_activity(
                action=action,
                document_type=document_type,
                document_id=document_id,
                document_title=document_title,
                request=request
            )

            # 執行視圖函數
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator 