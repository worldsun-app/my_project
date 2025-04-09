import time
from django.db import connection
from django.db import reset_queries
import logging

logger = logging.getLogger(__name__)

class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 重置查詢計數器
        reset_queries()
        
        # 記錄開始時間
        start_time = time.time()
        
        # 處理請求
        response = self.get_response(request)
        
        # 計算執行時間
        total_time = time.time() - start_time
        
        # 獲取數據庫查詢次數
        total_queries = len(connection.queries)
        
        # 記錄性能數據
        logger.info(
            f"Path: {request.path}, "
            f"Method: {request.method}, "
            f"Time: {total_time:.2f}s, "
            f"Queries: {total_queries}"
        )
        
        # 如果查詢次數過多，記錄詳細信息
        if total_queries > 20:
            logger.warning(
                f"High number of queries ({total_queries}) on {request.path}"
            )
            for query in connection.queries:
                logger.debug(f"Query: {query['sql']}")
        
        return response 