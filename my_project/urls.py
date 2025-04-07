"""
URL configuration for my_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from .views import HomeView
from django.contrib.auth import views as auth_views
from accounts.views import login_view, logout_view
from insurance.views import products, proposals, promotions, info
from investment.views import quotes, daily, macro, stocks
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('documents/', include('documents.urls')),
    path('', RedirectView.as_view(url='/documents/insurance/products/'), name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    
    # 保險相關路由
    path('insurance/products/', products, name='insurance_products'),
    path('insurance/proposals/', proposals, name='insurance_proposals'),
    path('insurance/promotions/', promotions, name='insurance_promotions'),
    path('insurance/info/', info, name='insurance_info'),
    
    # 投資相關路由
    path('investment/quotes/', quotes, name='investment_quotes'),
    path('investment/daily/', daily, name='investment_daily'),
    path('investment/macro/', macro, name='investment_macro'),
    path('investment/stocks/', stocks, name='investment_stocks'),
    path('api/content/<str:category>/<str:subcategory>/', views.get_content, name='get_content'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
