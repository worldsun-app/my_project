from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def products(request):
    return render(request, 'insurance/products.html')

@login_required
def proposals(request):
    return render(request, 'insurance/proposals.html')

@login_required
def promotions(request):
    return render(request, 'insurance/promotions.html')

@login_required
def info(request):
    return render(request, 'insurance/info.html') 