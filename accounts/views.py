from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django.utils import timezone
from django.shortcuts import redirect
from django.urls import reverse_lazy

class CustomLoginView(LoginView):
    """自定義登入視圖"""
    template_name = 'accounts/login.html'
    
    def form_valid(self, form):
        """登入成功後更新最後登入資訊"""
        response = super().form_valid(form)
        user = form.get_user()
        user.last_login_ip = self.request.META.get('REMOTE_ADDR')
        user.last_login_time = timezone.now()
        user.save()
        return response

class CustomLogoutView(LogoutView):
    """自定義登出視圖"""
    next_page = reverse_lazy('accounts:login')

class DashboardView(LoginRequiredMixin, TemplateView):
    """儀表板視圖"""
    template_name = 'accounts/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user'] = self.request.user
        return context 