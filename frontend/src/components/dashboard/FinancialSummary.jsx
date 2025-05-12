import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FiArrowUpRight, FiArrowDownRight, FiCalendar, FiChevronDown } from 'react-icons/fi';
import { selectDashboardPeriod, setDashboardPeriod } from '../../store/slices/dashboardSlice';
import dashboardApi from '../../api/dashboardApi';
import { toast } from 'react-toastify';

// Список периодов для выбора
const PERIODS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Текущая неделя' },
  { value: 'month', label: 'Текущий месяц' },
  { value: 'quarter', label: 'Текущий квартал' },
  { value: 'year', label: 'Текущий год' },
  { value: 'all', label: 'Все время' }
];

const FinancialSummary = () => {
  const dispatch = useDispatch();
  const reduxPeriod = useSelector(selectDashboardPeriod);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    income: 0,
    expense: 0,
    period_key: "",
    period_type: "monthly"
  });
  
  // Получаем данные о доходах и расходах через API
  const fetchSummaryData = async (selectedPeriod = reduxPeriod) => {
    setLoading(true);
    try {
      console.log(`🚀 [FinancialSummary] Запрос данных для периода: ${selectedPeriod}...`);
      
      const response = await dashboardApi.getPeriodSummariesByClientPeriod(selectedPeriod);
      console.log("📊 [FinancialSummary] Получены данные о доходах и расходах:", response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const latestSummary = response.data[0]; // Берем первый элемент массива
        
        setSummaryData({
          income: parseFloat(latestSummary.income_amount) || 0,
          expense: parseFloat(latestSummary.expense_amount) || 0,
          period_key: latestSummary.period_key || "",
          period_type: latestSummary.period_type || ""
        });
        
        console.log("💰 [FinancialSummary] Данные обновлены:", {
          income: parseFloat(latestSummary.income_amount) || 0,
          expense: parseFloat(latestSummary.expense_amount) || 0,
          period: selectedPeriod
        });
      } else {
        // Если данных нет, сбрасываем на нули
        setSummaryData({
          income: 0,
          expense: 0,
          period_key: "",
          period_type: ""
        });
        toast.info('Нет данных о доходах и расходах за выбранный период');
      }
    } catch (error) {
      console.error("❌ [FinancialSummary] Ошибка при получении данных:", error);
      toast.error('Не удалось загрузить данные о доходах и расходах');
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем данные при монтировании компонента и при изменении периода в Redux
  useEffect(() => {
    fetchSummaryData(reduxPeriod);
    console.log('🔄 [FinancialSummary] Период из Redux изменился:', reduxPeriod);
  }, [reduxPeriod]);

  // Форматирование денежных значений
  const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Форматирование диапазона дат
  const formatDateRange = () => {
    // Преобразуем period_key в дату
    if (summaryData.period_key) {
      try {
        // Например, если период "2025-05", то это май 2025
        const [year, month] = summaryData.period_key.split('-');
        if (year && month) {
          const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          // Последний день месяца
          const endDate = new Date(parseInt(year), parseInt(month), 0);
          
          return `${format(startDate, 'd MMMM', { locale: ru })} - ${format(endDate, 'd MMMM yyyy', { locale: ru })}`;
        }
      } catch (error) {
        console.error('Ошибка форматирования дат:', error);
      }
    }
    return '';
  };

  // Получение и выбор названия периода
  const getPeriodLabel = () => {
    const foundPeriod = PERIODS.find(p => p.value === reduxPeriod);
    return foundPeriod ? foundPeriod.label : 'Выберите период';
  };

  // Обработчик выбора периода
  const handlePeriodChange = (newPeriod) => {
    console.log(`🔄 [FinancialSummary] Выбран новый период: ${newPeriod}`);
    dispatch(setDashboardPeriod(newPeriod));
    setShowPeriodSelector(false);
  };

  // Отображение JSON данных для отладки
  const jsonData = JSON.stringify([
    {
      "id": 5,
      "period_type": summaryData.period_type,
      "period_key": summaryData.period_key,
      "income_amount": summaryData.income,
      "expense_amount": summaryData.expense
    }
  ], null, 2);

  return (
    <div>
      {/* Отладочный JSON */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-white mb-2">JSON данные:</h3>
        <pre className="text-green-400 overflow-auto max-h-48">{jsonData}</pre>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Текущий баланс */}
        <div className="card bg-dark-800 p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-300">Текущий баланс</h2>
            <div className="relative">
              <button 
                className="flex items-center text-sm text-gray-400 hover:text-white bg-dark-700 px-3 py-1.5 rounded-full"
                onClick={() => setShowPeriodSelector(!showPeriodSelector)}
              >
                <FiCalendar className="mr-2" size={14} />
                <span>{getPeriodLabel()}</span>
                <FiChevronDown className="ml-1" size={14} />
              </button>
              
              {showPeriodSelector && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-700 rounded-lg shadow-lg z-10">
                  {PERIODS.map(p => (
                    <button
                      key={p.value}
                      className={`block w-full text-left px-4 py-2 text-sm ${reduxPeriod === p.value ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-dark-600'}`}
                      onClick={() => handlePeriodChange(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {summaryData.period_key && (
            <div className="text-sm text-gray-400 mb-4">
              {formatDateRange()}
            </div>
          )}
          
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(summaryData.income - summaryData.expense)} ₸
          </div>
          
          <div className="text-sm text-gray-400">
            Разница между доходами и расходами
          </div>
        </div>
        
        {/* Доходы */}
        <div className="card bg-dark-800 p-6">
          <h2 className="text-lg font-medium text-gray-300 mb-3">Доходы</h2>
          
          <div className="flex items-center mb-1">
            <FiArrowUpRight className="text-green-500 mr-2" size={24} />
            <div className="text-4xl font-bold text-green-500">
              {loading ? '...' : formatCurrency(summaryData.income)} ₸
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Общая сумма поступлений за период
          </div>
        </div>
        
        {/* Расходы */}
        <div className="card bg-dark-800 p-6">
          <h2 className="text-lg font-medium text-gray-300 mb-3">Расходы</h2>
          
          <div className="flex items-center mb-1">
            <FiArrowDownRight className="text-red-500 mr-2" size={24} />
            <div className="text-4xl font-bold text-red-500">
              {loading ? '...' : formatCurrency(summaryData.expense)} ₸
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Общая сумма расходов за период
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary; 