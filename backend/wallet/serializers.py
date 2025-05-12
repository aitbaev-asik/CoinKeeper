from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Account, Transaction, PeriodSummary

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        read_only_fields = ('id',)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'type', 'icon', 'color', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ('id', 'name', 'balance', 'icon', 'color', 'created_at', 'updated_at')
        read_only_fields = ('id', 'balance', 'created_at', 'updated_at')

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    destination_account_name = serializers.CharField(source='destination_account.name', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = ('id', 'amount', 'type', 'category', 'category_name', 
                 'account', 'account_name', 'destination_account', 'destination_account_name',
                 'date', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('amount', 'type', 'category', 'account', 'destination_account', 'date', 'comment')

    def validate(self, data):
        # Проверка типа транзакции и связанных полей
        transaction_type = data.get('type')
        category = data.get('category')
        account = data.get('account')
        destination_account = data.get('destination_account')
        
        # Проверка для переводов
        if transaction_type == Transaction.TRANSFER:
            if not destination_account:
                raise serializers.ValidationError("Для перевода необходимо указать счёт назначения")
                
            if account == destination_account:
                raise serializers.ValidationError("Счёт источника и счёт назначения должны быть разными")
            
            # Для переводов категория не нужна
            if category:
                data['category'] = None
                
        # Для обычных транзакций destination_account не нужен
        elif transaction_type in [Transaction.INCOME, Transaction.EXPENSE]:
            if destination_account:
                data['destination_account'] = None
                
            # Проверка совместимости категории и типа транзакции
            if category and category.type != transaction_type:
                raise serializers.ValidationError(
                    f"Тип категории должен соответствовать типу транзакции. Ожидался {transaction_type}, получен {category.type}"
                )
        
        return data
    
    def create(self, validated_data):
        # Создаем транзакцию
        return Transaction.objects.create(**validated_data)

class PeriodSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodSummary
        fields = ('id', 'period_type', 'period_key', 'income_amount', 'expense_amount')
        read_only_fields = ('id', 'period_type', 'period_key', 'income_amount', 'expense_amount')

class DashboardSerializer(serializers.Serializer):
    """Сериализатор для отображения данных на дашборде."""
    period = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    # Поле для общей суммы доходов
    income_total = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    # Поле для общей суммы расходов
    expense_total = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Для обратной совместимости сохраняем прежние поля
    income = serializers.SerializerMethodField()
    expense = serializers.SerializerMethodField()

    # Детализация по категориям
    income_categories = serializers.ListField(child=serializers.DictField(), required=False)
    expense_categories = serializers.ListField(child=serializers.DictField(), required=False)
    
    def get_income(self, obj):
        """Возвращает общую сумму доходов для обратной совместимости."""
        # Если в объекте уже есть income_total, используем его
        if hasattr(obj, 'income_total') and obj.income_total is not None:
            return obj.income_total
            
        # Если в объекте есть income и это число, используем его
        if isinstance(obj.get('income'), (int, float, str)):
            try:
                return float(obj.get('income', 0))
            except (ValueError, TypeError):
                pass
                
        # Если income это список категорий, суммируем их
        if isinstance(obj.get('income'), list):
            total = sum(item.get('total', 0) for item in obj.get('income', []))
            return total
            
        # В противном случае возвращаем значение income или 0
        return obj.get('income_total', 0)
    
    def get_expense(self, obj):
        """Возвращает общую сумму расходов для обратной совместимости."""
        # Если в объекте уже есть expense_total, используем его
        if hasattr(obj, 'expense_total') and obj.expense_total is not None:
            return obj.expense_total
            
        # Если в объекте есть expense и это число, используем его
        if isinstance(obj.get('expense'), (int, float, str)):
            try:
                return float(obj.get('expense', 0))
            except (ValueError, TypeError):
                pass
                
        # Если expense это список категорий, суммируем их
        if isinstance(obj.get('expense'), list):
            total = sum(item.get('total', 0) for item in obj.get('expense', []))
            return total
            
        # В противном случае возвращаем значение expense или 0
        return obj.get('expense_total', 0) 