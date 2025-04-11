from django.urls import path
from . import views

app_name = 'airtable_sync'

urlpatterns = [
    path('airtable-documents/', views.AirtableDocumentListView.as_view(), name='airtable_document_list'),
    path('airtable-documents/<str:document_id>/download/', views.download_document, name='download_document'),
] 