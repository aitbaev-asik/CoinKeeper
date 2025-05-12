#!/bin/bash

set -e

# Ожидаем, пока база данных станет доступной
echo "Waiting for PostgreSQL..."
# Счетчик попыток подключения
attempt=0
max_attempts=60

# Проверка доступности PostgreSQL
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; do
    attempt=$((attempt+1))
    echo "PostgreSQL is unavailable - sleeping (attempt $attempt of $max_attempts)"
    
    if [ $attempt -ge $max_attempts ]; then
        echo "Max attempts reached, continuing anyway..."
        break
    fi
    
    sleep 2
done

# Вторая проверка - пытаемся подключиться и выполнить запрос
echo "Testing database connection..."
attempt=0
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\l' > /dev/null 2>&1; do
    attempt=$((attempt+1))
    echo "Connection test failed - sleeping (attempt $attempt of 15)"
    
    if [ $attempt -ge 15 ]; then
        echo "Max attempts reached for connection test, continuing anyway..."
        break
    fi
    
    sleep 2
done

echo "PostgreSQL is up - continuing..."

# Применяем миграции с отладочной информацией
echo "Running migrations..."
python manage.py migrate --noinput

# Собираем статические файлы
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Создаем суперпользователя, если он не существует
echo "Checking superuser..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth.models import User
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
if username and email and password:
    if not User.objects.filter(username=username).exists():
        print('Creating superuser...')
        User.objects.create_superuser(username, email, password)
        print('Superuser created successfully!')
    else:
        print('Superuser already exists.')
else:
    print('Superuser environment variables not set. Skipping superuser creation.')
"

# Проверка здоровья системы перед запуском
echo "Performing health check..."
python -c "
import os
import django
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    django.setup()
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute('SELECT 1')
    print('Database connection: OK')
    print('Django setup: OK')
except Exception as e:
    print(f'Health check failed: {str(e)}')
    if 'DOCKER_ENTRYPOINT_SKIP_FAIL' not in os.environ:
        sys.exit(1)
    print('Continuing despite health check failure due to DOCKER_ENTRYPOINT_SKIP_FAIL being set')
"

echo "Startup complete, running command: $@"
exec "$@" 