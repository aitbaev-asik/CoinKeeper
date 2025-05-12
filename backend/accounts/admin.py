from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

# Расширяем стандартный UserAdmin для более удобного отображения
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'last_login', 'is_staff', 'accounts_count')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'email')}),
        ('Разрешения', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )
    
    def accounts_count(self, obj):
        """Показывает количество счетов пользователя"""
        count = obj.accounts.count()
        if count > 0:
            return format_html('<a href="{}?user__id__exact={}">{} счетов</a>', 
                               '/admin/wallet/account/', obj.id, count)
        return "0 счетов"
    accounts_count.short_description = "Счета"

# Переопределяем стандартный UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
