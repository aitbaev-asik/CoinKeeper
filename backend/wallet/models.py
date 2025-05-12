from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
import datetime

class Category(models.Model):
    INCOME = 'income'
    EXPENSE = 'expense'
    TYPE_CHOICES = [
        (INCOME, 'Income'),
        (EXPENSE, 'Expense'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=7, blank=True, null=True)  # Hex color code
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ['name', 'user', 'type']

    def __str__(self):
        return f"{self.name} ({self.type})"

class Account(models.Model):
    name = models.CharField(max_length=100)
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=7, blank=True, null=True)  # Hex color code
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.balance}"

class Transaction(models.Model):
    INCOME = 'income'
    EXPENSE = 'expense'
    TRANSFER = 'transfer'  # Добавляем новый тип - перевод между счетами
    TYPE_CHOICES = [
        (INCOME, 'Income'),
        (EXPENSE, 'Expense'),
        (TRANSFER, 'Transfer'),  # Добавляем новый тип в список выбора
    ]

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    # Добавляем счет назначения для переводов
    destination_account = models.ForeignKey(
        Account, 
        on_delete=models.CASCADE, 
        related_name='incoming_transfers',
        null=True, 
        blank=True
    )
    date = models.DateField()
    comment = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.type == self.TRANSFER:
            dest_account_name = self.destination_account.name if self.destination_account else 'Неизвестно'
            return f"Перевод - {self.amount} ({self.account.name} → {dest_account_name})"
        else:
            category_name = self.category.name if self.category else 'Без категории'
            return f"{self.type} - {self.amount} ({category_name})"

    def save(self, *args, **kwargs):
        is_new = not self.pk
        
        if is_new:  # Новая транзакция
            self._handle_new_transaction()
        else:  # Обновление существующей транзакции
            self._handle_update_transaction()
        
        super().save(*args, **kwargs)

        # Обновляем периодические итоги (только для доходов и расходов)
        if self.type != self.TRANSFER:
            update_period_summary(self.user, self.date, self.type, self.amount, is_new=is_new)

    def _handle_new_transaction(self):
        """Обрабатывает логику баланса для новой транзакции"""
        if self.type == self.INCOME:
            self.account.balance += self.amount
            self.account.save()
        elif self.type == self.EXPENSE:
            self.account.balance -= self.amount
            self.account.save()
        elif self.type == self.TRANSFER and self.destination_account:
            # Для переводов уменьшаем баланс исходного счета
            self.account.balance -= self.amount
            self.account.save()
            
            # И увеличиваем баланс счета назначения
            self.destination_account.balance += self.amount
            self.destination_account.save()

    def _handle_update_transaction(self):
        """Обрабатывает логику изменения существующей транзакции"""
        old_transaction = Transaction.objects.get(pk=self.pk)
        
        # Отменяем эффект старой транзакции
        if old_transaction.type == self.INCOME:
            old_transaction.account.balance -= old_transaction.amount
            old_transaction.account.save()
        elif old_transaction.type == self.EXPENSE:
            old_transaction.account.balance += old_transaction.amount
            old_transaction.account.save()
        elif old_transaction.type == self.TRANSFER and old_transaction.destination_account:
            # Возвращаем деньги на исходный счет
            old_transaction.account.balance += old_transaction.amount
            old_transaction.account.save()
            
            # И снимаем со счета назначения
            old_transaction.destination_account.balance -= old_transaction.amount
            old_transaction.destination_account.save()
        
        # Применяем новую транзакцию
        self._handle_new_transaction()

    def delete(self, *args, **kwargs):
        if self.type == self.INCOME:
            self.account.balance -= self.amount
            self.account.save()
        elif self.type == self.EXPENSE:
            self.account.balance += self.amount
            self.account.save()
        elif self.type == self.TRANSFER and self.destination_account:
            # Возврат средств при удалении перевода
            self.account.balance += self.amount
            self.account.save()
            
            self.destination_account.balance -= self.amount
            self.destination_account.save()
        
        # Обновляем периодические итоги при удалении (только для доходов и расходов)
        if self.type != self.TRANSFER:
            update_period_summary(self.user, self.date, self.type, self.amount, is_delete=True)
        
        super().delete(*args, **kwargs)

class PeriodSummary(models.Model):
    """Модель для хранения суммарных данных по периодам"""
    DAILY = 'daily'
    MONTHLY = 'monthly'
    YEARLY = 'yearly'
    PERIOD_CHOICES = [
        (DAILY, 'Daily'),
        (MONTHLY, 'Monthly'),
        (YEARLY, 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='period_summaries')
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    
    # Для daily: 2023-05-15, для monthly: 2023-05, для yearly: 2023
    period_key = models.CharField(max_length=10)
    
    # Суммы доходов и расходов за период
    income_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    expense_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Дата создания и обновления для отслеживания изменений
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'period_type', 'period_key']
        verbose_name_plural = "Period Summaries"
    
    @staticmethod
    def get_period_key(date, period_type):
        """Получить ключ периода для указанной даты и типа периода"""
        if period_type == PeriodSummary.DAILY:
            return date.strftime('%Y-%m-%d')
        elif period_type == PeriodSummary.MONTHLY:
            return date.strftime('%Y-%m')
        elif period_type == PeriodSummary.YEARLY:
            return date.strftime('%Y')
        return None
    
    def __str__(self):
        return f"{self.period_type} summary for {self.period_key}: Income {self.income_amount}, Expense {self.expense_amount}"

def update_period_summary(user, date, transaction_type, amount, is_new=True, is_delete=False):
    """
    Обновляет суммарные данные по периодам при добавлении/изменении/удалении транзакции
    
    Args:
        user: Пользователь, которому принадлежит транзакция
        date: Дата транзакции
        transaction_type: Тип транзакции (income/expense)
        amount: Сумма транзакции
        is_new: Флаг, указывающий, что транзакция новая (не обновление)
        is_delete: Флаг, указывающий на удаление транзакции
    """
    # Обновляем все типы периодов (день, месяц, год)
    for period_type in [PeriodSummary.DAILY, PeriodSummary.MONTHLY, PeriodSummary.YEARLY]:
        period_key = PeriodSummary.get_period_key(date, period_type)
        
        # Получаем или создаем запись итогов для периода
        summary, created = PeriodSummary.objects.get_or_create(
            user=user,
            period_type=period_type,
            period_key=period_key,
            defaults={
                'income_amount': Decimal('0'),
                'expense_amount': Decimal('0')
            }
        )
        
        # Обновляем суммы в зависимости от типа операции
        if transaction_type == Transaction.INCOME:
            if is_delete:
                summary.income_amount -= amount
            else:
                summary.income_amount += amount
        else:  # EXPENSE
            if is_delete:
                summary.expense_amount -= amount
            else:
                summary.expense_amount += amount
        
        # Сохраняем изменения
        summary.save()
