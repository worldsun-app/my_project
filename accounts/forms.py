from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label='用戶名',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '請輸入用戶名'
        })
    )
    password = forms.CharField(
        label='密碼',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '請輸入密碼'
        })
    )

    def clean(self):
        try:
            cleaned_data = super().clean()
            return cleaned_data
        except ValidationError as e:
            logger.error(f'Form validation error: {str(e)}')
            raise
        except Exception as e:
            logger.error(f'Unexpected error in form: {str(e)}')
            raise ValidationError('表單處理時發生錯誤，請稍後再試') 