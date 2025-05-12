import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

const SimpleAccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для загрузки счетов напрямую через axios
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Получаем токен из localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.access;

      console.log('Попытка получения счетов напрямую через API');
      
      // Выполняем запрос с токеном, если он есть
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/accounts/`, { headers });
      
      console.log('Ответ API:', response.data);
      setAccounts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при получении счетов:', error);
      setError(error.message || 'Ошибка при получении счетов');
      setLoading(false);
      
      // Если API недоступен, используем локальные данные
      try {
        const localAccounts = localStorage.getItem('wallet_accounts');
        if (localAccounts) {
          console.log('Используем локальные счета из localStorage');
          setAccounts(JSON.parse(localAccounts));
        } else {
          console.log('Локальные счета не найдены');
        }
      } catch (e) {
        console.error('Ошибка при чтении локальных счетов:', e);
      }
    }
  };

  // Загрузка счетов при монтировании компонента
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Обработчик для повторной загрузки данных
  const handleRefresh = () => {
    fetchAccounts();
  };

  return (
    <div className="mt-4 p-4 bg-dark-800 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Простой список счетов</h2>
      
      {loading && (
        <div className="text-center py-4">
          <div className="loader mx-auto mb-2"></div>
          <p>Загрузка счетов...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={handleRefresh}
            className="btn btn-sm btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      )}
      
      {!loading && !error && accounts.length === 0 && (
        <div className="text-center py-4">
          <p>Счета не найдены</p>
          <p className="text-sm text-gray-400 mt-2">
            Создайте новый счет, чтобы отслеживать баланс
          </p>
        </div>
      )}
      
      {!loading && !error && accounts.length > 0 && (
        <div>
          <p className="mb-3">Найдено счетов: {accounts.length}</p>
          
          <pre className="bg-dark-700 p-3 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify(accounts, null, 2)}
          </pre>
          
          <ul className="mt-4 space-y-2">
            {accounts.map(account => (
              <li key={account.id} className="p-3 bg-dark-700 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{account.name || 'Счет без названия'}</h3>
                    <p className="text-sm text-gray-400">ID: {account.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{parseFloat(account.balance || 0).toLocaleString('ru-RU')} ₸</p>
                    <p className="text-xs text-gray-400">Иконка: {account.icon || '-'}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4 flex justify-center">
        <button 
          onClick={handleRefresh}
          className="btn btn-primary"
        >
          Обновить данные
        </button>
      </div>
    </div>
  );
};

export default SimpleAccountsList; 