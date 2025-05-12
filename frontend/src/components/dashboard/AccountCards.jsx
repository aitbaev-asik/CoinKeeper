import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiCreditCard, FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiArrowUpRight, FiArrowDownLeft, FiArrowDownRight, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { selectDashboardData, fetchPeriodSummaries } from '../../store/slices/dashboardSlice';
import dashboardApi from '../../api/dashboardApi';
import { openAccountsListModal } from '../../store/slices/uiSlice';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import { Box, CircularProgress, Container, Grid, Typography } from '@mui/material';

// Массив цветов для разных карточек счетов
const cardColors = [
  {
    gradientFrom: 'from-blue-700',
    gradientTo: 'to-blue-600',
    style: { background: 'linear-gradient(135deg, #1e40af, #2563eb)' },
    iconBg: 'bg-blue-600/25',
    iconColor: 'text-blue-500'
  },
  {
    gradientFrom: 'from-green-700',
    gradientTo: 'to-green-600',
    style: { background: 'linear-gradient(135deg, #15803d, #22c55e)' },
    iconBg: 'bg-green-600/25',
    iconColor: 'text-green-500'
  },
  {
    gradientFrom: 'from-purple-700',
    gradientTo: 'to-purple-600',
    style: { background: 'linear-gradient(135deg, #7e22ce, #a855f7)' },
    iconBg: 'bg-purple-600/25',
    iconColor: 'text-purple-500'
  },
  {
    gradientFrom: 'from-red-700',
    gradientTo: 'to-red-600',
    style: { background: 'linear-gradient(135deg, #b91c1c, #ef4444)' },
    iconBg: 'bg-red-600/25',
    iconColor: 'text-red-500'
  },
  {
    gradientFrom: 'from-amber-700',
    gradientTo: 'to-amber-600',
    style: { background: 'linear-gradient(135deg, #b45309, #f59e0b)' },
    iconBg: 'bg-amber-600/25',
    iconColor: 'text-amber-500'
  },
  {
    gradientFrom: 'from-pink-700',
    gradientTo: 'to-pink-600',
    style: { background: 'linear-gradient(135deg, #be185d, #ec4899)' },
    iconBg: 'bg-pink-600/25',
    iconColor: 'text-pink-500'
  }
];

const getCardColor = (index) => {
  return cardColors[index % cardColors.length];
};

// Получение иконки по имени
const getAccountIcon = (icon) => {
  console.log('Получение иконки для:', icon);
  switch(icon) {
    case 'wallet': return <FiDollarSign size={24} />;
    case 'cash': return <FiDollarSign size={24} />;
    case 'credit-card': 
    case 'credit_card':
    case 'briefcase': return <FiCreditCard size={24} />;
    case 'coffee': return <FiCreditCard size={24} />;
    default: return <FiCreditCard size={24} />;
  }
};

