import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# 創建超級用戶
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'service@wsgfo.com', 'wsfost1688')
    print('超級用戶創建成功！')
else:
    print('超級用戶已存在！') 