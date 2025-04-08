import os
import django
import logging
import shutil
from django.core.management import call_command
from django.db import connection

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def delete_migrations():
    """刪除所有遷移文件（除了__init__.py）"""
    apps = ['documents', 'accounts', 'announcements', 'home']
    for app in apps:
        migrations_dir = os.path.join(app, 'migrations')
        if os.path.exists(migrations_dir):
            logger.info(f"清理 {app} 的遷移文件...")
            for filename in os.listdir(migrations_dir):
                if filename != '__init__.py' and filename != '__pycache__':
                    file_path = os.path.join(migrations_dir, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
            logger.info(f"{app} 的遷移文件已清理")

def main():
    try:
        logger.info("開始數據庫遷移...")
        
        # 刪除現有遷移文件
        delete_migrations()
        
        # 檢查數據庫連接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.info("數據庫連接成功！")
        
        # 運行遷移
        logger.info("運行 makemigrations...")
        call_command('makemigrations', '--noinput')
        
        logger.info("運行 migrate...")
        call_command('migrate', '--noinput')
        
        logger.info("遷移完成！")
        
        # 創建超級用戶
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'service@wsgfo.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'wsfost1688')
        
        if not User.objects.filter(username=username).exists():
            logger.info(f"創建超級用戶: {username}")
            User.objects.create_superuser(username=username, email=email, password=password)
            logger.info("超級用戶創建成功！")
        else:
            logger.info("超級用戶已存在")
            
        # 檢查所有必要的表是否已創建
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            logger.info(f"現有數據表: {tables}")
            
    except Exception as e:
        logger.error(f"發生錯誤: {str(e)}")
        logger.error(f"錯誤類型: {type(e)}")
        raise

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
    django.setup()
    main() 