from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from .forms import LoginForm
import logging

logger = logging.getLogger(__name__)

# Create your views here.

def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            try:
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    logger.info(f'User {username} logged in successfully')
                    messages.success(request, '登入成功！')
                    return redirect('home')
                else:
                    logger.warning(f'Failed login attempt for user {username}')
                    messages.error(request, '用戶名或密碼錯誤')
            except Exception as e:
                logger.error(f'Login error for user {username}: {str(e)}')
                messages.error(request, '登入時發生錯誤，請稍後再試')
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})

def logout_view(request):
    try:
        logout(request)
        logger.info(f'User {request.user.username} logged out successfully')
        messages.success(request, '您已成功登出。')
    except Exception as e:
        logger.error(f'Logout error: {str(e)}')
    return redirect('accounts:login')
