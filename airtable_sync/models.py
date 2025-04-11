from django.db import models

# Create your models here.

class AirtableDocument(models.Model):
    airtable_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    file_url = models.URLField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.title
