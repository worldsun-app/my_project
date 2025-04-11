from django.urls import path
from . import views

urlpatterns = [
    path('airtable-documents/', views.AirtableDocumentListView.as_view(), name='airtable_document_list'),
    path('airtable-documents/<int:pk>/download/', views.download_document, name='download_document'),
    path('airtable-documents/sync/', views.sync_documents, name='sync_documents'),
] 