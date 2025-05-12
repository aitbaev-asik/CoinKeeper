from django.contrib import admin
from .models import Category, Account, Transaction, PeriodSummary
from django.utils.html import format_html
from django.db.models import Sum
from django.urls import reverse
from django.utils.safestring import mark_safe

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'icon', 'color_display', 'user', 'created_at')
    list_filter = ('type', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'user')
        }),
        ('Визуальное оформление', {
            'fields': ('icon', 'color')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def color_display(self, obj):
        if obj.color:
            return format_html(
                '<span style="background-color: {}; width: 20px; height: 20px; display: inline-block; border-radius: 4px;"></span> {}',
                obj.color, obj.color
            )
        return "-"
    color_display.short_description = "Цвет"

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance_display', 'icon', 'color_display', 'user', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'balance', 'user')
        }),
        ('Визуальное оформление', {
            'fields': ('icon', 'color')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def balance_display(self, obj):
        if obj.balance >= 0:
            return format_html('<span style="color: green;">{} ₸</span>', obj.balance)
        return format_html('<span style="color: red;">{} ₸</span>', obj.balance)
    balance_display.short_description = "Баланс"
    
    def color_display(self, obj):
        if obj.color:
            return format_html(
                '<span style="background-color: {}; width: 20px; height: 20px; display: inline-block; border-radius: 4px;"></span> {}',
                obj.color, obj.color
            )
        return "-"
    color_display.short_description = "Цвет"

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'amount_display', 'type', 'category_link', 'account_link', 
                    'destination_account_link', 'date', 'user', 'created_at')
    list_filter = ('type', 'date', 'user', 'category')
    search_fields = ('comment', 'user__username', 'category__name', 'account__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('amount', 'type', 'category', 'date', 'user')
        }),
        ('Счета', {
            'fields': ('account', 'destination_account')
        }),
        ('Дополнительно', {
            'fields': ('comment',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def amount_display(self, obj):
        if obj.type == 'income':
            return format_html('<span style="color: green;">+{} ₸</span>', obj.amount)
        elif obj.type == 'expense':
            return format_html('<span style="color: red;">-{} ₸</span>', obj.amount)
        return format_html('<span style="color: blue;">{} ₸</span>', obj.amount)
    amount_display.short_description = "Сумма"
    
    def category_link(self, obj):
        if obj.category:
            url = reverse('admin:wallet_category_change', args=[obj.category.id])
            return mark_safe(f'<a href="{url}">{obj.category.name}</a>')
        return "-"
    category_link.short_description = "Категория"
    
    def account_link(self, obj):
        url = reverse('admin:wallet_account_change', args=[obj.account.id])
        return mark_safe(f'<a href="{url}">{obj.account.name}</a>')
    account_link.short_description = "Счет"
    
    def destination_account_link(self, obj):
        if obj.destination_account:
            url = reverse('admin:wallet_account_change', args=[obj.destination_account.id])
            return mark_safe(f'<a href="{url}">{obj.destination_account.name}</a>')
        return "-"
    destination_account_link.short_description = "Счет назначения"

@admin.register(PeriodSummary)
class PeriodSummaryAdmin(admin.ModelAdmin):
    list_display = ('period_type', 'period_key', 'income_amount_display', 'expense_amount_display', 
                    'balance_display', 'user', 'updated_at')
    list_filter = ('period_type', 'user')
    search_fields = ('period_key', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Период', {
            'fields': ('period_type', 'period_key', 'user')
        }),
        ('Финансовые показатели', {
            'fields': ('income_amount', 'expense_amount')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def income_amount_display(self, obj):
        return format_html('<span style="color: green;">+{} ₸</span>', obj.income_amount)
    income_amount_display.short_description = "Доход"
    
    def expense_amount_display(self, obj):
        return format_html('<span style="color: red;">-{} ₸</span>', obj.expense_amount)
    expense_amount_display.short_description = "Расход"
    
    def balance_display(self, obj):
        balance = obj.income_amount - obj.expense_amount
        if balance >= 0:
            return format_html('<span style="color: green;">{} ₸</span>', balance)
        return format_html('<span style="color: red;">{} ₸</span>', balance)
    balance_display.short_description = "Баланс"

# Настройка заголовка админ-панели
admin.site.site_header = "Административная панель CoinCeeper"
admin.site.site_title = "CoinCeeper Admin"
admin.site.index_title = "Управление финансами"
