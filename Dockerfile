FROM python:3.10-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製項目文件
COPY . .

# 收集靜態文件
RUN python manage.py collectstatic --noinput

# 設置環境變量
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=my_project.settings

# 暴露端口
EXPOSE 8080

# 啟動命令
CMD ["gunicorn", "my_project.wsgi:application", "--bind", "0.0.0.0:8080"] 