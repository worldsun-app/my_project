import os
import subprocess
from datetime import datetime

def backup_database():
    """備份數據庫"""
    backup_dir = 'backup'
    
    # 確保備份目錄存在
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    try:
        # 執行數據庫備份
        subprocess.run(['python', 'manage.py', 'dbbackup'], check=True)
        print('數據庫備份成功')
    except subprocess.CalledProcessError as e:
        print(f'備份失敗: {e}')

if __name__ == '__main__':
    backup_database() 