import React from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const RecentActivity = ({ transactions = [], isLoading = false }) => {
  const categories = useSelector(state => state.categories?.items || []);
  
  // Get category details - исправленная версия с корректной проверкой типов
  const getCategoryDetails = (categoryId) => {
    // Преобразуем categoryId в число для корректного сравнения
    const numericCategoryId = typeof categoryId === 'string' 
      ? parseInt(categoryId, 10) 
      : categoryId;
    
    // Ищем категорию по ID
    const category = categories.find(cat => {
      // Преобразуем ID категории в число для корректного сравнения
      const catId = typeof cat.id === 'string' ? parseInt(cat.id, 10) : cat.id;
      return catId === numericCategoryId;
    });
    
    return category || {
      name: 'Другое',
      color: '#888888'
    };
  };
  
  // No transactions
  if (!isLoading && (!transactions || transactions.length === 0)) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Недавняя активность</h2>
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <p>Нет активности</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6">Недавняя активность</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full skeleton"></div>
              <div className="flex-1">
                <div className="h-4 w-20 skeleton rounded mb-2"></div>
                <div className="h-3 w-32 skeleton rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(transaction => {
            const category = getCategoryDetails(transaction.category);
            
            return (
              <div key={transaction.id} className="flex items-start">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-3"
                  style={{ backgroundColor: category.color }}
                >
                  {/* Icon would go here */}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-400">
                        {format(new Date(transaction.date), 'dd MMMM yyyy')}
                      </p>
                    </div>
                    
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-success-500' : 
                      transaction.type === 'transfer' ? 'text-primary-500' : 'text-accent-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : 
                       transaction.type === 'transfer' ? '↔' : '-'}
                      {parseFloat(transaction.amount).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                  
                  {transaction.comment && (
                    <p className="text-sm text-gray-400 mt-1 break-words">
                      {transaction.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;