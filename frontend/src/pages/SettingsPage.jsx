import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CategoryList from '../components/categories/CategoryList';
import { openCategoryModal } from '../store/slices/uiSlice';
import { FiPlus, FiRefreshCw, FiLoader, FiMoon, FiSun } from 'react-icons/fi';
import { 
  fetchCategories, 
  createDefaultCategories
} from '../store/slices/categoriesSlice';
import { setTheme, setCurrency, toggleNotifications } from '../store/slices/settingsSlice';
import { API_URL } from '../config';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { items: categories, loading, error } = useSelector(state => state.categories);
  const settings = useSelector(state => state.settings);
  const [resetting, setResetting] = useState(false);
  const [isServerAvailable, setServerAvailable] = useState(false);
  
  // Загружаем категории при монтировании компонента
  useEffect(() => {
    dispatch(fetchCategories());
    
    // Проверяем доступность сервера
    const checkServer = async () => {
      try {
        try {
          // Используем fetch API с опцией проверки статуса вручную
          const response = await fetch(`${API_URL}/api/public/health-check/`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Любой ответ от сервера, включая 401, означает что сервер работает
          console.log('Статус ответа от сервера:', response.status);
          if (response.status === 401 || response.status === 200 || response.status === 404) {
            console.log('Сервер доступен (статус '+ response.status +')');
            setServerAvailable(true);
            return;
          }
          
          setServerAvailable(response.ok);
        } catch (fetchError) {
          console.error('Ошибка fetch:', fetchError);
          
          // Если первый запрос не удался, пробуем другой URL
          try {
            const response = await fetch(`${API_URL}/api/`, { method: 'GET' });
            console.log('Запрос к корневому URL вернул статус:', response.status);
            
            // Если получили любой ответ, значит сервер доступен
            setServerAvailable(true);
          } catch (error) {
            console.error('Сервер полностью недоступен:', error);
            setServerAvailable(false);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке сервера:', error);
        setServerAvailable(false);
      }
    };
    
    checkServer();
  }, [dispatch]);
  
  // Separate categories by type
  const incomeCategories = categories.filter(category => category.type === 'income');
  const expenseCategories = categories.filter(category => category.type === 'expense');
  
  // Сброс категорий к стандартным
  const handleResetCategories = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все категории к стандартным? Это действие нельзя отменить и может повлиять на ваши существующие транзакции.')) {
      setResetting(true);
      dispatch(createDefaultCategories())
        .unwrap()
        .then(() => {
          setResetting(false);
          alert('Категории были успешно сброшены к стандартным.');
        })
        .catch((error) => {
          setResetting(false);
          alert(`Ошибка при сбросе категорий: ${error}`);
        });
    }
  };

  // Обработчики для настроек
  const handleThemeChange = (theme) => {
    dispatch(setTheme(theme));
  };

  const handleCurrencyChange = (e) => {
    dispatch(setCurrency(e.target.value));
  };

  const handleNotificationsToggle = () => {
    dispatch(toggleNotifications());
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Настройки</h1>
        
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors flex items-center"
            onClick={handleResetCategories}
            disabled={resetting || loading}
          >
            {resetting ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Сброс...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Сбросить категории
              </>
            )}
          </button>
          
          <button 
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
            onClick={() => dispatch(openCategoryModal())}
            disabled={loading}
          >
            <FiPlus className="mr-2" />
            Добавить категорию
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-accent-500 text-white p-4 rounded-lg mb-6">
          Ошибка: {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <FiLoader size={32} className="animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-lg">Загрузка категорий...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Категории доходов</h2>
              <span className="bg-dark-600 text-xs px-2 py-1 rounded">
                {incomeCategories.length} {incomeCategories.length === 1 ? 'категория' : 
                  incomeCategories.length >= 2 && incomeCategories.length <= 4 ? 'категории' : 'категорий'}
              </span>
            </div>
            
            <CategoryList 
              categories={incomeCategories} 
              type="income"
            />
          </div>
          
          {/* Expense Categories */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Категории расходов</h2>
              <span className="bg-dark-600 text-xs px-2 py-1 rounded">
                {expenseCategories.length} {expenseCategories.length === 1 ? 'категория' : 
                  expenseCategories.length >= 2 && expenseCategories.length <= 4 ? 'категории' : 'категорий'}
              </span>
            </div>
            
            <CategoryList 
              categories={expenseCategories}
              type="expense"
            />
          </div>
        </div>
      )}
      
      {/* User Preferences */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4">Предпочтения</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Режим хранения данных</h3>
              <p className="text-sm text-gray-400">
                Данные хранятся на сервере
              </p>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center mr-3 ${!isServerAvailable ? 'text-gray-500' : ''}`}>
                <div className={`w-3 h-3 rounded-full mr-1 ${isServerAvailable ? 'bg-success-500' : 'bg-accent-500'}`}></div>
                <span className="text-xs">Сервер {isServerAvailable ? 'доступен' : 'недоступен'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Валюта</h3>
              <p className="text-sm text-gray-400">Выберите основную валюту</p>
            </div>
            
            <select 
              className="p-2 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={settings.currency}
              onChange={handleCurrencyChange}
            >
              <option value="KZT">₸ (KZT)</option>
              <option value="RUB">₸ (RUB)</option>
              <option value="USD">$ (USD)</option>
              <option value="EUR">€ (EUR)</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <div className="mb-3">
              <h3 className="font-medium">Тема</h3>
              <p className="text-sm text-gray-400">Выберите тему оформления</p>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <button 
                className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                  settings.theme === 'light' 
                    ? 'bg-blue-50 border-2 border-primary-500 text-primary-600 scale-105 shadow-lg' 
                    : 'border-2 border-dark-600 bg-dark-700 opacity-60 hover:opacity-100'
                }`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-yellow-500 mb-2">
                  <FiSun size={24} />
                </div>
                <span className="text-sm font-medium">Светлая</span>
              </button>
              
              <button 
                className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                  settings.theme === 'dark' 
                    ? 'bg-dark-600 border-2 border-primary-500 text-primary-400 scale-105 shadow-lg' 
                    : 'border-2 border-dark-600 bg-dark-700 opacity-60 hover:opacity-100'
                }`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-indigo-300 mb-2">
                  <FiMoon size={18} />
                </div>
                <span className="text-sm font-medium">Темная</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Уведомления</h3>
              <p className="text-sm text-gray-400">Включить уведомления о расходах</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notifications}
                onChange={handleNotificationsToggle}
              />
              <div className="w-11 h-6 bg-dark-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dark-900 after:border-dark-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;