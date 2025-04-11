from django.shortcuts import render
from django.http import FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
import requests
from io import BytesIO
from .services import AirtableService

# Create your views here.

class AirtableDocumentListView(LoginRequiredMixin, TemplateView):
    template_name = 'airtable_sync/document_list.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        service = AirtableService()
        context['documents'] = service.get_documents()
        return context

@login_required
def download_document(request, document_id):
    service = AirtableService()
    documents = service.get_documents()
    document = next((doc for doc in documents if doc['id'] == document_id), None)
    
    if not document or not document['file_url']:
        return HttpResponse("文件不存在或無法下載", status=404)
        
    try:
        response = requests.get(document['file_url'])
        response.raise_for_status()
        file_data = BytesIO(response.content)
        return FileResponse(file_data, as_attachment=True, filename=document['title'])
    except Exception as e:
        return HttpResponse("下載失敗", status=500)
