# Импортируем функцию для создания приложения Celery
from .celery import app as celery_app

# Делаем объект celery_app доступным при импорте из этого модуля
__all__ = ('celery_app',)
