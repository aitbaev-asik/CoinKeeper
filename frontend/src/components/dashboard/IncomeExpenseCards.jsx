import React from 'react';
import { FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';

const IncomeExpenseCards = ({ income, expense, isLoading }) => {
  // Format numbers with thousand separators
  const formattedIncome = (income || 0).toLocaleString('ru-RU');
  const formattedExpense = (expense || 0).toLocaleString('ru-RU');

  return (
    <>
      {/* Income Card */}
      <div className="card bg-gradient-to-br from-success-500/20 to-dark-700 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-success-500 rounded-full opacity-10 transform translate-x-10 -translate-y-10"></div>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <FiArrowUpRight className="text-success-500" />
              <p className="text-gray-400 font-medium">Доходы</p>
            </div>
            {isLoading ? (
              <div className="h-8 w-24 skeleton rounded"></div>
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold">{formattedIncome} ₸</h2>
            )}
          </div>
          
          <div className="h-10 w-10 rounded-full bg-success-500/20 flex items-center justify-center">
            <FiArrowUpRight className="text-success-500" size={20} />
          </div>
        </div>
      </div>
      
      {/* Expense Card */}
      <div className="card bg-gradient-to-br from-accent-500/20 to-dark-700 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-accent-500 rounded-full opacity-10 transform translate-x-10 -translate-y-10"></div>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <FiArrowDownLeft className="text-accent-500" />
              <p className="text-gray-400 font-medium">Расходы</p>
            </div>
            {isLoading ? (
              <div className="h-8 w-24 skeleton rounded"></div>
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold">{formattedExpense} ₸</h2>
            )}
          </div>
          
          <div className="h-10 w-10 rounded-full bg-accent-500/20 flex items-center justify-center">
            <FiArrowDownLeft className="text-accent-500" size={20} />
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomeExpenseCards;