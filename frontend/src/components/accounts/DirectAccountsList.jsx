import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

// Непосредственное получение счетов из Django без Redux
const DirectAccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Получаем данные напрямую с бэкенда
  const fetchAccountsDirectly = async () => {
    setLoading(true);
    setError(null);

    try {
      // Получаем токен авторизации из localStorage
      let authHeader = {};
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          if (userData.access) {
            authHeader = {
              'Authorization': `Bearer ${userData.access}`
            };
            console.log("Добавляем токен авторизации:", userData.access.substring(0, 15) + '...');
          }
        }
      } catch (error) {
        console.error("Ошибка при получении токена:", error);
      }
      
      // Пытаемся получить данные
      console.log("Пробуем получить счета с сервера...");
      const response = await axios.get(`${API_URL}/api/accounts/`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        timeout: 5000 // 5 секунд тайм-аут
      });

      console.log("Успешно получены счета:", response.data);
      setAccounts(response.data || []);
    } catch (error) {
      console.error("Ошибка при получении счетов:", error);
      
      // Проверяем статус ошибки
      let errorMessage = "Не удалось подключиться к серверу";
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = "Требуется авторизация. Пожалуйста, войдите в систему.";
        } else if (status === 403) {
          errorMessage = "Доступ запрещен. У вас нет прав на просмотр счетов.";
        } else if (status === 404) {
          errorMessage = "API для счетов не найден.";
        } else {
          errorMessage = `Ошибка сервера: ${status}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем счета при монтировании компонента
  useEffect(() => {
    fetchAccountsDirectly();
  }, []);

  // Обработчик кнопки обновления
  const handleRefresh = () => {
    fetchAccountsDirectly();
  };

  // Если загрузка, показываем индикатор
  if (loading) {
    return (
      <div className="mt-4 p-6 bg-dark-800 rounded-xl text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
        <h2 className="text-xl font-bold">Загрузка счетов...</h2>
        <p className="text-sm text-gray-400 mt-2">Получаем данные с сервера</p>
      </div>
    );
  }

  // Сортировка счетов по балансу (от большего к меньшему)
  const sortedAccounts = [...accounts].sort((a, b) => {
    const balanceA = parseFloat(a.balance || 0);
    const balanceB = parseFloat(b.balance || 0);
    return balanceB - balanceA;
  });

  return (
    <div className="mt-4 p-4 bg-dark-800 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Прямое подключение к API</h2>
        <button 
          onClick={handleRefresh}
          className="btn btn-sm btn-primary"
        >
          Обновить
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 p-3 rounded-lg mb-4">
          <p className="font-bold text-red-400">Ошибка подключения к серверу</p>
          <p className="text-sm text-gray-300 mt-1">{error}</p>
        </div>
      )}
      
      <p className="mb-2 text-sm text-gray-400">
        {accounts.length > 0 
          ? `Найдено счетов: ${accounts.length}` 
          : "Счета не найдены"}
      </p>
      
      {accounts.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="py-2 px-4">ID</th>
                  <th className="py-2 px-4">Название</th>
                  <th className="py-2 px-4">Баланс</th>
                  <th className="py-2 px-4">Иконка</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map(account => (
                  <tr key={account.id} className="border-b border-dark-600 hover:bg-dark-700">
                    <td className="py-2 px-4 text-gray-400">{account.id}</td>
                    <td className="py-2 px-4">{account.name || "Без названия"}</td>
                    <td className="py-2 px-4 font-medium">
                      {parseFloat(account.balance || 0).toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="py-2 px-4 text-gray-400">{account.icon || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Детальные данные:</h3>
            <pre className="bg-dark-700 p-3 rounded-lg overflow-auto max-h-60 text-xs">
              {JSON.stringify(accounts, null, 2)}
            </pre>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-300">Счета не найдены</p>
          <p className="text-sm text-gray-400 mt-2">
            Попробуйте создать новый счет или обновить данные
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectAccountsList; 