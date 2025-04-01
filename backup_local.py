import os
import shutil
from datetime import datetime

def backup_local():
    """備份本地文件和數據庫"""
    # 創建備份目錄
    backup_dir = 'backup'
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # 生成時間戳
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 備份數據庫
    db_file = 'db.sqlite3'
    if os.path.exists(db_file):
        shutil.copy2(db_file, os.path.join(backup_dir, f'db_backup_{timestamp}.sqlite3'))
    
    # 備份 media 目錄
    media_dir = 'media'
    if os.path.exists(media_dir):
        media_backup = os.path.join(backup_dir, f'media_backup_{timestamp}')
        shutil.copytree(media_dir, media_backup)
    
    print(f'備份完成：{timestamp}')

if __name__ == '__main__':
    backup_local() 