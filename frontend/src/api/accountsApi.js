import apiClient from './axiosConfig';

// Стандартные начальные счета
export const initialAccounts = [
  {
    id: 'account_cash',
    name: 'Наличные',
    balance: 15000,
    icon: 'cash',
    color: '#10b981'
  },
  {
    id: 'account_card',
    name: 'Основная карта',
    balance: 42500,
    icon: 'credit-card',
    color: '#3b82f6'
  }
];

// Получение счетов из localStorage
const getLocalAccounts = () => {
  try {
    const storedAccounts = localStorage.getItem('wallet_accounts');
    if (storedAccounts) {
      const accounts = JSON.parse(storedAccounts);
      if (Array.isArray(accounts) && accounts.length > 0) {
        console.log('Получены счета из localStorage:', accounts.length);
        return accounts;
      }
    }
  } catch (e) {
    console.error('Ошибка при получении счетов из localStorage:', e);
  }
  
  // Если в localStorage ничего нет, используем стандартные счета
  console.log('Используем стандартные счета из initialAccounts');
  localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
  return initialAccounts;
};

// API implementation
export const accountsApi = {
  getAll: () => {
    console.log('API: Запрос всех счетов');
    return apiClient.get('accounts/')
      .then(response => {
        console.log('API: Получены счета:', response.data);
        // Сохраняем в localStorage для автономной работы
        if (Array.isArray(response.data)) {
          localStorage.setItem('wallet_accounts', JSON.stringify(response.data));
          console.log('Счета сохранены в localStorage:', response.data.length);
        }
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при получении счетов:', error);
        // Если API недоступен, используем локальные данные
        console.log('Создаем локальные данные из-за ошибки API');
        const localAccounts = getLocalAccounts();
        return Promise.resolve({ data: localAccounts });
      });
  },
  
  getById: (id) => {
    console.log(`API: Запрос счета по ID ${id}`);
    return apiClient.get(`accounts/${id}/`)
      .then(response => {
        console.log('API: Получен счет:', response.data);
        return response;
      })
      .catch(error => {
        console.error(`API: Ошибка при получении счета ${id}:`, error);
        // Пытаемся найти счет локально
        try {
          const localAccounts = getLocalAccounts();
          const account = localAccounts.find(acc => acc.id === id);
          if (account) {
            console.log('Найден локальный счет:', account);
            return Promise.resolve({ data: account });
          }
        } catch (e) {
          console.error('Ошибка при поиске локального счета:', e);
        }
        return Promise.reject(error);
      });
  },
  
  add: (account) => {
    console.log('API: Добавление счета:', account);
    const accountData = { 
      ...account,
      // Удаляем id, если он есть, чтобы бэкенд сам генерировал id
      id: undefined 
    };
    return apiClient.post('accounts/', accountData)
      .then(response => {
        console.log('API: Счет добавлен:', response.data);
        // Обновляем локальное хранилище
        try {
          const localAccounts = getLocalAccounts();
          localAccounts.push(response.data);
          localStorage.setItem('wallet_accounts', JSON.stringify(localAccounts));
        } catch (e) {
          console.error('Ошибка при обновлении localStorage:', e);
        }
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при добавлении счета:', error);
        // Если API недоступен, создаем локально
        const newAccount = {
          ...account,
          id: account.id || `account_${Date.now()}`
        };
        console.log('Создан локальный счет из-за ошибки API:', newAccount);
        
        try {
          const localAccounts = getLocalAccounts();
          localAccounts.push(newAccount);
          localStorage.setItem('wallet_accounts', JSON.stringify(localAccounts));
        } catch (e) {
          console.error('Ошибка при сохранении в localStorage:', e);
        }
        
        return Promise.resolve({ data: newAccount });
      });
  },
  
  update: (account) => {
    console.log('API: Обновление счета:', account);
    return apiClient.put(`accounts/${account.id}/`, account)
      .then(response => {
        console.log('API: Счет обновлен:', response.data);
        // Обновляем локальное хранилище
        try {
          const localAccounts = getLocalAccounts();
          const index = localAccounts.findIndex(acc => acc.id === account.id);
          if (index !== -1) {
            localAccounts[index] = response.data;
            localStorage.setItem('wallet_accounts', JSON.stringify(localAccounts));
          }
        } catch (e) {
          console.error('Ошибка при обновлении localStorage:', e);
        }
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при обновлении счета:', error);
        // Обновляем локально при ошибке
        try {
          const localAccounts = getLocalAccounts();
          const index = localAccounts.findIndex(acc => acc.id === account.id);
          if (index !== -1) {
            localAccounts[index] = account;
            localStorage.setItem('wallet_accounts', JSON.stringify(localAccounts));
          }
        } catch (e) {
          console.error('Ошибка при обновлении localStorage:', e);
        }
        return Promise.resolve({ data: account });
      });
  },
  
  delete: (id) => {
    console.log(`API: Удаление счета ${id}`);
    return apiClient.delete(`accounts/${id}/`)
      .then(response => {
        console.log('API: Счет удален');
        // Обновляем локальное хранилище
        try {
          const localAccounts = getLocalAccounts();
          const updatedAccounts = localAccounts.filter(acc => acc.id !== id);
          localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
        } catch (e) {
          console.error('Ошибка при обновлении localStorage:', e);
        }
        return response;
      })
      .catch(error => {
        console.error(`API: Ошибка при удалении счета ${id}:`, error);
        // Удаляем локально при ошибке
        try {
          const localAccounts = getLocalAccounts();
          const updatedAccounts = localAccounts.filter(acc => acc.id !== id);
          localStorage.setItem('wallet_accounts', JSON.stringify(updatedAccounts));
          return Promise.resolve({ data: null });
        } catch (e) {
          console.error('Ошибка при обновлении localStorage:', e);
          return Promise.reject(error);
        }
      });
  },
  
  createDefaults: () => {
    console.log('API: Создание стандартных счетов');
    return apiClient.post('accounts/create-defaults/')
      .then(response => {
        console.log('API: Стандартные счета созданы:', response.data);
        localStorage.setItem('wallet_accounts', JSON.stringify(response.data));
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при создании стандартных счетов:', error);
        // Возвращаем стандартные счета при ошибке
        console.log('Используем стандартные счета из-за ошибки API');
        localStorage.setItem('wallet_accounts', JSON.stringify(initialAccounts));
        return Promise.resolve({ data: initialAccounts });
      });
  },
  
  // Резервные методы, если API недоступно
  fallbackGetAll: () => {
    console.log('Fallback: Получение счетов из localStorage');
    return new Promise((resolve) => {
      const accounts = getLocalAccounts();
      console.log('Fallback: Использованы локальные данные счетов:', accounts.length);
      resolve({ data: accounts });
    });
  }
}; 