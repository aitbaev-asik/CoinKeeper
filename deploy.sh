#!/bin/bash

# Скрипт для деплоя приложения CoinCeeper на сервер

set -e

echo "Начинаю деплой CoinCeeper на сервер..."

# Перед запуском убедимся, что есть права на выполнение
chmod +x docker-entrypoint.sh

# Установка пакетов, если они еще не установлены
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null
then
    echo "Устанавливаем Docker и Docker Compose..."
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
fi

# Остановка и удаление старых контейнеров и неиспользуемых образов
echo "Очистка существующих контейнеров..."
docker-compose down --remove-orphans
docker system prune -f

# Обновление репозитория
echo "Получение последней версии кода..."
git pull

# Перезапись файлов настроек, если нужно
if [ ! -f .env ]; then
    echo "Создание .env файла..."
    cp .env.example .env
    # Здесь можно добавить команды для автоматического изменения настроек .env
fi

# Проверка наличия необходимых томов Docker
echo "Проверка томов Docker..."
docker volume inspect postgres-data &>/dev/null || docker volume create postgres-data
docker volume inspect redis-data &>/dev/null || docker volume create redis-data
docker volume inspect static-volume &>/dev/null || docker volume create static-volume
docker volume inspect media-volume &>/dev/null || docker volume create media-volume

# Сборка контейнеров
echo "Сборка контейнеров..."
# Вместо --no-cache используем обычную сборку для экономии времени
docker-compose build

echo "Запуск контейнеров..."
docker-compose up -d

# Проверка статуса контейнеров
echo "Проверка статуса контейнеров..."
docker-compose ps

# Дополнительно смотрим логи на наличие ошибок
echo "Проверка логов контейнеров на наличие ошибок..."
docker-compose logs --tail=20 backend
docker-compose logs --tail=20 frontend

echo "Деплой завершен! Приложение должно быть доступно по адресу http://iot-app.beeline.kz"
echo "Админ-панель доступна по адресу http://iot-app.beeline.kz/api/admin"
echo "Проверить логи можно командой: docker-compose logs -f" 