from django import forms
from .models import InsuranceDocument, InvestmentDocument

class BaseDocumentForm(forms.ModelForm):
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

class InsuranceDocumentForm(BaseDocumentForm):
    class Meta:
        model = InsuranceDocument
        fields = ['title', 'description', 'file', 'external_url', 'source', 'category']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'source': forms.Select(attrs={'class': 'form-select'}),
        }

class InvestmentDocumentForm(BaseDocumentForm):
    class Meta:
        model = InvestmentDocument
        fields = ['title', 'description', 'file', 'external_url', 'source', 'category']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'source': forms.Select(attrs={'class': 'form-select'}),
        } 