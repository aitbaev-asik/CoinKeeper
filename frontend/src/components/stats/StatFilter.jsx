import React from 'react';

const StatFilter = ({ 
  filterType, 
  setFilterType, 
  periodType, 
  setPeriodType 
}) => {
  return (
    <div className="p-2">
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Transaction type filter */}
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">Тип транзакций</p>
          <div className="flex border border-dark-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setFilterType('income')}
              className={`flex-1 py-2 px-4 text-center ${
                filterType === 'income' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Доходы
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`flex-1 py-2 px-4 text-center ${
                filterType === 'expense' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              Расходы
            </button>
          </div>
        </div>
        
        {/* Period type filter */}
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">Группировка данных</p>
          <div className="flex border border-dark-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setPeriodType('day')}
              className={`flex-1 py-2 px-4 text-center ${
                periodType === 'day' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              По дням
            </button>
            <button
              onClick={() => setPeriodType('month')}
              className={`flex-1 py-2 px-4 text-center ${
                periodType === 'month' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              По месяцам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatFilter;