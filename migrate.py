import os
import django
import logging
from django.core.management import call_command
from django.db import connection

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("開始數據庫遷移...")
    
    try:
        # 設置環境變量
        os.environ['DATABASE_URL'] = 'postgresql://root:nTVHdED7kehY1pBg30f5L8c9y4KoS6F2@hnd1.clusters.zeabur.com:30596/zeabur'
        os.environ['DB_HOST'] = 'hnd1.clusters.zeabur.com'
        os.environ['DB_PORT'] = '30596'
        
        # 設置 Django 環境
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
        django.setup()
        
        # 檢查數據庫連接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.info("數據庫連接成功！")
        
        # 運行 makemigrations
        logger.info("運行 makemigrations...")
        call_command('makemigrations', '--noinput')
        
        # 運行遷移
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
            
    except Exception as e:
        logger.error(f"遷移過程中發生錯誤: {str(e)}")
        raise

if __name__ == "__main__":
    main() 