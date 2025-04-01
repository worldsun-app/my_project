from django.urls import path
from . import views

app_name = 'documents'

urlpatterns = [
    path('', views.DocumentListView.as_view(), name='list'),
    path('create/', views.DocumentCreateView.as_view(), name='create'),
    path('<int:pk>/', views.DocumentDetailView.as_view(), name='detail'),
    path('<int:pk>/download/', views.download_document, name='download'),
    path('api/upload/', views.upload_document_api, name='upload_api'),
] 