from django import forms

class LoginForm(forms.Form):
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