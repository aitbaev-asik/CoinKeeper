# CoinCeeper - Приложение для управления финансами

CoinCeeper - это современное веб-приложение для управления личными финансами, отслеживания доходов и расходов, создания бюджетов и анализа финансового состояния.

## Технологии

### Бэкенд
- Django 4.2
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- JWT аутентификация

### Фронтенд
- React.js
- Redux Toolkit
- Material UI
- Tailwind CSS
- Chart.js / Recharts для визуализации

## Структура проекта

```
project/
├── backend/              # Django бэкенд
│   ├── accounts/         # Приложение для управления пользователями
│   ├── wallet/           # Приложение для управления финансами
│   └── core/             # Основные настройки Django
├── frontend/             # React фронтенд
│   ├── public/           # Статические файлы
│   └── src/              # Исходный код React
├── docker-compose.yml    # Настройки Docker Compose
├── Dockerfile.backend    # Dockerfile для бэкенда
└── Dockerfile.frontend   # Dockerfile для фронтенда
```

## Запуск проекта

### Предварительные требования
- Docker и Docker Compose
- Git

### Шаги для запуска

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/coinceeper.git
cd coinceeper
```

2. Создайте файл .env в корне проекта:
```bash
# Скопируйте содержимое из файла .env.example
cp .env.example .env
# Отредактируйте .env файл, установив свои значения для переменных окружения
```

3. Запустите проект с помощью Docker Compose:
```bash
docker-compose up -d
```

4. Проект будет доступен по следующим адресам:
   - Фронтенд: http://localhost:5173
   - Бэкенд API: http://localhost:8009/api
   - Админ-панель Django: http://localhost:8009/admin

## Разработка

### Запуск в режиме разработки

1. Запустите только базу данных и Redis:
```bash
docker-compose up -d db redis
```

2. Запустите бэкенд локально:
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

3. Запустите фронтенд локально:
```bash
cd frontend
npm install
npm run dev
```

## Деплой на сервер с IP 20.52.179.99

1. Клонируйте репозиторий на сервер:
```bash
git clone https://github.com/yourusername/coinceeper.git
cd coinceeper
```

2. Создайте и настройте файл .env:
```bash
cp .env.example .env
# Отредактируйте .env, установив безопасные пароли и соответствующие настройки
```

3. Установите Docker и Docker Compose, если они еще не установлены:
```bash
# Для Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

4. Запустите проект:
```bash
docker-compose up -d
```

5. Проект будет доступен по следующим адресам:
   - Фронтенд: http://20.52.179.99:5173
   - Бэкенд API: http://20.52.179.99:8009/api
   - Админ-панель Django: http://20.52.179.99:8009/admin

6. Настройте файрвол (если необходимо):
```bash
# Для Ubuntu/Debian с UFW
sudo ufw allow 5173/tcp
sudo ufw allow 8009/tcp
```

## Команда

- Разработка: [Ваше имя]
- Дизайн: [Имя дизайнера]

## Лицензия

Этот проект распространяется под лицензией MIT License. См. файл LICENSE для получения дополнительной информации. 