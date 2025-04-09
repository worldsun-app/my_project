from django.urls import path
from . import views

app_name = 'documents'

urlpatterns = [
    path('api/upload/', views.upload_document_api, name='upload_api'),
    path('api/documents/<str:category>/', views.api_document_list, name='api_document_list'),
    path('insurance/<str:category>/', views.InsuranceDocumentListView.as_view(), name='insurance_documents_list'),
    path('insurance/<str:category>/create/', views.InsuranceDocumentCreateView.as_view(), name='insurance_document_create'),
    path('insurance/<int:pk>/', views.InsuranceDocumentDetailView.as_view(), name='insurance_document_detail'),
    path('insurance/<int:pk>/download/', views.download_insurance_document, name='insurance_document_download'),
    path('investment/<str:category>/', views.investment_document_list, name='investment_documents_list'),
    path('investment/<int:pk>/', views.investment_document_detail, name='investment_document_detail'),
    path('investment/create/', views.InvestmentDocumentCreateView.as_view(), name='investment_document_create'),
    path('investment/<int:pk>/update/', views.InvestmentDocumentUpdateView.as_view(), name='investment_document_update'),
    path('investment/<int:pk>/delete/', views.InvestmentDocumentDeleteView.as_view(), name='investment_document_delete'),
] 