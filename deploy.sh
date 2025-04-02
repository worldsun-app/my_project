#!/bin/bash

# 確保腳本在錯誤時停止
set -e

# 等待數據庫就緒
echo "Waiting for database to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "Database is ready!"

# 收集靜態文件
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 運行數據庫遷移
echo "Running database migrations..."
python manage.py migrate

# 創建超級用戶（如果不存在）
echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"

echo "Deployment completed successfully!" 