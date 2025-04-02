#!/bin/bash

# 收集靜態文件
python manage.py collectstatic --noinput

# 運行數據庫遷移
python manage.py migrate

# 創建超級用戶（如果不存在）
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell 