FROM python:3.10-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製項目文件
COPY . .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 收集靜態文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8080

# 啟動命令
CMD ["gunicorn", "--bind", ":8080", "my_project.wsgi:application"] 