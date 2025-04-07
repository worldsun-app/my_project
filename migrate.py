import os
import django
from django.core.management import call_command

def main():
    print("開始數據庫遷移...")
    
    # 運行遷移
    call_command('migrate', '--noinput')
    
    print("遷移完成！")
    
    # 創建超級用戶
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'service@wsgfo.com')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'wsfost1688')
    
    if not User.objects.filter(username=username).exists():
        print(f"創建超級用戶: {username}")
        User.objects.create_superuser(username=username, email=email, password=password)
        print("超級用戶創建成功！")
    else:
        print("超級用戶已存在")

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
    django.setup()
    main() 