const AccountCards = ({ onAddTransaction, onAddAccount }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dashboardData = useSelector(selectDashboardData) || {};
  const { 
    loading: dashboardLoading = false 
  } = dashboardData;

  const accountsState = useSelector(state => state.accounts);
  const accounts = accountsState?.items || [];
  const accountsLoading = accountsState?.loading || false;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    balance: 0,
    income: 0,
    expense: 0
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Форматирование денежных значений
  const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Получаем данные о доходах и расходах напрямую с API
  const fetchSummaryDirectly = async () => {
    try {
      console.log(`🚀 [AccountCards] Запрос данных о доходах и расходах для месячного периода...`);
      
      // Используем Redux вместо прямого вызова API
      dispatch(fetchPeriodSummaries('month'));

      const response = await dashboardApi.getPeriodSummariesByClientPeriod('month');
      console.log("✅ [AccountCards] Успешно получены данные о доходах и расходах:", response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const latestSummary = response.data[0]; // Берем первый элемент массива
        
        setTotals(prev => ({
          ...prev,
          income: parseFloat(latestSummary.income_amount) || 0,
          expense: parseFloat(latestSummary.expense_amount) || 0
        }));
        
        console.log("💰 [AccountCards] Установлены новые значения доходов и расходов:", {
          income: parseFloat(latestSummary.income_amount) || 0,
          expense: parseFloat(latestSummary.expense_amount) || 0
        });
      } else {
        // Если данных нет, сбрасываем на нули
        setTotals(prev => ({
          ...prev,
          income: 0,
          expense: 0
        }));
      }
    } catch (error) {
      console.error("❌ [AccountCards] Ошибка при получении данных о доходах и расходах:", error);
      toast.error('Не удалось загрузить данные о доходах и расходах');
    }
  };

  // Получаем данные через Redux
  const fetchAccountsDirectly = () => {
    console.log("Получение счетов через Redux...");
    dispatch(fetchAccounts());
  };

  // Рассчитываем общий баланс
  const calculateTotals = (accountsData) => {
    if (Array.isArray(accountsData) && accountsData.length > 0) {
      const totalBalance = accountsData.reduce((acc, account) => {
        const balance = typeof account.balance === 'number' 
          ? account.balance 
          : typeof account.balance === 'string' && !isNaN(parseFloat(account.balance))
              ? parseFloat(account.balance)
              : 0;
        return acc + balance;
      }, 0);
      
      setTotals(prev => ({
        ...prev,
        balance: totalBalance
      }));
    }
  };

  // Обновляем общий баланс при изменении счетов
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      calculateTotals(accounts);
      setLoading(false);
    }
  }, [accounts]);

  // Следим за обновлениями данных в Redux
  const reduxDashboardData = useSelector(selectDashboardData);

  // Обновляем данные когда меняется Redux state
  useEffect(() => {
    if (reduxDashboardData) {
      setTotals(prev => ({
        ...prev, 
        income: reduxDashboardData.income || 0,
        expense: reduxDashboardData.expense || 0
      }));
      console.log('🔄 [AccountCards] Обновлены данные из Redux:', {
        income: reduxDashboardData.income,
        expense: reduxDashboardData.expense
      });
    }
  }, [reduxDashboardData]);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    console.log('🔄 [AccountCards] Инициализация компонента');
    
    // Загружаем счета через Redux
    dispatch(fetchAccounts());
    
    // Загружаем данные о доходах/расходах через Redux
    dispatch(fetchPeriodSummaries('month'));

    // Устанавливаем время последнего обновления
    setLastRefreshTime(new Date());
  }, [dispatch]);

  // Обработчик события обновления данных
  const handleRefresh = () => {
    console.log('🔄 [AccountCards] Ручное обновление данных');
    
    // Показываем уведомление
    // const toastId = toast.info('Обновление данных...', { autoClose: false });
    
    // Загружаем счета
    dispatch(fetchAccounts());
    
    // Обновляем сводку доходов/расходов
    dispatch(fetchPeriodSummaries('month'));
    
    // Обновляем время последнего обновления
    setLastRefreshTime(new Date());
    
    // Через небольшую задержку обновляем статус уведомления
    setTimeout(() => {
      toast.update(toastId, { 
        render: 'Данные обновлены', 
        type: toast.TYPE.SUCCESS, 
        autoClose: 3000 
      });
    }, 1000);
  };

  // Обработчики событий
  const handleAddNewTransaction = (type, accountId) => {
    if (typeof onAddTransaction === 'function') {
      onAddTransaction(type, accountId);
    }
  };

  const handleAddNewAccount = () => {
    if (typeof onAddAccount === 'function') {
      onAddAccount();
    }
  };

  // Функция получения цвета карточки на основе данных аккаунта
  const getCardColor = (account, index) => {
    // Если у аккаунта есть свой цвет, используем его
    if (account && account.color && account.color.startsWith('#')) {
      const color = account.color;
      const lighterColor = lightenColor(color, 20);
      return {
        gradientFrom: '',
        gradientTo: '',
        style: { background: `linear-gradient(135deg, ${color}, ${lighterColor})` },
        iconBg: 'bg-opacity-25 bg-white',
        iconColor: 'text-white'
      };
    }
    
    // Иначе используем цвет из палитры
    return cardColors[index % cardColors.length];
  };

  // Функция для осветления цвета (HEX)
  const lightenColor = (color, amount) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) {
      return '#3b82f6'; // Возвращаем синий цвет по умолчанию
    }

    try {
      // Преобразуем HEX в RGB
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);

      // Осветляем каждый компонент
      r = Math.min(255, r + amount);
      g = Math.min(255, g + amount);
      b = Math.min(255, b + amount);

      // Преобразуем обратно в HEX
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
      console.error('Ошибка при осветлении цвета:', e);
      return '#3b82f6'; // Возвращаем синий цвет по умолчанию
    }
  };

  // Переход на страницу всех счетов
  const handleViewAllAccounts = () => {
    dispatch(openAccountsListModal());
  };

  // Получение цвета иконки
  const getIconColorClass = (account) => {
    if (account.color && account.color.startsWith('#')) {
      // Используем белый цвет иконки если задан пользовательский цвет
      return 'text-white';
    }
    
    // Иначе используем предопределенный цвет
    const index = accounts.indexOf(account);
    return cardColors[index % cardColors.length].iconColor;
  };

  // Функции для карусели
  const nextSlide = () => {
    if (accounts.length > 0) {
      setCurrentSlide((prev) => (prev === accounts.length ? 0 : prev + 1));
    }
  };

  const prevSlide = () => {
    if (accounts.length > 0) {
      setCurrentSlide((prev) => (prev === 0 ? accounts.length : prev - 1));
    }
  };

  // Обработчик добавления транзакции перевода
  const handleAddTransfer = (fromAccountId) => {
    onAddTransaction('transfer', fromAccountId);
  };
  
  // Обработчик свайпа для карусели
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // минимальное расстояние для свайпа
    
    if (diff > threshold) {
      // Свайп влево - следующий слайд
      nextSlide();
    } else if (diff < -threshold) {
      // Свайп вправо - предыдущий слайд
      prevSlide();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Если загрузка, показываем индикатор
  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Ваши счета</h2>
        </div>
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
          <h3 className="text-lg font-medium">Загрузка счетов...</h3>
          <p className="text-sm text-gray-400 mt-2">Получаем данные о ваших счетах</p>
        </div>
      </div>
    );
  }

  // Подготавливаем элементы карусели
  const accountsWithNewAccount = [
    ...accounts,
    { id: 'new-account', isAddButton: true }
  ];
  
  const totalSlides = accountsWithNewAccount.length;
  const hasMultipleSlides = totalSlides > 3;

  // Определяем, какие карточки показывать
  const getVisibleItems = () => {
    // Если карточек меньше или равно 3, показываем все
    if (totalSlides <= 3) {
      return accountsWithNewAccount;
    }
    
    // Создаем циклический массив для карусели
    const items = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentSlide + i) % totalSlides;
      items.push(accountsWithNewAccount[index]);
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="bg-dark-800 rounded-xl p-5 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Ваши счета</h2>
        <div className="flex space-x-2">
          <button 
            className="btn btn-sm btn-outline" 
            onClick={handleViewAllAccounts}
          >
            Показать все
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleAddNewAccount}
          >
            <FiPlus className="mr-1" />
            Добавить счет
          </button>
        </div>
      </div>

      {/* Финансовая сводка по периоду */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Текущий баланс */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 transform translate-x-10 -translate-y-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 transform -translate-x-10 translate-y-10 rounded-full"></div>
          
          <p className="text-gray-200 font-medium mb-1">Текущий баланс</p>
          <h2 className="text-3xl font-bold text-white mb-4">{formatCurrency(totals.balance)} ₸</h2>
          
          <button 
            onClick={() => onAddTransaction('any')} 
            className="btn btn-sm btn-primary bg-teal-600 hover:bg-teal-500 border-none"
          >
            <FiPlus className="w-4 h-4 mr-1" /> Добавить транзакцию
          </button>
        </div>
        
        {/* Доходы */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 transform translate-x-10 -translate-y-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 transform -translate-x-10 translate-y-10 rounded-full"></div>
          
          <div className="flex justify-between items-start mb-1">
            <p className="text-gray-200 font-medium">Доходы</p>
            <FiTrendingUp className="text-green-300" />
          </div>
          {dashboardLoading ? (
            <div className="text-white text-2xl font-bold mb-4">Загрузка...</div>
          ) : (
            <h2 className="text-3xl font-bold text-white mb-4">
              {formatCurrency(totals.income)} ₸
            </h2>
          )}
          
          <button 
            onClick={() => onAddTransaction('income')} 
            className="btn btn-sm bg-green-600 hover:bg-green-500 border-none"
          >
            <FiArrowDownLeft className="w-4 h-4 mr-1" /> Доход
          </button>
        </div>

        {/* Расходы */}
        <div className="bg-gradient-to-r from-red-800 to-red-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 transform translate-x-10 -translate-y-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 transform -translate-x-10 translate-y-10 rounded-full"></div>
          
          <div className="flex justify-between items-start mb-1">
            <p className="text-gray-200 font-medium">Расходы</p>
            <FiTrendingDown className="text-red-300" />
          </div>
          {dashboardLoading ? (
            <div className="text-white text-2xl font-bold mb-4">Загрузка...</div>
          ) : (
            <h2 className="text-3xl font-bold text-white mb-4">
              {formatCurrency(totals.expense)} ₸
            </h2>
          )}
          
          <button 
            onClick={() => onAddTransaction('expense')} 
            className="btn btn-sm bg-red-600 hover:bg-red-500 border-none"
          >
            <FiArrowUpRight className="w-4 h-4 mr-1" /> Расход
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Список счетов</h3>
        {hasMultipleSlides && (
          <div className="flex gap-2">
            <span className="text-sm text-gray-400">
              {currentSlide + 1}/{totalSlides}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={prevSlide}
                className="p-1 rounded-full bg-dark-600 hover:bg-dark-500 transition-colors"
                title="Предыдущий счет"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextSlide}
                className="p-1 rounded-full bg-dark-600 hover:bg-dark-500 transition-colors"
                title="Следующий счет"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Остальной код для отображения счетов */}
      {accounts.length > 0 ? (
        <div className="relative">
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-300 ease-in-out gap-4"
            style={{ transform: `translateX(0px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {visibleItems.map((item, index) => {
                // Если это кнопка добавления нового счета
                if (item.isAddButton) {
                  return (
                    <div 
                      key="new-account"
                      onClick={onAddAccount}
                      className="bg-dark-700 hover:bg-dark-600 rounded-xl p-5 shadow-lg border-2 border-dashed border-dark-500 cursor-pointer transition-colors flex flex-col items-center justify-center text-center"
                    > 
                      <h3 className="text-lg font-medium mb-2">Добавить счет</h3>
                      <p className="text-gray-400">Создать новый счет для учета финансов</p>
                    </div>
                  );
                }
                
                // Обычная карточка счета
                const colorScheme = getCardColor(item, index);
                
                // Определяем стиль для карточки
                let cardStyle = {};
                let cardClass = 'rounded-xl p-5 shadow-lg relative overflow-hidden';
                
                // Если у счета есть собственный цвет, используем его
                if (item.color && item.color.startsWith('#')) {
                  cardStyle = { background: item.color };
                } else if (colorScheme.style) {
                  // Иначе используем градиент из предопределенных цветов
                  cardStyle = colorScheme.style;
                } else {
                  // Если нет стиля, добавляем классы градиента
                  cardClass += ` bg-gradient-to-r ${colorScheme.gradientFrom} ${colorScheme.gradientTo}`;
                }
                
                return (
                  <div 
                    key={item.id} 
                    style={cardStyle}
                    className={cardClass}
                  >
                    {/* Декоративные элементы */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 transform translate-x-10 -translate-y-10 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 transform -translate-x-10 translate-y-10 rounded-full"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-white/20 p-2 rounded-full">
                          {getAccountIcon(item.icon)}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-right text-white">{item.name || "Без названия"}</h3>
                        </div>
                      </div>
                      
                      <div className="mt-4 mb-6">
                        <p className="text-white/70 text-sm mb-1">Баланс</p>
                        <h4 className="text-2xl font-bold text-white">
                          {parseFloat(item.balance || 0).toLocaleString('ru-RU')} ₸
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-6">
                        <button 
                          onClick={() => onAddTransaction('income', item.id)} 
                          className="btn btn-sm bg-white/10 hover:bg-white/20 border-none text-white flex items-center justify-center"
                        >
                          <FiArrowDownLeft className="mr-1" />
                          <span>Доход</span>
                        </button>
                        
                        <button 
                          onClick={() => navigate(`/transactions?account=${item.id}`)} 
                          className="btn btn-sm bg-white/15 hover:bg-white/25 border-none text-white flex items-center justify-center"
                        >
                          <FiDollarSign className="mr-1" />
                          <span>История</span>
                        </button>
                        
                        <button 
                          onClick={() => onAddTransaction('expense', item.id)} 
                          className="btn btn-sm bg-white/10 hover:bg-white/20 border-none text-white flex items-center justify-center"
                        >
                          <FiArrowUpRight className="mr-1" />
                          <span>Расход</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {hasMultipleSlides && (
            <>
              <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-4 p-2 rounded-full bg-dark-700/80 hover:bg-dark-600 transition-colors shadow-lg z-20"
                title="Предыдущий"
              >
                <FiChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-4 p-2 rounded-full bg-dark-700/80 hover:bg-dark-600 transition-colors shadow-lg z-20"
                title="Следующий"
              >
                <FiChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <FiDollarSign className="mx-auto w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">У вас еще нет счетов</h3>
          <p className="text-sm text-gray-400 mb-4">Добавьте свой первый счет для отслеживания баланса</p>
          <button 
            onClick={onAddAccount} 
            className="btn btn-primary mx-auto"
          >
            <FiPlus className="w-4 h-4 mr-2" /> Добавить счет
          </button>
        </div>
      )}
      
      {/* Фиксированная кнопка добавления транзакции */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => onAddTransaction('any')}
          className="btn btn-circle btn-lg bg-green-600 hover:bg-green-500 border-none shadow-lg text-white"
        >
          <FiPlus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default AccountCards; 