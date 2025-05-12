from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta, datetime, date
from dateutil.relativedelta import relativedelta
from calendar import monthrange
from .models import Category, Account, Transaction, PeriodSummary
from .serializers import (
    CategorySerializer, AccountSerializer, 
    TransactionSerializer, TransactionCreateSerializer,
    PeriodSummarySerializer, DashboardSerializer
)

# Create your views here.

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Фильтрация по дате
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Фильтрация по типу
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        
        # Фильтрация по категории
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Фильтрация по счету (учитываем как исходящие, так и входящие переводы)
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(
                Q(account_id=account_id) | 
                Q(destination_account_id=account_id)
            )

        return queryset.order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def transfer(self, request):
        """Специальный endpoint для создания транзакций перевода между счетами"""
        serializer = TransactionCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Устанавливаем тип транзакции как перевод, если не указан 
            if 'type' not in serializer.validated_data:
                serializer.validated_data['type'] = Transaction.TRANSFER
                
            # Проверяем, что указан счет назначения
            if 'destination_account' not in serializer.validated_data or not serializer.validated_data['destination_account']:
                return Response(
                    {"error": "Для перевода необходимо указать счёт назначения"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Сохраняем транзакцию
            transaction = serializer.save(user=request.user)
            return Response(
                TransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        # Получаем период для статистики
        period = request.query_params.get('period', 'month')
        start_date, end_date = get_date_range(period)
        
        # Получаем статистику по категориям
        categories_stats = Transaction.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        ).values(
            'category__name',
            'type'
        ).annotate(
            total=Sum('amount')
        ).order_by('type', '-total')

        # Форматируем статистику
        income_stats = []
        expense_stats = []
        for stat in categories_stats:
            if not stat['category__name']:
                continue  # Пропускаем транзакции без категории
                
            if stat['type'] == 'income':
                income_stats.append({
                    'category': stat['category__name'],
                    'total': float(stat['total'])
                })
            else:
                expense_stats.append({
                    'category': stat['category__name'],
                    'total': float(stat['total'])
                })

        return Response({
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'income': income_stats,
            'expense': expense_stats
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        API для дашборда, возвращает итоговые суммы доходов и расходов за период,
        а также разбивку по категориям.
        По умолчанию период - текущий месяц.
        """
        # Получаем тип периода из параметров запроса
        period = request.query_params.get('period', 'month')
        format_type = request.query_params.get('format', 'full')  # Добавляем параметр для выбора формата
        
        # Получаем начальную и конечную даты периода
        start_date, end_date = get_date_range(period)
        
        # Для периода 'custom' используем предоставленные даты
        if period == 'custom':
            start_date_param = request.query_params.get('start_date')
            end_date_param = request.query_params.get('end_date')
            
            if start_date_param and end_date_param:
                try:
                    start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {"error": "Invalid date format. Use YYYY-MM-DD."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "For custom period, both start_date and end_date are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Получаем суммы из таблицы PeriodSummary
        income_amount, expense_amount = get_period_totals(request.user, start_date, end_date)
        
        if format_type == 'simple':
            # Возвращаем только общие суммы (для обратной совместимости)
            response_data = {
                'period': period,
                'income_total': income_amount,
                'expense_total': expense_amount,
                'start_date': start_date,
                'end_date': end_date
            }
        else:
            # Получаем статистику по категориям
            transactions = Transaction.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date
            )
            
            # Группируем по категориям и типу
            income_categories = []
            expense_categories = []
            
            # Группировка по категориям для доходов
            income_by_category = transactions.filter(
                type=Transaction.INCOME
            ).values(
                'category__name'
            ).annotate(
                total=Sum('amount')
            ).order_by('-total')
            
            for category in income_by_category:
                if category['category__name']:
                    income_categories.append({
                        'category': category['category__name'],
                        'total': float(category['total'])
                    })
            
            # Группировка по категориям для расходов
            expense_by_category = transactions.filter(
                type=Transaction.EXPENSE
            ).values(
                'category__name'
            ).annotate(
                total=Sum('amount')
            ).order_by('-total')
            
            for category in expense_by_category:
                if category['category__name']:
                    expense_categories.append({
                        'category': category['category__name'],
                        'total': float(category['total'])
                    })
            
            # Формируем полный ответ с детализацией
            response_data = {
                'period': period,
                'income_total': income_amount,
                'expense_total': expense_amount,
                'income_categories': income_categories,
                'expense_categories': expense_categories,
                'start_date': start_date,
                'end_date': end_date
            }
        
        return Response(DashboardSerializer(response_data).data)

class PeriodSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """API для просмотра итогов по периодам"""
    serializer_class = PeriodSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PeriodSummary.objects.filter(user=self.request.user)
        
        # Фильтрация по типу периода
        period_type = self.request.query_params.get('period_type')
        if period_type:
            queryset = queryset.filter(period_type=period_type)
        
        # Фильтрация по ключу периода
        period_key = self.request.query_params.get('period_key')
        if period_key:
            queryset = queryset.filter(period_key=period_key)
        
        return queryset.order_by('-period_key')

def get_date_range(period_type):
    """
    Получает диапазон дат для указанного типа периода
    
    Args:
        period_type: Тип периода ('today', 'week', 'month', 'quarter', 'year', 'all')
    
    Returns:
        tuple: (start_date, end_date)
    """
    today = date.today()
    
    if period_type == 'today':
        return today, today
    
    elif period_type == 'week':
        # Начало текущей недели (понедельник)
        start_date = today - timedelta(days=today.weekday())
        return start_date, today
    
    elif period_type == 'month':
        # Начало текущего месяца
        start_date = date(today.year, today.month, 1)
        return start_date, today
    
    elif period_type == 'quarter':
        # Начало текущего квартала
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        start_date = date(today.year, quarter_start_month, 1)
        return start_date, today
    
    elif period_type == 'year':
        # Начало текущего года
        start_date = date(today.year, 1, 1)
        return start_date, today
    
    elif period_type == 'all':
        # Все время (используем очень старую дату)
        start_date = date(2000, 1, 1)
        return start_date, today
    
    # По умолчанию - текущий месяц
    start_date = date(today.year, today.month, 1)
    return start_date, today

def get_period_totals(user, start_date, end_date):
    """
    Получает суммы доходов и расходов за указанный период
    
    Args:
        user: Пользователь
        start_date: Начальная дата периода
        end_date: Конечная дата периода
        
    Returns:
        tuple: (income_amount, expense_amount)
    """
    # Для оптимизации мы попробуем использовать предварительно рассчитанные суммы из PeriodSummary
    # Но нужно учесть, что период может не совпадать с предопределенными периодами
    
    # Проверяем, совпадает ли период с месяцем
    income_amount = 0
    expense_amount = 0
    
    # Пытаемся использовать суммы по месяцам
    if start_date.day == 1 and end_date.day == monthrange(end_date.year, end_date.month)[1] and start_date.month == end_date.month:
        # Это полный месяц
        period_key = PeriodSummary.get_period_key(start_date, PeriodSummary.MONTHLY)
        summary = PeriodSummary.objects.filter(
            user=user,
            period_type=PeriodSummary.MONTHLY,
            period_key=period_key
        ).first()
        
        if summary:
            return summary.income_amount, summary.expense_amount
    
    # Если не удалось использовать предварительно рассчитанные суммы, считаем из транзакций
    # Получаем все дневные итоги за указанный период
    daily_summaries = PeriodSummary.objects.filter(
        user=user,
        period_type=PeriodSummary.DAILY,
        period_key__gte=start_date.strftime('%Y-%m-%d'),
        period_key__lte=end_date.strftime('%Y-%m-%d')
    )
    
    if daily_summaries.exists():
        # Суммируем итоги из дневных записей
        income_totals = daily_summaries.aggregate(total=Sum('income_amount'))
        expense_totals = daily_summaries.aggregate(total=Sum('expense_amount'))
        
        income_amount = income_totals['total'] or 0
        expense_amount = expense_totals['total'] or 0
    else:
        # Если нет дневных итогов, считаем напрямую из транзакций
        income_transactions = Transaction.objects.filter(
            user=user,
            type=Transaction.INCOME,
            date__gte=start_date,
            date__lte=end_date
        )
        
        expense_transactions = Transaction.objects.filter(
            user=user,
            type=Transaction.EXPENSE,
            date__gte=start_date,
            date__lte=end_date
        )
        expense_transactions = Transaction.objects.filter(
            user=user
        )
        
        income_amount = income_transactions.aggregate(total=Sum('amount'))['total'] or 0
        expense_amount = expense_transactions.aggregate(total=Sum('amount'))['total'] or 0
    
    return income_amount, expense_amount


class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok"})