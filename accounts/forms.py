from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError
import logging
import traceback

logger = logging.getLogger(__name__)

class LoginForm(forms.Form):
    username = forms.CharField(
        label='用戶名',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    password = forms.CharField(
        label='密碼',
        widget=forms.PasswordInput(attrs={'class': 'form-control'})
    )

    def clean(self):
        try:
            logger.debug('Starting form validation')
            cleaned_data = super().clean()
            logger.debug('Form validation completed successfully')
            return cleaned_data
        except ValidationError as e:
            logger.error(f'Form validation error: {str(e)}')
            logger.error(f'Traceback: {traceback.format_exc()}')
            raise
        except Exception as e:
            logger.error(f'Unexpected error in form: {str(e)}')
            logger.error(f'Traceback: {traceback.format_exc()}')
            raise ValidationError('表單處理時發生錯誤，請稍後再試')

    def confirm_login_allowed(self, user):
        if not user.is_active:
            logger.warning(f'Login attempt for inactive user: {user.username}')
            raise ValidationError(
                '此帳號已被停用，請聯繫管理員。',
                code='inactive',
            ) 