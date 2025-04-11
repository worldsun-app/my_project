from pyairtable import Api, Base
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AirtableService:
    def __init__(self):
        try:
            self.api = Api(settings.AIRTABLE_API_KEY)
            self.base = self.api.base(settings.AIRTABLE_BASE_ID)
            self.table = self.base.table(settings.AIRTABLE_TABLE_ID)
            logger.info("Airtable 服務初始化成功")
        except Exception as e:
            logger.error(f"Airtable 服務初始化失敗: {str(e)}")
            raise
    
    def get_documents(self):
        try:
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
        except Exception as e:
            logger.error(f"獲取文檔失敗: {str(e)}")
            return [] 