import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { closeAccountsListModal, openAccountModal } from '../../store/slices/uiSlice';
import { deleteAccount } from '../../store/slices/accountsSlice';
import axios from 'axios';
import { API_URL } from '../../config';

const AccountsListModal = () => {
  const dispatch = useDispatch();
  const { isAccountsListModalOpen } = useSelector(state => state.ui);
  
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
          }
        }
      } catch (error) {
        console.error("Ошибка при получении токена:", error);
      }
      
      console.log("Получаем список счетов напрямую с сервера...");
      const response = await axios.get(`${API_URL}/api/accounts/`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        timeout: 5000 // 5 секунд тайм-аут
      });

      if (response.data && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        throw new Error("Некорректный формат данных от API");
      }
      setLoading(false);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAccountsListModalOpen) {
      fetchAccountsDirectly();
    }
  }, [isAccountsListModalOpen]);

  // Форматирование денежных значений
  const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRefresh = () => {
    fetchAccountsDirectly();
  };

  const handleEdit = (account) => {
    // Закрываем модальное окно списка и открываем окно редактирования
    dispatch(closeAccountsListModal());
    dispatch(openAccountModal(account));
  };

  const handleDelete = (accountId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот счет? Все связанные транзакции также будут удалены.')) {
      dispatch(deleteAccount(accountId))
        .unwrap()
        .then(() => {
          toast.success('Счет успешно удален');
          // Обновляем список счетов
          fetchAccountsDirectly();
        })
        .catch((error) => {
          console.error('Ошибка при удалении счета:', error);
          toast.error('Не удалось удалить счет: ' + (error.message || 'Неизвестная ошибка'));
        });
    }
  };

  const handleAddAccount = () => {
    dispatch(closeAccountsListModal());
    dispatch(openAccountModal());
  };

  if (!isAccountsListModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-800 md:bg-black/50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl bg-dark-800 rounded-xl shadow-xl relative">
          {/* Шапка */}
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <h2 className="text-xl font-semibold">Все счета</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-dark-700 rounded-full"
                title="Обновить"
              >
                <FiRefreshCw size={20} />
              </button>
              <button
                onClick={() => dispatch(closeAccountsListModal())}
                className="p-2 hover:bg-dark-700 rounded-full"
                title="Закрыть"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Основное содержимое */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                <h3 className="text-lg font-medium">Загрузка счетов...</h3>
                <p className="text-sm text-gray-400 mt-2">Получаем данные о ваших счетах</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg text-center">
                <p className="font-bold text-red-400 mb-2">Ошибка загрузки</p>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="btn btn-sm btn-primary"
                >
                  Попробовать снова
                </button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">У вас пока нет счетов</p>
                <button
                  onClick={handleAddAccount}
                  className="btn btn-primary"
                >
                  <FiPlus className="mr-2" size={18} />
                  Создать первый счет
                </button>
              </div>
            ) : (
              <>
                {/* Таблица со счетами */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-left text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Иконка</th>
                        <th className="px-4 py-3">Название</th>
                        <th className="px-4 py-3 text-right">Баланс</th>
                        <th className="px-4 py-3 text-center">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map(account => (
                        <tr key={account.id} className="border-t border-dark-600 hover:bg-dark-700/50">
                          <td className="px-4 py-4">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: account.color || '#3b82f6' }}
                            >
                              {/* Здесь можно добавить иконку, если необходимо */}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <h3 className="font-medium">{account.name}</h3>
                            <p className="text-xs text-gray-400">ID: {account.id}</p>
                          </td>
                          <td className="px-4 py-4 text-right font-bold">
                            {formatCurrency(account.balance)} ₸
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(account)}
                                className="p-2 hover:bg-dark-600 rounded-full"
                                title="Редактировать"
                              >
                                <FiEdit2 size={18} className="text-primary-400 hover:text-primary-300" />
                              </button>
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="p-2 hover:bg-dark-600 rounded-full"
                                title="Удалить"
                              >
                                <FiTrash2 size={18} className="text-red-400 hover:text-red-300" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Кнопка добавления счета */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAddAccount}
                    className="btn btn-primary"
                  >
                    <FiPlus className="mr-2" size={18} />
                    Добавить новый счет
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsListModal; 