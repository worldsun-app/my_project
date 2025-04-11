from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView
from django.http import FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
import requests
from io import BytesIO
from .models import AirtableDocument
from .services import AirtableSyncService

# Create your views here.

class AirtableDocumentListView(LoginRequiredMixin, ListView):
    model = AirtableDocument
    template_name = 'airtable_sync/document_list.html'
    context_object_name = 'documents'
    
    def get_queryset(self):
        return AirtableDocument.objects.all().order_by('-created_at')

@login_required
def download_document(request, pk):
    document = get_object_or_404(AirtableDocument, pk=pk)
    try:
        response = requests.get(document.file_url)
        response.raise_for_status()
        file_data = BytesIO(response.content)
        return FileResponse(file_data, as_attachment=True, filename=document.title)
    except Exception as e:
        return HttpResponse("下載失敗", status=500)

@login_required
def sync_documents(request):
    if request.method == 'POST':
        try:
            service = AirtableSyncService()
            service.sync_documents()
            messages.success(request, '文檔同步成功！')
        except Exception as e:
            messages.error(request, f'同步失敗：{str(e)}')
    return redirect('airtable_sync:airtable_document_list')
