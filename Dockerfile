FROM python:3.11-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# 複製項目文件
COPY . .

# 安裝 Python 依賴
RUN pip install -r requirements.txt

# 創建媒體文件目錄並設置權限
RUN mkdir -p /app/media && chmod 755 /app/media

# 配置Nginx
RUN rm /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-enabled/
RUN mkdir -p /run/nginx

# 設置環境變量
ENV PYTHONUNBUFFERED=1
ENV DEBUG=0
ENV PORT=8000

# 執行遷移腳本和啟動應用
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn my_project.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 & \
    nginx -g 'daemon off;' 