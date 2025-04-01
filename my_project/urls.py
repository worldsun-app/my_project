from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('documents/', include('documents.urls')),
    path('', include('accounts.urls')),  # 將根路徑重定向到 accounts
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 