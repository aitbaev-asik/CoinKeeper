import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowUpRight, FiArrowDownLeft, FiDollarSign, FiRefreshCw, FiDatabase } from 'react-icons/fi';
import TransactionList from '../components/transactions/TransactionList';
import AccountCards from '../components/dashboard/AccountCards';
import RecentActivity from '../components/dashboard/RecentActivity';
import { openTransactionModal, openAccountModal } from '../store/slices/uiSlice';
import { fetchTransactions, fetchStatistics } from '../store/slices/transactionsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items: transactions = [], loading: transLoading, error: transError } = useSelector(state => state.transactions || { items: [], loading: false, error: null });
  const { items: categories = [], loading: catLoading, error: catError } = useSelector(state => state.categories || { items: [], loading: false, error: null });
  const dashboardData = useSelector(state => state.dashboard || { income: 0, expense: 0, loading: false });
  
  console.log('Dashboard: состояние транзакций из хранилища:', {
    transactionsCount: transactions?.length || 0,
    isArray: Array.isArray(transactions),
    loading: transLoading,
    error: transError,
  });
  
  console.log('Dashboard: состояние дашборда из хранилища:', dashboardData);
  
  const loading = transLoading || catLoading || dashboardData.loading;
  const error = transError || catError || dashboardData.error;
  
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState({
    transactions: false,
    categories: false,
    statistics: false,
    dashboard: false
  });

  // Инициализируем категории и транзакции при первой загрузке
  const initializeData = useCallback(async () => {
    console.log('Dashboard: инициализация данных (безопасная версия)');
    try {
      // Загружаем категории
      console.log('Dashboard: загрузка категорий');
      dispatch(fetchCategories());
      
      // Загружаем транзакции
      console.log('Dashboard: загрузка транзакций');
      dispatch(fetchTransactions());
      
      // Загружаем статистику
      console.log('Dashboard: загрузка статистики');
      dispatch(fetchStatistics());
      
      // Загружаем данные дашборда (всегда за месяц)
      console.log('Dashboard: загрузка данных дашборда за месяц');
      dispatch(fetchDashboardData({ period: 'month' }));
    } catch (error) {
      console.error('Ошибка при инициализации данных:', error);
    }
  }, [dispatch]);

  // Используем useEffect для вызова функции инициализации
  useEffect(() => {
    console.log('Dashboard: Компонент смонтирован');
    initializeData();
  }, [initializeData, retryCount]);

  // Обработчик для повторной загрузки данных
  const handleRetry = () => {
    console.log('Dashboard: Повторная загрузка данных');
    setRetryCount(prev => prev + 1);
  };
  
  // Обновляем данные о последних транзакциях
  useEffect(() => {    
    // Получение последних транзакций
    if (Array.isArray(transactions) && transactions.length > 0) {
      const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
        
      setRecentTransactions(recent);
    }
  }, [transactions]);
  
  // Обработчик добавления транзакции
  const handleAddTransaction = (type, accountId) => {
    dispatch(openTransactionModal({ type, accountId }));
  };
  
  // Обработчик добавления счета
  const handleAddAccount = () => {
    dispatch(openAccountModal());
  };

  // Отображаем загрузку
  if (loading && (!Array.isArray(transactions) || transactions.length === 0) && 
      (!Array.isArray(categories) || categories.length === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-full py-20">
        <div className="loader mb-6"></div>
        <h3 className="text-lg text-gray-300 mb-4">Загрузка данных</h3>
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Транзакции</span>
            <span>{loadingStatus.transactions ? 'Загрузка...' : 'Готово'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Категории</span>
            <span>{loadingStatus.categories ? 'Загрузка...' : 'Готово'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Статистика</span>
            <span>{loadingStatus.statistics ? 'Загрузка...' : 'Готово'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Данные дашборда</span>
            <span>{loadingStatus.dashboard ? 'Загрузка...' : 'Готово'}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Отображаем ошибку
  if (error && (!Array.isArray(transactions) || transactions.length === 0)) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 text-5xl mb-4">
          <FiDatabase className="mx-auto" />
        </div>
        <h2 className="text-2xl text-white mb-2">Ошибка загрузки данных</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          className="btn btn-primary flex items-center mx-auto"
          onClick={handleRetry}
        >
          <FiRefreshCw className="mr-2" />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold mb-6">Панель управления</h1>
      
      
      
      {/* Счета с финансовой сводкой */}
      <div className="mb-8">
        <AccountCards 
          onAddTransaction={handleAddTransaction}
          onAddAccount={handleAddAccount}
        />
      </div>
      
      {/* Recent activity and transactions section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionList 
            title="Последние транзакции" 
            transactions={recentTransactions} 
            showViewAll={true}
            isCompact={true}
            isLoading={loading}
          />
        </div>
        
        <div className="lg:col-span-1">
          <RecentActivity 
            transactions={recentTransactions}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;