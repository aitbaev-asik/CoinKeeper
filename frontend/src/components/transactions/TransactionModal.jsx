import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { closeTransactionModal } from '../../store/slices/uiSlice';
import { 
  addTransaction, 
  updateTransaction 
} from '../../store/slices/transactionsSlice';
import { fetchPeriodSummaries } from '../../store/slices/dashboardSlice';
import transactionsApi from '../../api/transactionsApi';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import { FiX, FiCalendar, FiTag, FiRepeat, FiBell, FiShoppingCart, FiCoffee, FiHome, FiDollarSign, FiGift, FiCreditCard, FiTruck, FiHeart, FiActivity, FiFilm, FiMusic, FiBookmark, FiWifi } from 'react-icons/fi';

// Функция для получения иконок по имени категории или названию иконки
const getCategoryIcon = (category) => {
  if (!category) return <FiBookmark size={24} />;
  
  // Сопоставление имен категорий или иконок с компонентами иконок
  const iconMap = {
    'shopping-cart': <FiShoppingCart size={24} />,
    'продукты': <FiShoppingCart size={24} />,
    'развлечения': <FiFilm size={24} />,
    'film': <FiFilm size={24} />,
    'транспорт': <FiTruck size={24} />,
    'car': <FiTruck size={24} />,
    'коммунальные': <FiHome size={24} />,
    'home': <FiHome size={24} />,
    'здоровье': <FiActivity size={24} />,
    'activity': <FiActivity size={24} />,
    'зарплата': <FiDollarSign size={24} />,
    'wallet': <FiDollarSign size={24} />,
    'фриланс': <FiCreditCard size={24} />,
    'briefcase': <FiCreditCard size={24} />,
    'подарки': <FiGift size={24} />,
    'gift': <FiGift size={24} />,
    'музыка': <FiMusic size={24} />,
    'кафе': <FiCoffee size={24} />,
    'интернет': <FiWifi size={24} />
  };
  
  // Проверяем по имени категории
  if (category.name && iconMap[category.name.toLowerCase()]) {
    return iconMap[category.name.toLowerCase()];
  }
  
  // Проверяем по иконке категории
  if (category.icon && iconMap[category.icon]) {
    return iconMap[category.icon];
  }
  
  // Возвращаем иконку по умолчанию
  return <FiBookmark size={24} />;
};

// Функция для получения иконки счета
const getAccountIcon = (account) => {
  if (!account) return <FiCreditCard size={24} />;
  
  // В будущем здесь можно добавить выбор иконки на основе типа счета
  return <FiCreditCard size={24} />;
};

