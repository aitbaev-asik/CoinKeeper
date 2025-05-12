import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiFilter, FiRefreshCw, FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import TransactionList from '../components/transactions/TransactionList';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { openTransactionModal } from '../store/slices/uiSlice';

// Вспомогательная функция для преобразования значений в числовой формат
const ensureNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const Transactions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountIdFromUrl = searchParams.get('account');
  
  const { items: transactions, loading, error } = useSelector(state => state.transactions);
  const { items: accounts } = useSelector(state => state.accounts);
  const { items: categories } = useSelector(state => state.categories);
  
  const [filters, setFilters] = useState({
    type: '',
    date: '',
    category: '',
    account: accountIdFromUrl || ''
  });
  
  const [showFilters, setShowFilters] = useState(!!accountIdFromUrl);
  
  // Получаем информацию о текущем счете, если указан в URL
  const currentAccount = accountIdFromUrl 
    ? accounts?.find(acc => ensureNumber(acc.id) === ensureNumber(accountIdFromUrl)) 
    : null;
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Transactions: загрузка данных...');
        
        if (!categories || categories.length === 0) {
          await dispatch(fetchCategories()).unwrap();
        }
        
        if (!accounts || accounts.length === 0) {
          await dispatch(fetchAccounts()).unwrap();
        }
        
        // Всегда загружаем транзакции, так как они могут обновляться
        await dispatch(fetchTransactions()).unwrap();
      } catch (error) {
        console.error('Ошибка при загрузке данных на странице транзакций:', error);
      }
    };
    
    loadData();
  }, [dispatch, categories, accounts]);
  
  // Обновляем фильтр счета при изменении параметра в URL
  useEffect(() => {
    setFilters(prev => ({ ...prev, account: accountIdFromUrl || '' }));
  }, [accountIdFromUrl]);
  
  // Обработчик добавления новой транзакции
  const handleAddTransaction = () => {
    // Если указан конкретный счет в URL, передаем его в модальное окно
    if (accountIdFromUrl) {
      dispatch(openTransactionModal({ 
        account: accountIdFromUrl,
        type: 'any'
      }));
    } else {
    dispatch(openTransactionModal());
    }
  };
  
  // Возврат к списку всех транзакций
  const handleBackToAll = () => {
    navigate('/transactions');
  };
  
  // Показать/скрыть панель фильтров
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Обработчик применения фильтров
  const handleApplyFilters = () => {
    // Обновляем URL параметры
    const newSearchParams = new URLSearchParams();
    
    if (filters.account) {
      newSearchParams.set('account', filters.account);
    }
    
    if (filters.category) {
      newSearchParams.set('category', filters.category);
    }
    
    if (filters.type) {
      newSearchParams.set('type', filters.type);
    }
    
    if (filters.date) {
      newSearchParams.set('date', filters.date);
    }
    
    setSearchParams(newSearchParams);
  };
  
  // Сброс всех фильтров
  const handleResetFilters = () => {
    setFilters({
      type: '',
      date: '',
      category: '',
      account: ''
    });
    setSearchParams({});
  };
  
  // Быстрый выбор счета
  const handleQuickAccountSelect = (accountId) => {
    setFilters(prev => ({ ...prev, account: accountId }));
  };
  
  // Быстрый выбор категории
  const handleQuickCategorySelect = (categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
  };
  
  // Получение отфильтрованных транзакций
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    let filtered = [...transactions];
    
    // Фильтр по счету (из URL или состояния фильтров)
    if (filters.account) {
      filtered = filtered.filter(t => 
        ensureNumber(t.account) === ensureNumber(filters.account)
      );
    }
    
    // Другие фильтры можно добавить здесь
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters.category) {
      filtered = filtered.filter(t => 
        t.category && ensureNumber(t.category) === ensureNumber(filters.category)
      );
    }
    
    // Фильтр по дате
    if (filters.date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.date) {
        case 'today':
          filtered = filtered.filter(t => new Date(t.date) >= today);
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          filtered = filtered.filter(t => new Date(t.date) >= weekStart);
          break;
        case 'month':
          const monthStart = new Date(today);
          monthStart.setMonth(monthStart.getMonth() - 1);
          filtered = filtered.filter(t => new Date(t.date) >= monthStart);
          break;
        case 'year':
          const yearStart = new Date(today);
          yearStart.setFullYear(yearStart.getFullYear() - 1);
          filtered = filtered.filter(t => new Date(t.date) >= yearStart);
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };
  
  // Отображение ошибки загрузки данных
  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl text-white mb-4">Ошибка загрузки транзакций</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          className="btn btn-primary flex items-center mx-auto"
          onClick={() => dispatch(fetchTransactions())}
        >
          <FiRefreshCw className="mr-2" />
          Попробовать снова
        </button>
      </div>
    );
  }
  
  // Получаем отфильтрованные транзакции
  const filteredTransactions = getFilteredTransactions();
  
  // Сортируем счета и категории для отображения
  const sortedAccounts = accounts ? [...accounts].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const incomeCategories = categories ? categories.filter(c => c.type === 'income').sort((a, b) => a.name.localeCompare(b.name)) : [];
  const expenseCategories = categories ? categories.filter(c => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name)) : [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {accountIdFromUrl ? (
          <div className="flex items-center">
            <button 
              className="mr-3 p-2 rounded-full bg-dark-700 hover:bg-dark-600"
              onClick={handleBackToAll}
              title="Назад ко всем транзакциям"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">
              {currentAccount ? `Транзакции: ${currentAccount.name}` : 'Транзакции по счету'}
            </h1>
          </div>
        ) : (
        <h1 className="text-3xl font-bold">Транзакции</h1>
        )}
        
        <div className="flex space-x-3">
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center`}
            onClick={toggleFilters}
          >
            <FiFilter className="mr-2" />
            Фильтры
          </button>
          
          <button 
            className="btn btn-primary flex items-center"
            onClick={handleAddTransaction}
          >
            <FiPlus className="mr-2" />
            Добавить
          </button>
        </div>
      </div>
      
      {/* Фильтры транзакций */}
      {showFilters && (
        <div className="card mb-6">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Фильтры</h3>
              <button 
                onClick={handleResetFilters}
                className="text-sm text-red-400 hover:text-red-300 flex items-center"
              >
                <FiX size={16} className="mr-1" />
                Сбросить все
              </button>
            </div>
            
            {/* Быстрые фильтры по счетам */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-2">Счета</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-full text-sm 
                    ${!filters.account 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                  onClick={() => handleQuickAccountSelect('')}
                >
                  Все счета
                </button>
                
                {sortedAccounts.map(account => (
                  <button 
                    key={account.id}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center
                      ${filters.account === account.id.toString() 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                    onClick={() => handleQuickAccountSelect(account.id.toString())}
                  >
                    {filters.account === account.id.toString() && <FiCheck size={14} className="mr-1" />}
                    {account.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Быстрые фильтры по категориям */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-2">Категории</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-full text-sm 
                    ${!filters.category 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                  onClick={() => handleQuickCategorySelect('')}
                >
                  Все категории
                </button>
                
                {/* Расходы */}
                {expenseCategories.length > 0 && (
                  <div className="w-full mt-2">
                    <h5 className="text-xs text-gray-500 mb-1">Расходы:</h5>
                    <div className="flex flex-wrap gap-2">
                      {expenseCategories.map(category => (
                        <button 
                          key={category.id}
                          className={`px-3 py-1.5 rounded-full text-sm flex items-center
                            ${filters.category === category.id.toString() 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                          onClick={() => handleQuickCategorySelect(category.id.toString())}
                        >
                          {filters.category === category.id.toString() && <FiCheck size={14} className="mr-1" />}
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-1.5" 
                              style={{ backgroundColor: category.color || '#777' }}
                            ></div>
                            {category.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Доходы */}
                {incomeCategories.length > 0 && (
                  <div className="w-full mt-2">
                    <h5 className="text-xs text-gray-500 mb-1">Доходы:</h5>
                    <div className="flex flex-wrap gap-2">
                      {incomeCategories.map(category => (
                        <button 
                          key={category.id}
                          className={`px-3 py-1.5 rounded-full text-sm flex items-center
                            ${filters.category === category.id.toString() 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                          onClick={() => handleQuickCategorySelect(category.id.toString())}
                        >
                          {filters.category === category.id.toString() && <FiCheck size={14} className="mr-1" />}
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-1.5" 
                              style={{ backgroundColor: category.color || '#777' }}
                            ></div>
                            {category.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Расширенные фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                <label className="block text-sm text-gray-400 mb-1">Тип транзакции</label>
            <select 
                  className="form-select w-full bg-dark-700 text-white border-dark-600 rounded-lg"
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
            >
              <option value="">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Период</label>
            <select 
                  className="form-select w-full bg-dark-700 text-white border-dark-600 rounded-lg"
              value={filters.date}
              onChange={e => setFilters({...filters, date: e.target.value})}
            >
              <option value="">Все время</option>
              <option value="today">Сегодня</option>
                  <option value="week">Последние 7 дней</option>
                  <option value="month">Последние 30 дней</option>
                  <option value="year">Последний год</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleApplyFilters}
          >
                Применить фильтры
          </button>
        </div>
      </div>
        </div>
      )}
      
      {/* Информация о активных фильтрах */}
      {(filters.account || filters.category || filters.type || filters.date) && (
        <div className="bg-dark-700 p-3 rounded-lg mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Активные фильтры:</span>
            
            {filters.account && (
              <div className="bg-dark-600 px-2 py-1 rounded-full text-xs flex items-center">
                <span className="mr-1">Счет: {accounts?.find(a => a.id.toString() === filters.account)?.name || 'Выбранный счет'}</span>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setFilters({...filters, account: ''})}
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            
            {filters.category && (
              <div className="bg-dark-600 px-2 py-1 rounded-full text-xs flex items-center">
                <span className="mr-1">Категория: {categories?.find(c => c.id.toString() === filters.category)?.name || 'Выбранная категория'}</span>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setFilters({...filters, category: ''})}
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            
            {filters.type && (
              <div className="bg-dark-600 px-2 py-1 rounded-full text-xs flex items-center">
                <span className="mr-1">Тип: {filters.type === 'income' ? 'Доходы' : 'Расходы'}</span>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setFilters({...filters, type: ''})}
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            
            {filters.date && (
              <div className="bg-dark-600 px-2 py-1 rounded-full text-xs flex items-center">
                <span className="mr-1">Период: {
                  filters.date === 'today' ? 'Сегодня' : 
                  filters.date === 'week' ? 'Последние 7 дней' : 
                  filters.date === 'month' ? 'Последние 30 дней' : 
                  'Последний год'
                }</span>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setFilters({...filters, date: ''})}
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            
            <button 
              className="text-red-400 hover:text-red-300 text-xs ml-auto"
              onClick={handleResetFilters}
            >
              Сбросить все
            </button>
          </div>
        </div>
      )}
      
      {/* Список транзакций */}
      <TransactionList 
        transactions={filteredTransactions}
        showViewAll={false}
        isCompact={false}
        isLoading={loading}
        title={filteredTransactions.length > 0 
          ? `Найдено транзакций: ${filteredTransactions.length}`
          : 'Транзакции'
        }
      />
    </div>
  );
};

export default Transactions; 