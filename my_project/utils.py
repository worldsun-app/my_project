from django.core.cache import cache
from django.db.models import Q
from functools import wraps
import time
from django.db import connection

def cache_page(timeout):
    """
    頁面緩存裝飾器
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            cache_key = f'view_cache_{request.path}_{request.GET.urlencode()}'
            response = cache.get(cache_key)
            if response is None:
                response = view_func(request, *args, **kwargs)
                cache.set(cache_key, response, timeout)
            return response
        return _wrapped_view
    return decorator

def query_optimizer(queryset, select_related=None, prefetch_related=None):
    """
    優化查詢集
    :param queryset: 查詢集
    :param select_related: 需要select_related的字段
    :param prefetch_related: 需要prefetch_related的字段
    :return: 優化後的查詢集
    """
    if select_related:
        queryset = queryset.select_related(*select_related)
    if prefetch_related:
        queryset = queryset.prefetch_related(*prefetch_related)
    return queryset

def bulk_create_with_cache(model, objects, cache_key, timeout=3600):
    """
    批量創建對象並緩存結果
    """
    created_objects = model.objects.bulk_create(objects)
    cache.set(cache_key, created_objects, timeout)
    return created_objects

def get_or_set_cache(key, func, timeout=3600):
    """
    獲取緩存，如果不存在則執行函數並緩存結果
    """
    result = cache.get(key)
    if result is None:
        result = func()
        cache.set(key, result, timeout)
    return result

class QueryTimer:
    def __init__(self, name):
        self.name = name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed_time = time.time() - self.start_time
        print(f"{self.name} took {elapsed_time:.2f} seconds")

def query_debugger(func):
    """
    數據庫查詢調試裝飾器
    """
    @wraps(func)
    def inner_func(*args, **kwargs):
        reset_queries()
        start_queries = len(connection.queries)
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        end_queries = len(connection.queries)
        
        print(f"Function : {func.__name__}")
        print(f"Number of Queries : {end_queries - start_queries}")
        print(f"Finished in : {(end - start):.2f}s")
        return result
    return inner_func

def reset_queries():
    """
    重置查詢計數器
    """
    from django.db import reset_queries
    reset_queries() 