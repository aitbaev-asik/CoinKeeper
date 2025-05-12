import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { openTransactionModal } from '../../store/slices/uiSlice';
import { deleteTransaction } from '../../store/slices/transactionsSlice';

const TransactionList = ({ 
  title = 'Транзакции', 
  transactions, 
  showViewAll = false,
  isCompact = false
}) => {
  const dispatch = useDispatch();
  const categories = useSelector(state => state.categories?.items || []);
  
  const handleEdit = (transaction) => {
    dispatch(openTransactionModal(transaction));
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      dispatch(deleteTransaction(id));
    }
  };
  
  // Get category details - исправленная версия с корректной проверкой типов
  const getCategoryDetails = (categoryId) => {
    // Преобразуем categoryId в число для корректного сравнения
    const numericCategoryId = typeof categoryId === 'string' 
      ? parseInt(categoryId, 10) 
      : categoryId;
    
    console.log('Ищем категорию для ID:', categoryId, 'преобразованный ID:', numericCategoryId);
    
    // Ищем категорию по ID
    const category = categories.find(cat => {
      // Преобразуем ID категории в число для корректного сравнения
      const catId = typeof cat.id === 'string' ? parseInt(cat.id, 10) : cat.id;
      console.log('Сравниваем с категорией:', cat.name, 'ID:', cat.id, 'преобразованный ID:', catId);
      return catId === numericCategoryId;
    });
    
    console.log('Найденная категория:', category);
    
    return category || {
      name: 'Другое',
      color: '#888888'
    };
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        
        {showViewAll && (
          <Link to="/stats" className="text-primary-400 hover:text-primary-300 text-sm">
            Показать все
          </Link>
        )}
      </div>
      
      {transactions && transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left text-gray-400 text-xs uppercase">
              <tr>
                <th className="pb-3 pl-2">Дата</th>
                <th className="pb-3">Категория</th>
                {!isCompact && <th className="pb-3">Описание</th>}
                <th className="pb-3 text-right">Сумма</th>
                <th className="pb-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => {
                // Выводим дополнительную информацию для отладки
                console.log('Отображение транзакции:', transaction);
                console.log('Категория транзакции:', transaction.category, 'тип:', typeof transaction.category);
                
                const category = getCategoryDetails(transaction.category);
                
                return (
                  <tr key={transaction.id} className="border-t border-dark-600">
                    <td className="py-3 pl-2">
                      {format(new Date(transaction.date), 'dd.MM.yyyy')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        {category.name}
                      </div>
                    </td>
                    {!isCompact && (
                      <td className="py-3 text-gray-400">
                        {transaction.comment || '-'}
                      </td>
                    )}
                    <td className={`py-3 text-right font-medium ${
                      transaction.type === 'income' ? 'text-success-500' : 
                      transaction.type === 'transfer' ? 'text-primary-500' : 'text-accent-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : 
                       transaction.type === 'transfer' ? '↔' : '-'}
                      {parseFloat(transaction.amount).toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(transaction)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1 text-gray-400 hover:text-accent-500"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <p>Нет транзакций</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;