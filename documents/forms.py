from django import forms
from .models import Document

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title', 'description', 'file', 'external_url', 'source', 'category']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

    def clean(self):
        cleaned_data = super().clean()
        source = cleaned_data.get('source')
        file = cleaned_data.get('file')
        external_url = cleaned_data.get('external_url')

        if source == 'manual' and not file:
            raise forms.ValidationError('手動上傳時必須選擇文件')
        elif source in ['google_drive', 'n8n'] and not external_url:
            raise forms.ValidationError('外部來源必須提供URL')

        return cleaned_data 