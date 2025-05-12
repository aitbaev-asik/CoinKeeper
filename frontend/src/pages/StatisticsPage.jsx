import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PieChart, BarChart } from '../components/charts';
import StatFilter from '../components/stats/StatFilter';
import { openDateRangeModal } from '../store/slices/uiSlice';

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

const StatisticsPage = () => {
  const dispatch = useDispatch();
  const transactions = useSelector(state => state.transactions.items);
  const categories = useSelector(state => state.categories.items);
  const { dateRange } = useSelector(state => state.ui);
  
  const [filterType, setFilterType] = useState('expense');
  const [periodType, setPeriodType] = useState('month');
  
  // Format the date range for display
  const formatDateRange = () => {
    const startDateObj = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);
    
    return `${format(startDateObj, 'dd MMM', { locale: ru })} - ${format(endDateObj, 'dd MMM yyyy', { locale: ru })}`;
  };
  
  // Filter transactions by date range and type
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const startDateObj = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);
    
    return (
      transaction.type === filterType &&
      transactionDate >= startDateObj &&
      transactionDate <= endDateObj
    );
  });
  
  // Prepare data for pie chart by category
  const preparePieChartData = () => {
    const categoryTotals = {};
    
    filteredTransactions.forEach(transaction => {
      const { category, amount } = transaction;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(amount);
    });
    
    return Object.keys(categoryTotals).map(categoryId => {
      // Преобразуем ID категории из ключа объекта в число
      const numericCategoryId = ensureNumber(categoryId);
      
      // Ищем категорию по ID с корректным преобразованием типов
      const categoryObj = categories.find(c => {
        // Преобразуем ID категории в число для корректного сравнения
        const catId = ensureNumber(c.id);
        return catId === numericCategoryId;
      }) || { 
        name: 'Другое', 
        color: '#888888' 
      };
      
      return {
        name: categoryObj.name,
        value: categoryTotals[categoryId],
        color: categoryObj.color
      };
    });
  };
  
  // Prepare data for bar chart by month/day
  const prepareBarChartData = () => {
    // Group transactions by date (day or month)
    const dateGroups = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = periodType === 'month' 
        ? format(date, 'yyyy-MM')
        : format(date, 'yyyy-MM-dd');
      
      dateGroups[key] = (dateGroups[key] || 0) + parseFloat(transaction.amount);
    });
    
    // Convert to array and sort by date
    return Object.entries(dateGroups)
      .map(([date, amount]) => {
        const dateObj = new Date(date);
        return {
          name: periodType === 'month' 
            ? format(dateObj, 'MMM', { locale: ru })
            : format(dateObj, 'dd MMM', { locale: ru }),
          value: amount
        };
      })
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
  };
  
  // Handle quick period selections
  const handlePeriodChange = (period) => {
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = now;
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = startOfMonth(now);
        endDate = now;
    }
    
    // Update date range in UI slice
    // In real app this would filter data from backend
  };
  
  const pieChartData = preparePieChartData();
  const barChartData = prepareBarChartData();
  
  // Calculate total
  const totalAmount = filteredTransactions.reduce((sum, transaction) => 
    sum + parseFloat(transaction.amount), 0);

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">Статистика</h1>
        
        <div className="mt-4 md:mt-0">
          <button 
            className="btn btn-outline text-sm"
            onClick={() => dispatch(openDateRangeModal())}
          >
            {formatDateRange()}
          </button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="card mb-6">
        <StatFilter 
          filterType={filterType} 
          setFilterType={setFilterType}
          periodType={periodType}
          setPeriodType={setPeriodType}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            {filterType === 'income' ? 'Доходы' : 'Расходы'} по категориям
          </h2>
          
          {pieChartData.length > 0 ? (
            <div className="h-80">
              <PieChart data={pieChartData} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400">
              Нет данных для отображения
            </div>
          )}
        </div>
        
        {/* Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            Динамика по {periodType === 'month' ? 'месяцам' : 'дням'}
          </h2>
          
          {barChartData.length > 0 ? (
            <div className="h-80">
              <BarChart 
                data={barChartData} 
                color={filterType === 'income' ? '#10b981' : '#ef4444'}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400">
              Нет данных для отображения
            </div>
          )}
        </div>
      </div>
      
      {/* Summary section */}
      <div className="card bg-dark-700">
        <h2 className="text-xl font-semibold mb-4">Сводка</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-600 rounded-lg">
            <p className="text-sm text-gray-400">Всего {filterType === 'income' ? 'доходов' : 'расходов'}</p>
            <p className="text-2xl font-bold">{totalAmount.toLocaleString('ru-RU')} ₸</p>
          </div>
          
          <div className="p-4 bg-dark-600 rounded-lg">
            <p className="text-sm text-gray-400">Категорий</p>
            <p className="text-2xl font-bold">{pieChartData.length}</p>
          </div>
          
          <div className="p-4 bg-dark-600 rounded-lg">
            <p className="text-sm text-gray-400">Транзакций</p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;