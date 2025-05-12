import os
from celery import Celery

# Установка переменной окружения для настроек Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Создание экземпляра приложения Celery
app = Celery('core')

# Загрузка настроек из Django settings, префикс CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автозагрузка задач из всех зарегистрированных приложений Django
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 