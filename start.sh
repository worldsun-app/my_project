#!/bin/bash

# 運行數據庫遷移
python migrate.py

# 啟動 Gunicorn 服務器
gunicorn my_project.wsgi:application --bind 0.0.0.0:8080 