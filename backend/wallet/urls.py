from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'accounts', views.AccountViewSet, basename='account')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'period-summaries', views.PeriodSummaryViewSet, basename='period-summary')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.TransactionViewSet.as_view({'get': 'dashboard'}), name='dashboard'),
    path('public/health-check/', views.HealthCheckView.as_view(), name='health-check'),
] 