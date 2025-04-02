from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.views.decorators.debug import sensitive_post_parameters
from .forms import LoginForm
import logging
import traceback

logger = logging.getLogger(__name__)

# Create your views here.

@sensitive_post_parameters('password')
def login_view(request):
    logger.debug(f'Login attempt from IP: {request.META.get("REMOTE_ADDR")}')
    
    if request.user.is_authenticated:
        logger.info(f'User {request.user.username} is already authenticated, redirecting to home')
        return redirect('home')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            logger.info(f'User {username} logged in successfully')
            messages.success(request, '登入成功！')
            return redirect('home')
        else:
            logger.warning(f'Failed login attempt for user {username}')
            messages.error(request, '用戶名或密碼錯誤，請重試。')
            return render(request, 'accounts/login.html', {'username': username})
    else:
        logger.debug('Rendering login form')
        
    return render(request, 'accounts/login.html')

def logout_view(request):
    try:
        username = request.user.username if request.user.is_authenticated else 'Anonymous'
        logout(request)
        logger.info(f'User {username} logged out successfully')
        messages.success(request, '您已成功登出。')
    except Exception as e:
        logger.error(f'Logout error: {str(e)}')
        logger.error(f'Traceback: {traceback.format_exc()}')
    return redirect('accounts:login')

@login_required
def dashboard(request):
    return render(request, 'accounts/dashboard.html')
