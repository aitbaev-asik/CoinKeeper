import React from 'react';
import { FiPlus } from 'react-icons/fi';

const BalanceCard = ({ balance, onAddTransaction, isLoading }) => {
  // Format balance with thousand separators
  const formattedBalance = (balance || 0).toLocaleString('ru-RU');

  return (
    <div className="card bg-gradient-to-br from-primary-900 to-primary-800 p-6 text-white relative overflow-hidden">
      {/* Abstract background decor */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-700 rounded-full opacity-20 transform translate-x-20 -translate-y-20"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-600 rounded-full opacity-10 transform -translate-x-10 translate-y-10"></div>
      
      <div className="relative z-10">
        <p className="text-primary-200 font-medium mb-1">Текущий баланс</p>
        
        {isLoading ? (
          <div className="h-10 w-32 mb-4 skeleton rounded"></div>
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{formattedBalance} ₸</h2>
        )}
        
        <button
          onClick={onAddTransaction}
          className="btn bg-white text-primary-900 hover:bg-gray-100 flex items-center mt-4"
          disabled={isLoading}
        >
          <FiPlus className="mr-2" />
          Добавить транзакцию
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;