#!/usr/bin/env python
import os
import sys
import random
import datetime
from decimal import Decimal

# Необходимо, чтобы импортировать Django-модели
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.contrib.auth.models import User
from django.db import transaction
from wallet.models import Category, Account, Transaction
from django.utils import timezone

# Имя и пароль для демо-пользователя
DEMO_USERNAME = 'qwe2@gmail.com'
DEMO_PASSWORD = 'qwe2@gmail.com'
DEMO_EMAIL = 'qwe2@gmail.com'

# Количество транзакций для генерации
NUM_TRANSACTIONS = 200

# Списки возможных значений
INCOME_CATEGORIES = [
    {'name': 'Зарплата', 'icon': 'briefcase', 'color': '#4CAF50'},
    {'name': 'Фриланс', 'icon': 'code', 'color': '#2196F3'},
    {'name': 'Подарки', 'icon': 'gift', 'color': '#E91E63'},
    {'name': 'Проценты по вкладам', 'icon': 'percent', 'color': '#9C27B0'},
    {'name': 'Возврат долга', 'icon': 'refresh-cw', 'color': '#673AB7'},
]

EXPENSE_CATEGORIES = [
    {'name': 'Продукты', 'icon': 'shopping-cart', 'color': '#F44336'},
    {'name': 'Транспорт', 'icon': 'truck', 'color': '#FF9800'},
    {'name': 'Рестораны', 'icon': 'coffee', 'color': '#795548'},
    {'name': 'Развлечения', 'icon': 'film', 'color': '#FF5722'},
    {'name': 'Здоровье', 'icon': 'activity', 'color': '#00BCD4'},
    {'name': 'Жилье', 'icon': 'home', 'color': '#607D8B'},
    {'name': 'Коммунальные услуги', 'icon': 'zap', 'color': '#FFC107'},
    {'name': 'Одежда', 'icon': 'shopping-bag', 'color': '#9E9E9E'},
    {'name': 'Путешествия', 'icon': 'map', 'color': '#3F51B5'},
    {'name': 'Подписки', 'icon': 'calendar', 'color': '#009688'},
]

ACCOUNT_TYPES = [
    {'name': 'Наличные', 'icon': 'dollar-sign', 'color': '#4CAF50'},
    {'name': 'Дебетовая карта', 'icon': 'credit-card', 'color': '#2196F3'},
    {'name': 'Кредитная карта', 'icon': 'credit-card', 'color': '#F44336'},
    {'name': 'Сбережения', 'icon': 'briefcase', 'color': '#FFC107'},
]

INCOME_COMMENTS = [
    'Зарплата за {month}',
    'Премия за квартал',
    'Возврат налога',
    'Доход от инвестиций',
    'Подработка',
    'Подарок на день рождения',
    'Возврат долга от друга',
    'Продажа ненужных вещей',
    'Кэшбэк',
    'Дивиденды',
]

EXPENSE_COMMENTS = [
    'Продукты в {store}',
    'Обед в кафе',
    'Ужин с друзьями',
    'Проезд на такси',
    'Коммунальные платежи',
    'Подписка на сервис',
    'Покупка одежды',
    'Оплата телефона',
    'Оплата интернета',
    'Лекарства',
    'Спортзал',
    'Развлечения',
    'Подарок для {person}',
    'Книги',
    'Техника',
]

STORES = ['Магнит', 'Пятёрочка', 'Ашан', 'Перекрёсток', 'Лента', 'Метро']
PERSONS = ['мамы', 'папы', 'друга', 'сестры', 'брата', 'коллеги']
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
          'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

def get_random_date(start_date, end_date):
    """Генерирует случайную дату в указанном диапазоне"""
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    return start_date + datetime.timedelta(days=random_days)

def get_comment(type_):
    """Генерирует случайный комментарий для транзакции"""
    if type_ == 'income':
        comment = random.choice(INCOME_COMMENTS)
        if '{month}' in comment:
            comment = comment.format(month=random.choice(MONTHS))
    else:
        comment = random.choice(EXPENSE_COMMENTS)
        if '{store}' in comment:
            comment = comment.format(store=random.choice(STORES))
        elif '{person}' in comment:
            comment = comment.format(person=random.choice(PERSONS))
    return comment

def ensure_categories_exist(user):
    """Проверяет наличие категорий и добавляет отсутствующие"""
    # Получаем существующие категории
    existing_income_categories = list(Category.objects.filter(user=user, type='income'))
    existing_expense_categories = list(Category.objects.filter(user=user, type='expense'))
    
    print(f'Найдено существующих категорий доходов: {len(existing_income_categories)}')
    print(f'Найдено существующих категорий расходов: {len(existing_expense_categories)}')
    
    # Получаем имена существующих категорий для проверки
    existing_income_names = [cat.name for cat in existing_income_categories]
    existing_expense_names = [cat.name for cat in existing_expense_categories]
    
    # Добавляем отсутствующие категории доходов
    new_income_categories = []
    for cat_data in INCOME_CATEGORIES:
        if cat_data['name'] not in existing_income_names:
            category = Category.objects.create(
                name=cat_data['name'],
                type='income',
                icon=cat_data['icon'],
                color=cat_data['color'],
                user=user
            )
            new_income_categories.append(category)
            existing_income_categories.append(category)
            print(f'Создана новая категория доходов: {category.name}')
    
    # Добавляем отсутствующие категории расходов
    new_expense_categories = []
    for cat_data in EXPENSE_CATEGORIES:
        if cat_data['name'] not in existing_expense_names:
            category = Category.objects.create(
                name=cat_data['name'],
                type='expense',
                icon=cat_data['icon'],
                color=cat_data['color'],
                user=user
            )
            new_expense_categories.append(category)
            existing_expense_categories.append(category)
            print(f'Создана новая категория расходов: {category.name}')
    
    print(f'Создано новых категорий доходов: {len(new_income_categories)}')
    print(f'Создано новых категорий расходов: {len(new_expense_categories)}')
    
    return existing_income_categories, existing_expense_categories

