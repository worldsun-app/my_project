FROM python:3.11-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製項目文件
COPY . .

# 安裝 Python 依賴
RUN pip install -r requirements.txt

# 創建媒體文件目錄並設置權限
RUN mkdir -p /app/media && chmod 755 /app/media

# 設置環境變量
ENV PYTHONUNBUFFERED=1
ENV DEBUG=0

# 執行遷移腳本和啟動應用
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    python manage.py runserver 0.0.0.0:8000 