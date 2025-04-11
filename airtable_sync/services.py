from pyairtable import Api, Base
from django.conf import settings
from .models import AirtableDocument

class AirtableSyncService:
    def __init__(self):
        self.api = Api(settings.AIRTABLE_API_KEY)
        self.base = self.api.base(settings.AIRTABLE_BASE_ID)
        self.table = self.base.table(settings.AIRTABLE_TABLE_ID)
    
    def sync_documents(self):
        records = self.table.all()
        for record in records:
            # 獲取 Airtable 中的附件
            attachments = record['fields'].get('attachments', [])
            if attachments:
                file_url = attachments[0].get('url', '')  # 獲取第一個附件的 URL
            else:
                file_url = ''
                
            AirtableDocument.objects.update_or_create(
                airtable_id=record['id'],
                defaults={
                    'title': record['fields'].get('title', ''),
                    'category': record['fields'].get('category', ''),
                    'file_url': file_url,
                    'created_at': record['createdTime'],
                    'updated_at': record['fields'].get('updated_at', record['createdTime'])
                }
            ) 