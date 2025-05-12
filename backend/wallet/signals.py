from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from decimal import Decimal
from .models import Account, Category

@receiver(post_save, sender=User)
def create_default_user_data(sender, instance, created, **kwargs):
    """
    Создаем стандартные счета и категории для нового пользователя
    """
    if created:
        print(f"Создаем базовые данные для пользователя: {instance.username}")
        create_default_accounts(instance)
        create_default_categories(instance)
        
def create_default_accounts(user):
    """
    Создает стандартные счета для пользователя
    """
    # Проверяем, есть ли у пользователя уже счета
    if Account.objects.filter(user=user).exists():
        print(f"У пользователя {user.username} уже есть счета")
        return
    
    # Создаем стандартные счета
    default_accounts = [
        {
            "name": "Наличные",
            "balance": Decimal('15000.00'),
            "icon": "cash",
            "color": "#10b981"
        },
        {
            "name": "Основная карта",
            "balance": Decimal('42500.00'),
            "icon": "credit-card",
            "color": "#3b82f6"
        }
    ]
    
    created_accounts = []
    try:
        for account_data in default_accounts:
            account = Account.objects.create(
                user=user,
                name=account_data["name"],
                balance=account_data["balance"],
                icon=account_data.get("icon"),
                color=account_data.get("color")
            )
            created_accounts.append(account)
        print(f"Созданы стандартные счета для пользователя {user.username}: {len(created_accounts)}")
    except Exception as e:
        print(f"Ошибка при создании стандартных счетов: {e}")
        
def create_default_categories(user):
    """
    Создает стандартные категории для пользователя
    """
    # Проверяем, есть ли у пользователя уже категории
    if Category.objects.filter(user=user).exists():
        print(f"У пользователя {user.username} уже есть категории")
        return
    
    # Создаем стандартные категории
    default_categories = [
        {
            "name": 'Зарплата',
            "type": 'income',
            "color": '#10b981',
            "icon": 'wallet'
        },
        {
            "name": 'Фриланс',
            "type": 'income',
            "color": '#3b82f6',
            "icon": 'briefcase'
        },
        {
            "name": 'Подарки',
            "type": 'income',
            "color": '#8b5cf6',
            "icon": 'gift'
        },
        {
            "name": 'Инвестиции',
            "type": 'income',
            "color": '#06b6d4',
            "icon": 'trending-up'
        },
        {
            "name": 'Продукты',
            "type": 'expense',
            "color": '#ef4444',
            "icon": 'shopping-cart'
        },
        {
            "name": 'Развлечения',
            "type": 'expense',
            "color": '#f59e0b',
            "icon": 'film'
        },
        {
            "name": 'Транспорт',
            "type": 'expense',
            "color": '#6366f1',
            "icon": 'car'
        },
        {
            "name": 'Коммунальные',
            "type": 'expense',
            "color": '#ec4899',
            "icon": 'home'
        },
        {
            "name": 'Здоровье',
            "type": 'expense',
            "color": '#14b8a6',
            "icon": 'activity'
        },
        {
            "name": 'Кафе и рестораны',
            "type": 'expense',
            "color": '#f97316',
            "icon": 'coffee'
        },
        {
            "name": 'Переводы',
            "type": 'transfer',
            "color": '#000000',
            "icon": 'transfer'
        }
    ]
    
    created_categories = []
    try:
        for category_data in default_categories:
            category = Category.objects.create(
                user=user,
                name=category_data["name"],
                type=category_data["type"],
                icon=category_data.get("icon"),
                color=category_data.get("color")
            )
            created_categories.append(category)
        print(f"Созданы стандартные категории для пользователя {user.username}: {len(created_categories)}")
    except Exception as e:
        print(f"Ошибка при создании стандартных категорий: {e}") 