def clean_transactions(user):
    """Удаляет все транзакции пользователя"""
    count = Transaction.objects.filter(user=user).count()
    Transaction.objects.filter(user=user).delete()
    print(f"Удалено {count} транзакций пользователя {user.username}")

def reset_account_balances(user):
    """Сбрасывает балансы счетов на ноль"""
    accounts = Account.objects.filter(user=user)
    for account in accounts:
        account.balance = 0
        account.save()
    print(f"Сброшены балансы {accounts.count()} счетов пользователя {user.username}")

@transaction.atomic
def create_demo_user():
    """Создает демо-пользователя с фейковыми данными"""
    print(f'Создаю демо-пользователя: {DEMO_USERNAME}')
    
    # Проверяем, существует ли уже пользователь
    try:
        user = User.objects.get(username=DEMO_USERNAME)
        print(f'Пользователь {DEMO_USERNAME} уже существует, обновляем данные...')
        
        # Очищаем только транзакции и сбрасываем балансы
        clean_transactions(user)
        reset_account_balances(user)
    except User.DoesNotExist:
        # Создаем нового пользователя
        user = User.objects.create_user(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password=DEMO_PASSWORD,
            first_name='Демо',
            last_name='Пользователь'
        )
        print(f'Создан новый пользователь: {user.username} ({user.email})')
    
    # Проверяем и дополняем категории
    income_categories, expense_categories = ensure_categories_exist(user)
    
    # Проверяем наличие счетов, если их нет - создаем
    accounts = list(Account.objects.filter(user=user))
    
    if not accounts:
        print('Счета не найдены, создаем новые...')
        for acc_data in ACCOUNT_TYPES:
            account = Account.objects.create(
                name=acc_data['name'],
                balance=0,
                icon=acc_data['icon'],
                color=acc_data['color'],
                user=user
            )
            accounts.append(account)
        print(f'Создано {len(accounts)} новых счетов')
    else:
        print(f'Найдено {len(accounts)} существующих счетов')
    
    # Генерируем транзакции за последние 6 месяцев
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=180)
    
    print(f'Генерирую {NUM_TRANSACTIONS} транзакций...')
    transactions_to_create = []
    
    # Для поддержания реалистичных балансов
    account_balances = {account.id: Decimal('0.00') for account in accounts}
    
    for _ in range(NUM_TRANSACTIONS):
        # Определяем тип транзакции (с перевесом в сторону расходов)
        is_income = random.random() < 0.35  # 35% доходов, 65% расходов
        type_ = 'income' if is_income else 'expense'
        
        # Выбираем счет и категорию
        account = random.choice(accounts)
        category = random.choice(income_categories if is_income else expense_categories)
        
        # Генерируем сумму
        if is_income:
            amount = round(Decimal(random.uniform(5000, 150000)), 2)
        else:
            amount = round(Decimal(random.uniform(100, 15000)), 2)
        
        # Генерируем дату
        date = get_random_date(start_date, end_date)
        
        # Генерируем комментарий
        comment = get_comment(type_)
        
        # Создаем объект транзакции, но не сохраняем пока
        transaction = Transaction(
            amount=amount,
            type=type_,
            category=category,
            account=account,
            date=date,
            comment=comment,
            user=user
        )
        
        # Обновляем балансы вручную
        if type_ == 'income':
            account_balances[account.id] += amount
        else:
            account_balances[account.id] -= amount
        
        transactions_to_create.append(transaction)
    
    # Создаем все транзакции массово без автоматического пересчета баланса
    Transaction.objects.bulk_create(transactions_to_create)
    print(f'Сгенерировано {len(transactions_to_create)} транзакций')
    
    # Устанавливаем окончательные балансы счетов
    for account in accounts:
        # Не допускаем отрицательные балансы
        balance = max(account_balances[account.id], Decimal('0.00'))
        account.balance = balance
        account.save()
    print(f'Обновлены балансы {len(accounts)} счетов')
    
    # Выводим итоговую информацию
    print('\nИнформация о демо-пользователе:')
    print(f'Логин: {DEMO_USERNAME}')
    print(f'Пароль: {DEMO_PASSWORD}')
    print(f'Имя: {user.first_name} {user.last_name}')
    print(f'Email: {user.email}')
    print('\nСчета:')
    for account in accounts:
        print(f'- {account.name}: {account.balance} ₸')
    
    # Статистика категорий
    income_cat_count = Category.objects.filter(user=user, type='income').count()
    expense_cat_count = Category.objects.filter(user=user, type='expense').count()
    print(f'\nКатегорий доходов: {income_cat_count}')
    print(f'Категорий расходов: {expense_cat_count}')
    
    print('\nГотово! Можно использовать созданного пользователя для демонстрации приложения.')

if __name__ == '__main__':
    create_demo_user() 