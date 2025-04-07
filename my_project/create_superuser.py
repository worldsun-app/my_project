import os
from django.contrib.auth import get_user_model
from django.db import connection

def create_superuser():
    User = get_user_model()
    
    # 检查数据库表结构
    with connection.cursor() as cursor:
        # 获取所有非空字段
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'accounts_customuser' 
            AND is_nullable = 'NO'
            AND column_name NOT IN ('id', 'password', 'last_login', 'is_superuser', 'username', 'email', 'is_staff', 'is_active', 'date_joined')
        """)
        non_nullable_columns = [row[0] for row in cursor.fetchall()]
        
        # 将所有非空字段设置为可空
        for column in non_nullable_columns:
            cursor.execute(f"""
                ALTER TABLE accounts_customuser 
                ALTER COLUMN {column} DROP NOT NULL
            """)
    
    # 获取超级用户设置
    DJANGO_SUPERUSER_USERNAME = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    DJANGO_SUPERUSER_EMAIL = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'service@wsgfo.com')
    DJANGO_SUPERUSER_PASSWORD = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'wsfost1688')
    
    if not User.objects.filter(username=DJANGO_SUPERUSER_USERNAME).exists():
        User.objects.create_superuser(
            username=DJANGO_SUPERUSER_USERNAME,
            email=DJANGO_SUPERUSER_EMAIL,
            password=DJANGO_SUPERUSER_PASSWORD
        )
        print(f"超級用戶 {DJANGO_SUPERUSER_USERNAME} 已創建")
    else:
        print(f"超級用戶 {DJANGO_SUPERUSER_USERNAME} 已存在") 