import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiCreditCard, FiDollarSign, FiShoppingBag, FiUser, FiHome } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { closeAccountModal } from '../../store/slices/uiSlice';
import { addAccount, updateAccount, addAccountLocal, updateAccountLocal } from '../../store/slices/accountsSlice';

// Варианты иконок для счетов
const ICON_OPTIONS = [
  { value: 'credit-card', label: 'Карта', icon: <FiCreditCard size={24} /> },
  { value: 'cash', label: 'Наличные', icon: <FiDollarSign size={24} /> },
  { value: 'wallet', label: 'Кошелек', icon: <FiDollarSign size={24} /> },
  { value: 'briefcase', label: 'Бизнес', icon: <FiCreditCard size={24} /> },
  { value: 'coffee', label: 'Кофе', icon: <FiCreditCard size={24} /> },
  { value: 'shopping', label: 'Покупки', icon: <FiShoppingBag size={24} /> },
  { value: 'person', label: 'Личное', icon: <FiUser size={24} /> },
  { value: 'home', label: 'Дом', icon: <FiHome size={24} /> },
];

// Варианты цветов для счетов
const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Синий' },
  { value: '#10b981', label: 'Зеленый' },
  { value: '#f59e0b', label: 'Оранжевый' },
  { value: '#ef4444', label: 'Красный' },
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
  { value: '#6366f1', label: 'Индиго' },
  { value: '#14b8a6', label: 'Бирюзовый' },
];

const AccountModal = () => {
  const dispatch = useDispatch();
  const { isAccountModalOpen, currentEditItem } = useSelector(state => state.ui);
  
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    icon: 'credit-card',
    color: '#3b82f6'
  });
  
  // При открытии модального окна загружаем данные для редактирования
  useEffect(() => {
    if (currentEditItem && isAccountModalOpen) {
      setFormData({
        id: currentEditItem.id,
        name: currentEditItem.name || '',
        balance: currentEditItem.balance ? String(currentEditItem.balance) : '0',
        icon: currentEditItem.icon || 'credit-card',
        color: currentEditItem.color || '#3b82f6'
      });
    } else {
      // Если это новый счет, устанавливаем значения по умолчанию
      setFormData({
        name: '',
        balance: '0',
        icon: 'credit-card',
        color: '#3b82f6'
      });
    }
  }, [currentEditItem, isAccountModalOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'balance') {
      // Проверяем, что введено число
      if (value === '' || !isNaN(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }));
  };
  
  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Пожалуйста, введите название счета');
      return;
    }
    
    const accountData = {
      ...formData,
      balance: parseFloat(formData.balance || 0)
    };
    
    try {
      console.log('Отправляем данные счета:', accountData);
      
      if (currentEditItem) {
        // Сначала пробуем через API, а если не выйдет - локально
        dispatch(updateAccount(accountData))
          .unwrap()
          .then(() => {
            toast.success('Счет успешно обновлен');
            dispatch(closeAccountModal());
          })
          .catch((error) => {
            console.log('Ошибка API при обновлении счета, используем локальное обновление:', error);
            dispatch(updateAccountLocal(accountData));
            toast.info('Счет обновлен локально (без сервера)');
            dispatch(closeAccountModal());
          });
      } else {
        // Сначала пробуем через API, а если не выйдет - локально
        dispatch(addAccount(accountData))
          .unwrap()
          .then(() => {
            toast.success('Счет успешно добавлен');
            dispatch(closeAccountModal());
          })
          .catch((error) => {
            console.log('Ошибка API при добавлении счета, используем локальное добавление:', error);
            dispatch(addAccountLocal(accountData));
            toast.info('Счет добавлен локально (без сервера)');
            dispatch(closeAccountModal());
          });
      }
    } catch (error) {
      console.error('Ошибка при работе со счетами:', error);
      toast.error('Произошла ошибка: ' + (error.message || 'Неизвестная ошибка'));
    }
  };
  
  if (!isAccountModalOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-800 md:bg-black/50">
      <div className="flex items-end md:items-center justify-center min-h-screen">
        <div className="w-full md:max-w-md bg-dark-800 rounded-t-2xl md:rounded-2xl shadow-xl relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <h2 className="text-xl font-semibold">
              {currentEditItem ? 'Редактировать' : 'Новый'} счет
            </h2>
            <button
              onClick={() => dispatch(closeAccountModal())}
              className="p-2 hover:bg-dark-700 rounded-full"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {/* Название счета */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название счета
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Основная карта"
                className="w-full p-3 bg-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Начальный баланс */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начальный баланс
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full p-3 bg-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                />
                <div className="absolute right-3 top-3 text-gray-400">₸</div>
              </div>
            </div>
            
            {/* Выбор иконки */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Иконка
              </label>
              <div className="grid grid-cols-4 gap-3">
                {ICON_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleIconSelect(option.value)}
                    className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${
                      formData.icon === option.value 
                        ? 'bg-primary-500/20 ring-2 ring-primary-500' 
                        : 'bg-dark-700 hover:bg-dark-600'
                    }`}
                  >
                    <div className="text-gray-300 mb-1">{option.icon}</div>
                    <span className="text-xs text-gray-400">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Выбор цвета */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цвет
              </label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleColorSelect(option.value)}
                    className={`w-10 h-10 rounded-full cursor-pointer transition-all ${
                      formData.color === option.value ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
                    }`}
                    style={{ backgroundColor: option.value }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Предпросмотр */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Предпросмотр</h3>
              <div className="p-4 rounded-xl relative overflow-hidden" style={{ backgroundColor: formData.color }}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                    {ICON_OPTIONS.find(i => i.value === formData.icon)?.icon || <FiCreditCard size={20} />}
                  </div>
                  <div>
                    <div className="font-medium text-white">{formData.name || 'Название счета'}</div>
                    <div className="text-sm text-white/70">{parseFloat(formData.balance || 0).toLocaleString('ru-RU')} ₸</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Кнопки */}
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => dispatch(closeAccountModal())}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {currentEditItem ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountModal; 