import time
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 重置查詢計數器
        reset_queries()
        
        # 開始計時
        start_time = time.time()
        
        # 處理請求
        response = self.get_response(request)
        
        # 計算執行時間
        duration = time.time() - start_time
        
        # 獲取數據庫查詢次數
        db_queries = len(connection.queries)
        
        # 添加性能信息到響應頭
        response['X-Request-Duration'] = f'{duration:.2f}s'
        response['X-DB-Queries'] = str(db_queries)
        
        # 記錄性能數據
        logger.info(
            f"Path: {request.path}, "
            f"Method: {request.method}, "
            f"Time: {duration:.2f}s, "
            f"Queries: {db_queries}"
        )
        
        # 如果查詢次數過多，記錄詳細信息
        if db_queries > 20:
            logger.warning(
                f"High number of queries ({db_queries}) on {request.path}"
            )
            for query in connection.queries:
                logger.debug(f"Query: {query['sql']}")
        
        # 如果執行時間過長，記錄警告
        if duration > 1.0:  # 超過1秒
            print(f'警告：請求 {request.path} 執行時間過長：{duration:.2f}秒，數據庫查詢：{db_queries}次')
        
        return response 