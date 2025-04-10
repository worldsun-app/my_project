#!/bin/bash

# 設置錯誤處理
set -e

# 創建日誌目錄
mkdir -p logs

# 運行數據庫遷移並記錄日誌
echo "開始運行數據庫遷移..."
python migrate.py 2>&1 | tee logs/migration.log

# 檢查遷移是否成功
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "數據庫遷移失敗，請檢查 logs/migration.log"
    exit 1
fi

echo "數據庫遷移成功，開始啟動服務器..."

# 啟動 Gunicorn 服務器並記錄日誌
gunicorn my_project.wsgi:application \
    --bind 0.0.0.0:8080 \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --capture-output \
    --enable-stdio-inheritance 