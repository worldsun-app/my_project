import os
import subprocess
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

def backup_database():
    """備份數據庫"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = 'backup'
    
    # 確保備份目錄存在
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # 執行數據庫備份
    subprocess.run(['python', 'manage.py', 'dbbackup'])
    
    # 上傳備份到 S3
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_S3_REGION_NAME')
    )
    
    bucket_name = os.getenv('AWS_STORAGE_BUCKET_NAME')
    backup_file = f'backup_{timestamp}.json'
    
    try:
        s3_client.upload_file(
            os.path.join(backup_dir, backup_file),
            bucket_name,
            f'backups/{backup_file}'
        )
        print(f'備份成功上傳到 S3: {backup_file}')
    except ClientError as e:
        print(f'上傳備份失敗: {e}')

if __name__ == '__main__':
    backup_database() 