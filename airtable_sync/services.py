from pyairtable import Api, Base
from django.conf import settings

class AirtableService:
    def __init__(self):
        self.api = Api(settings.AIRTABLE_API_KEY)
        self.base = self.api.base(settings.AIRTABLE_BASE_ID)
        self.table = self.base.table(settings.AIRTABLE_TABLE_ID)
    
    def get_documents(self):
        records = self.table.all()
        documents = []
        for record in records:
            attachments = record['fields'].get('attachments', [])
            if attachments:
                file_url = attachments[0].get('url', '')
            else:
                file_url = ''
                
            documents.append({
                'id': record['id'],
                'title': record['fields'].get('title', ''),
                'category': record['fields'].get('category', ''),
                'file_url': file_url,
                'created_at': record['createdTime'],
                'updated_at': record['fields'].get('updated_at', record['createdTime'])
            })
        return documents 