// Функция для преобразования значений в числовой формат
const ensureNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const TransactionModal = () => {
  const dispatch = useDispatch();
  const { isTransactionModalOpen, currentEditItem } = useSelector(state => state.ui);
  const accounts = useSelector(state => state.accounts?.items || []);
  // Категории хранятся в локальном состоянии и загружаются из API
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: null,
    account: '',
    toAccount: '', // Для переводов между счетами
    date: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
    repeat: false,
    reminder: false,
    tags: []
  });
  
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Загружаем данные для редактирования
  useEffect(() => {
    if (currentEditItem) {
      console.log('Loading transaction for edit:', currentEditItem);
      
      setFormData({
        ...currentEditItem,
        id: currentEditItem.id, 
        // Преобразуем все ID в числа для корректной работы
        category: ensureNumber(currentEditItem.category),
        account: ensureNumber(currentEditItem.account),
        amount: String(currentEditItem.amount || ''),
        tags: Array.isArray(currentEditItem.tags) ? currentEditItem.tags : [],
        type: currentEditItem.type || 'expense',
        toAccount: currentEditItem.destination_account?.toString() || ''
      });
    } else {
      // Используем первый аккаунт по умолчанию
      const defaultAccount = accounts.length > 0 ? accounts[0].id : '';
      
      setFormData({
        type: 'expense',
        amount: '',
        category: null,
        account: defaultAccount,
        toAccount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        comment: '',
        repeat: false,
        reminder: false,
        tags: []
      });
    }
  }, [currentEditItem, isTransactionModalOpen, accounts]);
  
  // Загружаем категории при открытии модального окна
  useEffect(() => {
    if (isTransactionModalOpen) {
      // Получаем категории через API
      console.log('Загружаем категории через API...');
      transactionsApi.getCategories()
        .then(response => {
          console.log('Категории успешно загружены:', response.data);
          setCategories(response.data);
        })
        .catch(error => {
          console.error('Ошибка при загрузке категорий:', error);
          setCategories([]);
          toast.error('Не удалось загрузить категории. Попробуйте перезагрузить страницу.');
        });
    }
  }, [isTransactionModalOpen]);
  
  // Загружаем счета при необходимости
  useEffect(() => {
    if (isTransactionModalOpen && accounts.length === 0) {
      console.log('TransactionModal: счета не найдены, загружаем из store');
      dispatch(fetchAccounts());
    } else if (isTransactionModalOpen) {
      console.log('TransactionModal: найдено счетов:', accounts.length);
    }
  }, [isTransactionModalOpen, accounts.length, dispatch]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Особая обработка для категорий
    if (name === 'category') {
      const categoryId = ensureNumber(value);
      setFormData(prev => ({
        ...prev,
        category: categoryId
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'type') {
      setFormData(prev => ({ ...prev, type: value, category: null }));
    }
  };
  
  const handleAccountSelect = (accountId) => {
    setFormData(prev => ({
      ...prev,
      account: accountId
    }));
  };
  
  const handleToAccountSelect = (accountId) => {
    setFormData(prev => ({
      ...prev,
      toAccount: accountId
    }));
  };
  
  const handleTypeSelect = (type) => {
    setFormData(prev => {
      // Если меняем тип на 'transfer', очищаем категорию 
      if (type === 'transfer') {
        return { 
          ...prev, 
          type, 
          category: null,
          toAccount: prev.account === prev.toAccount ? '' : prev.toAccount
        };
      }
      
      // Если меняем с 'transfer', очищаем toAccount
      if (prev.type === 'transfer') {
        return {
          ...prev,
          type,
          category: null,
          toAccount: '',
        };
      }
      
      // Для обычного переключения между income/expense
      return { 
      ...prev, 
      type, 
        category: null
      };
    });
  };
  
  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
      setShowTagInput(false);
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Валидация данных перед отправкой
  const validateFormData = () => {
    const errors = [];
    
    // Проверка суммы
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Пожалуйста, введите сумму транзакции');
    }
    
    // Проверка аккаунта
    if (!formData.account) {
      errors.push('Необходимо выбрать счет для транзакции');
    }
    
    // Проверки для перевода
    if (formData.type === 'transfer') {
      if (!formData.toAccount) {
        errors.push('Необходимо выбрать счет получателя');
      }
      
      if (formData.account === formData.toAccount) {
        errors.push('Счет отправителя и получателя должны быть разными');
      }
    } 
    // Проверки для доходов и расходов
    else if (formData.type !== 'transfer') {
      // Проверка категории
      if (formData.category === null || formData.category === undefined) {
        errors.push('Необходимо выбрать категорию');
      }
    }
    
    return errors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Отправка формы, текущее состояние:', formData);
    
    // Валидация данных
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    // Подготавливаем данные для отправки
    const transactionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      account: ensureNumber(formData.account),
      date: formData.date,
      comment: formData.comment || '',
      tags: Array.isArray(formData.tags) ? formData.tags : []
    };
    
    // Добавляем ID для обновления существующей транзакции
    if (currentEditItem && currentEditItem.id) {
      transactionData.id = currentEditItem.id;
    }
    
    // Добавляем специфичные поля в зависимости от типа транзакции
    if (formData.type === 'transfer') {
      transactionData.destination_account = ensureNumber(formData.toAccount);
      transactionData.category = null; // Для переводов категория не нужна
    } else {
      transactionData.category = ensureNumber(formData.category);
    }
    
    try {
      // Отправляем данные
      const action = currentEditItem && currentEditItem.id
        ? dispatch(updateTransaction(transactionData))
        : dispatch(addTransaction(transactionData));
      
      action.unwrap()
        .then(() => {
          const actionType = currentEditItem && currentEditItem.id ? 'обновлена' : 'добавлена';
          const transactionType = formData.type === 'transfer' ? 'Перевод' : 'Транзакция';
          
          toast.success(`${transactionType} успешно ${actionType}`);
          
          // Уведомляем пользователя об обновлении данных
          // const toastId = toast.info('Обновление данных...', { autoClose: false });
          
          // Закрываем модальное окно
          dispatch(closeTransactionModal());
          
          // Применяем задержку перед обновлением данных для гарантии того, что транзакция обработана на сервере
          setTimeout(() => {
            console.log('🔄 Обновление счетов после транзакции...');
            // Явно вызываем обновление счетов
            dispatch({ type: 'accounts/updateAfterTransaction' });
            
            // Обновляем статистику через небольшой интервал после обновления счетов
            setTimeout(() => {
              console.log('📊 Обновление статистики дашборда...');
              // Обновляем статистику дашборда напрямую через редьюсер
              dispatch({ type: 'dashboard/updateSummary' });
              
              // Также обновляем данные через API
              dispatch(fetchPeriodSummaries('month'));
              
              // Закрываем уведомление об обновлении
              toast.update(toastId, { 
                render: 'Данные обновлены', 
                type: toast.TYPE.SUCCESS, 
                autoClose: 3000 
              });
            }, 500);
          }, 500);
        })
        .catch(error => {
          toast.error(`Ошибка: ${error}`);
        });
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
    }
  };
  
  if (!isTransactionModalOpen) return null;
  
  // Фильтруем категории по выбранному типу транзакции
  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  
  // Убедимся, что у formData всегда есть tags и это массив
  if (!formData.tags) {
    formData.tags = [];
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-800 md:bg-black/50">
      <div className="flex items-end md:items-center justify-center min-h-screen">
        <div className="w-full md:max-w-md bg-dark-800 rounded-t-2xl md:rounded-2xl shadow-xl relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <h2 className="text-xl font-semibold">
              {currentEditItem ? 'Редактировать' : 'Новая'} транзакция
            </h2>
            <button
              onClick={() => dispatch(closeTransactionModal())}
              className="p-2 hover:bg-dark-700 rounded-full"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {/* Account Selection - карточки для выбора счета */}
            <div className="mb-6">
              <h3 className="text-gray-400 mb-2">Ваш счет</h3>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map(account => {
                  const isSelected = formData.account == account.id;
                  
                  return (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account.id)}
                      className={`
                        p-3 rounded-xl cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-dark-600 ring-2 ring-primary-500' 
                          : 'bg-dark-700 hover:bg-dark-600'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-dark-600 rounded-full p-2 flex items-center justify-center">
                          <FiCreditCard size={18} className={isSelected ? 'text-primary-500' : 'text-gray-300'} />
                        </div>
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {account.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {account.balance.toLocaleString('ru-RU')} ₸
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* To Account Selection - для переводов */}
            {formData.type === 'transfer' && (
              <div className="mb-6">
                <h3 className="text-gray-400 mb-2">Счет получателя</h3>
                <div className="grid grid-cols-2 gap-2">
                  {accounts
                    .filter(acc => acc.id != formData.account)
                    .map(account => {
                      const isSelected = formData.toAccount == account.id;
                      
                      return (
                        <div
                          key={account.id}
                          onClick={() => handleToAccountSelect(account.id)}
                          className={`
                            p-3 rounded-xl cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-dark-600 ring-2 ring-blue-500' 
                              : 'bg-dark-700 hover:bg-dark-600'}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-dark-600 rounded-full p-2 flex items-center justify-center">
                              <FiCreditCard size={18} className={isSelected ? 'text-blue-500' : 'text-gray-300'} />
                            </div>
                            <div>
                              <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {account.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {account.balance.toLocaleString('ru-RU')} ₸
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}
            
            {/* Amount Input */}
            <div className="mb-6 relative">
              <div className="flex items-center justify-center">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full text-5xl bg-transparent border-none focus:outline-none text-center font-bold tracking-wide transition-all"
                  style={{ 
                    color: formData.type === 'expense' 
                      ? '#ef4444' 
                      : formData.type === 'income' 
                        ? '#10b981' 
                        : '#3b82f6',
                    textShadow: '0 0 1px rgba(255,255,255,0.2)'
                  }}
                />
              </div>
              <div className="text-center text-gray-400 text-sm font-medium mt-1">KZT</div>
            </div>
            
            {/* Transaction Type */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                className={`
                  text-center py-3 rounded-xl cursor-pointer transition-all
                  ${formData.type === 'expense' 
                    ? 'bg-red-500/20 text-red-500 font-medium' 
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}
                `}
                onClick={() => handleTypeSelect('expense')}
              >
                Расход
              </button>
              
              <button
                type="button"
                className={`
                  text-center py-3 rounded-xl cursor-pointer transition-all
                  ${formData.type === 'transfer' 
                    ? 'bg-blue-500/20 text-blue-500 font-medium' 
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}
                `}
                onClick={() => handleTypeSelect('transfer')}
              >
                Перевод
              </button>
              
              <button
                type="button"
                className={`
                  text-center py-3 rounded-xl cursor-pointer transition-all
                  ${formData.type === 'income' 
                    ? 'bg-green-500/20 text-green-500 font-medium' 
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}
                `}
                onClick={() => handleTypeSelect('income')}
              >
                Доход
              </button>
            </div>
            
            {/* Categories Grid - не показываем для переводов */}
            {formData.type !== 'transfer' && (
              <div className="mb-6">
                <h3 className="text-gray-400 mb-2">Категория</h3>
                <div className="grid grid-cols-4 gap-4">
                  {filteredCategories.map(category => {
                    // Преобразуем ID категории в число
                    const categoryId = ensureNumber(category.id);
                    
                    // Определяем, выбрана ли эта категория
                    const isSelected = formData.category === categoryId;
                    
                    return (
                      <div 
                        key={category.id} 
                        className="text-center"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            category: categoryId
                          }));
                        }}
                      >
                        <div 
                          className={`
                          p-3 rounded-xl cursor-pointer transition-all transform
                          ${isSelected
                            ? 'bg-dark-600 ring-2 ring-primary-500 scale-105' 
                            : 'bg-dark-700 hover:bg-dark-600 hover:scale-102'}
                          `}
                        >
                          <div 
                            className={`
                              w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center text-white
                              ${isSelected ? 'animate-pulse-light' : ''}
                            `}
                            style={{ backgroundColor: category.color }}
                          >
                            {getCategoryIcon(category)}
                          </div>
                          <div className={`
                            text-sm truncate font-medium
                            ${isSelected ? 'text-white' : 'text-gray-300'}
                          `}>
                            {category.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Date */}
            <div className="flex items-center p-4 bg-dark-700 rounded-xl mb-4">
              <FiCalendar className="text-gray-400 mr-3" size={20} />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-transparent focus:outline-none flex-1"
              />
            </div>
            
            {/* Comment */}
            <div className="mb-4">
              <input
                type="text"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Добавить комментарий"
                className="w-full p-4 bg-dark-700 rounded-xl focus:outline-none"
              />
            </div>
            
            {/* Tags */}
            <div className="mb-4">
              <div className="flex items-center p-4 bg-dark-700 rounded-xl">
                <FiTag className="text-gray-400 mr-3" size={20} />
                <div className="flex flex-wrap gap-2 flex-1">
                  {(formData.tags || []).map(tag => (
                    <span 
                      key={tag} 
                      className="bg-dark-600 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                  {showTagInput ? (
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onBlur={handleAddTag}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Добавить метку"
                      className="bg-transparent focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowTagInput(true)}
                      className="text-primary-500 text-sm"
                    >
                      Создать метку
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                <div className="flex items-center">
                  <FiRepeat className="text-gray-400 mr-3" size={20} />
                  <span>Повторять операцию</span>
                </div>
                <input
                  type="checkbox"
                  name="repeat"
                  checked={formData.repeat}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors
                  ${formData.repeat ? 'bg-primary-500' : 'bg-dark-600'}
                  relative
                `}>
                  <div className={`
                    absolute w-5 h-5 rounded-full bg-white top-0.5 left-0.5
                    transition-transform ${formData.repeat ? 'translate-x-5' : ''}
                  `} />
                </div>
              </label>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className={`
                w-full py-4 rounded-xl font-medium transition-all transform hover:scale-[1.01] hover:shadow-lg
                ${formData.type === 'income'
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20'
                  : formData.type === 'expense'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20'}
              `}
            >
              Готово
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;