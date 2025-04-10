import os
import django
import logging
import shutil
from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db import DEFAULT_DB_ALIAS

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

def reset_database():
    """重置數據庫並重新創建所有表"""
    try:
        with connection.cursor() as cursor:
            # 獲取所有表名
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            # 刪除所有表
            for table in tables:
                logger.info(f"刪除表: {table}")
                cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
            
            # 刪除所有遷移記錄
            cursor.execute("DELETE FROM django_migrations")
            
            logger.info("數據庫已重置")
            
    except Exception as e:
        logger.error(f"重置數據庫時發生錯誤: {str(e)}")
        raise

def check_and_fix_database():
    """檢查並修復數據庫表結構"""
    try:
        with connection.cursor() as cursor:
            # 檢查 documents_insurancedocument 表是否存在
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'documents_insurancedocument'
                )
            """)
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                logger.info("documents_insurancedocument 表不存在，將通過遷移創建")
                return
            
            # 檢查 documents_insurancedocument 表的列
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = 'documents_insurancedocument'
            """)
            columns = [row[0] for row in cursor.fetchall()]
            logger.info(f"documents_insurancedocument 表的列: {columns}")
            
            # 如果缺少 auto_category 列，添加它
            if 'auto_category' not in columns:
                logger.info("添加 auto_category 列...")
                try:
                    cursor.execute("""
                        ALTER TABLE documents_insurancedocument 
                        ADD COLUMN auto_category VARCHAR(50) DEFAULT ''
                    """)
                    logger.info("auto_category 列已添加")
                except Exception as e:
                    logger.error(f"添加 auto_category 列時發生錯誤: {str(e)}")
                    raise
                
    except Exception as e:
        logger.error(f"檢查和修復數據庫時發生錯誤: {str(e)}")
        raise

def main():
    logger.info("開始數據庫遷移...")
    
    try:
        # 設置 Django 環境
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
        django.setup()
        
        # 檢查數據庫連接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.info("數據庫連接成功！")
        
        # 刪除現有遷移文件
        delete_migrations()
        
        # 重置數據庫
        reset_database()
        
        # 運行 makemigrations
        logger.info("運行 makemigrations...")
        call_command('makemigrations', '--noinput')
        
        # 運行遷移
        logger.info("運行 migrate...")
        call_command('migrate', '--noinput')
        
        # 檢查並修復數據庫表結構
        check_and_fix_database()
        
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
        logger.error(f"遷移過程中發生錯誤: {str(e)}")
        raise

if __name__ == "__main__":
    main() 