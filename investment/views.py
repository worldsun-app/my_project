from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def quotes(request):
    return render(request, 'investment/quotes.html')

@login_required
def daily(request):
    return render(request, 'investment/daily.html')

@login_required
def macro(request):
    return render(request, 'investment/macro.html')

@login_required
def stocks(request):
    return render(request, 'investment/stocks.html') 