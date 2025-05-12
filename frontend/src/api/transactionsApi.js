import axios from 'axios';
import { API_URL, API_PATHS } from '../config';

// Создание экземпляра axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Проверка наличия токена и добавление его в заголовки
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.access) {
      config.headers['Authorization'] = `Bearer ${user.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Вспомогательная функция для преобразования значений в числовой формат
const ensureNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// API для работы с транзакциями
const transactionsApi = {
  // Получить все транзакции с возможностью фильтрации
  getAll: async (params = {}) => {
    console.log('API: Getting all transactions with params:', params);
    let url = API_PATHS.TRANSACTIONS;
    
    // Добавляем параметры запроса, если они есть
    const queryParams = new URLSearchParams();
    
    if (params.type) queryParams.append('type', params.type);
    if (params.category) queryParams.append('category', params.category);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.amount_min) queryParams.append('amount_min', params.amount_min);
    if (params.amount_max) queryParams.append('amount_max', params.amount_max);
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    try {
      const response = await api.get(url);
      console.log('API: Got transactions response:', response);
      return response;
    } catch (error) {
      console.error('API: Error getting transactions:', error);
      throw error;
    }
  },
  
  // Получить транзакцию по ID
  getById: async (id) => {
    console.log(`API: Getting transaction by ID: ${id}`);
    try {
      const response = await api.get(`${API_PATHS.TRANSACTIONS}${id}/`);
      console.log('API: Got transaction response:', response);
      return response;
    } catch (error) {
      console.error('API: Error getting transaction by ID:', error);
      throw error;
    }
  },
  
  // Добавить новую транзакцию
  add: async (transaction) => {
    console.log('API: Adding new transaction:', transaction);
    
    // Дополнительная проверка типов данных перед отправкой
    const preparedTransaction = {
      ...transaction,
      // Убедимся, что amount - число
      amount: typeof transaction.amount === 'string' 
        ? parseFloat(transaction.amount) 
        : transaction.amount,
        
      // Убедимся, что account - число
      account: ensureNumber(transaction.account),
      
      // Убедимся, что category - число или null (не строка)
      category: ensureNumber(transaction.category),
      
      // Убедимся, что destination_account - число или null (для переводов)
      destination_account: ensureNumber(transaction.destination_account),
      
      // Убедимся, что tags существует и является массивом
      tags: Array.isArray(transaction.tags) ? transaction.tags : []
    };
    
    // Удаляем лишние поля
    delete preparedTransaction.toAccount; // Используем только destination_account
    
    console.log('API: Prepared transaction for sending:', preparedTransaction);
    console.log('API: Категория перед отправкой:', preparedTransaction.category, 'тип:', typeof preparedTransaction.category);
    
    try {
      // Если это перевод между счетами, используем специальный эндпоинт
      if (preparedTransaction.type === 'transfer' && preparedTransaction.destination_account) {
        console.log('API: Creating transfer transaction');
        const response = await api.post(`${API_PATHS.TRANSACTIONS}transfer/`, preparedTransaction);
        console.log('API: Transfer transaction response:', response);
        return response;
      }
      
      // Для обычных транзакций используем стандартный эндпоинт
      const response = await api.post(API_PATHS.TRANSACTIONS, preparedTransaction);
      console.log('API: Transaction added response:', response);
      return response;
    } catch (error) {
      console.error('API: Error adding transaction:', error);
      throw error;
    }
  },
  
  // Обновить существующую транзакцию
  update: async (transaction) => {
    console.log(`API: Updating transaction ID ${transaction.id}:`, transaction);
    
    // Дополнительная проверка типов данных перед отправкой
    const preparedTransaction = {
      ...transaction,
      // Убедимся, что id - число
      id: ensureNumber(transaction.id),
      
      // Убедимся, что amount - число
      amount: typeof transaction.amount === 'string' 
        ? parseFloat(transaction.amount) 
        : transaction.amount,
        
      // Убедимся, что account - число
      account: ensureNumber(transaction.account),
      
      // Убедимся, что category - число или null (не строка)
      category: ensureNumber(transaction.category),
      
      // Убедимся, что destination_account - число или null (для переводов)
      destination_account: ensureNumber(transaction.destination_account),
      
      // Убедимся, что tags существует и является массивом
      tags: Array.isArray(transaction.tags) ? transaction.tags : []
    };
    
    // Удаляем лишние поля
    delete preparedTransaction.toAccount; // Используем только destination_account
    
    console.log('API: Prepared transaction for update:', preparedTransaction);
    console.log('API: Категория перед обновлением:', preparedTransaction.category, 'тип:', typeof preparedTransaction.category);
    
    try {
      // Проверяем, заканчивается ли путь на слеш
      const url = `${API_PATHS.TRANSACTIONS}${preparedTransaction.id}/`;
      console.log('Sending PUT request to URL:', url);
      
      const response = await api.put(url, preparedTransaction);
      console.log('API: Transaction update response:', response);
      return response;
    } catch (error) {
      console.error('API: Error updating transaction:', error);
      throw error;
    }
  },
  
  // Удалить транзакцию
  delete: async (id) => {
    // Убедимся, что ID - число
    const transactionId = ensureNumber(id);
    
    console.log(`API: Deleting transaction ID: ${transactionId}`);
    
    if (!transactionId && transactionId !== 0) {
      throw new Error('Недействительный ID транзакции');
    }
    
    try {
      // Проверяем, заканчивается ли путь на слеш
      const url = `${API_PATHS.TRANSACTIONS}${transactionId}/`;
      console.log('Sending DELETE request to URL:', url);
      
      const response = await api.delete(url);
      console.log('API: Transaction delete response:', response);
      return response;
    } catch (error) {
      console.error('API: Error deleting transaction:', error);
      throw error;
    }
  },
  
  // Получить статистику по транзакциям за период
  getStatistics: async (period = 'month') => {
    console.log(`API: Getting statistics for period: ${period}`);
    try {
      const response = await api.get(`${API_PATHS.STATISTICS}?period=${period}`);
      console.log('API: Statistics response:', response);
      return response;
    } catch (error) {
      console.error('API: Error getting statistics:', error);
      throw error;
    }
  },
  
  // Получить все категории
  getCategories: async () => {
    console.log('API: Getting all categories');
    try {
      const response = await api.get(API_PATHS.CATEGORIES);
      console.log('API: Categories response:', response);
      return response;
    } catch (error) {
      console.error('API: Error getting categories:', error);
      throw error;
    }
  },
  
  
  // Добавить новую категорию
  addCategory: async (category) => {
    console.log('API: Adding new category:', category);
    try {
      const response = await api.post(API_PATHS.CATEGORIES, category);
      console.log('API: Category added response:', response);
      return response;
    } catch (error) {
      console.error('API: Error adding category:', error);
      throw error;
    }
  },
  
  // Обновить существующую категорию
  updateCategory: async (category) => {
    // Убедимся, что ID - число
    const categoryId = ensureNumber(category.id);
    
    if (!categoryId && categoryId !== 0) {
      throw new Error('Недействительный ID категории');
    }
    
    console.log(`API: Updating category ID ${categoryId}:`, category);
    
    // Подготовим данные
    const preparedCategory = {
      ...category,
      id: categoryId
    };
    
    try {
      const url = `${API_PATHS.CATEGORIES}${categoryId}/`;
      console.log('Sending PUT request to URL:', url);
      
      const response = await api.put(url, preparedCategory);
      console.log('API: Category update response:', response);
      return response;
    } catch (error) {
      console.error('API: Error updating category:', error);
      throw error;
    }
  },
  
  // Удалить категорию
  deleteCategory: async (id) => {
    // Убедимся, что ID - число
    const categoryId = ensureNumber(id);
    
    if (!categoryId && categoryId !== 0) {
      throw new Error('Недействительный ID категории');
    }
    
    console.log(`API: Deleting category ID: ${categoryId}`);
    
    try {
      const url = `${API_PATHS.CATEGORIES}${categoryId}/`;
      console.log('Sending DELETE request to URL:', url);
      
      const response = await api.delete(url);
      console.log('API: Category delete response:', response);
      return response;
    } catch (error) {
      console.error('API: Error deleting category:', error);
      throw error;
    }
  },
  
  // Получить все счета
  getAccounts: async () => {
    console.log('API: Getting all accounts');
    try {
      const response = await api.get(API_PATHS.ACCOUNTS);
      console.log('API: Accounts response:', response);
      return response;
    } catch (error) {
      console.error('API: Error getting accounts:', error);
      throw error;
    }
  },
  
  // Добавить новый счет
  addAccount: async (account) => {
    console.log('API: Adding new account:', account);
    
    // Подготовим данные
    const preparedAccount = {
      ...account,
      // Убедимся, что balance - число
      balance: typeof account.balance === 'string' 
        ? parseFloat(account.balance) 
        : (account.balance || 0)
    };
    
    try {
      const response = await api.post(API_PATHS.ACCOUNTS, preparedAccount);
      console.log('API: Account added response:', response);
      return response;
    } catch (error) {
      console.error('API: Error adding account:', error);
      throw error;
    }
  },
  
  // Обновить существующий счет
  updateAccount: async (account) => {
    // Убедимся, что ID - число
    const accountId = ensureNumber(account.id);
    
    if (!accountId && accountId !== 0) {
      throw new Error('Недействительный ID счета');
    }
    
    console.log(`API: Updating account ID ${accountId}:`, account);
    
    // Подготовим данные
    const preparedAccount = {
      ...account,
      id: accountId,
      // Убедимся, что balance - число
      balance: typeof account.balance === 'string' 
        ? parseFloat(account.balance) 
        : (account.balance || 0)
    };
    
    try {
      const url = `${API_PATHS.ACCOUNTS}${accountId}/`;
      console.log('Sending PUT request to URL:', url);
      
      const response = await api.put(url, preparedAccount);
      console.log('API: Account update response:', response);
      return response;
    } catch (error) {
      console.error('API: Error updating account:', error);
      throw error;
    }
  },
  
  // Удалить счет
  deleteAccount: async (id) => {
    // Убедимся, что ID - число
    const accountId = ensureNumber(id);
    
    console.log(`API: Deleting account ID: ${accountId}`);
    
    if (!accountId && accountId !== 0) {
      throw new Error('Недействительный ID счета');
    }
    
    try {
      const url = `${API_PATHS.ACCOUNTS}${accountId}/`;
      console.log('Sending DELETE request to URL:', url);
      
      const response = await api.delete(url);
      console.log('API: Account delete response:', response);
      return response;
    } catch (error) {
      console.error('API: Error deleting account:', error);
      throw error;
    }
  },
};

export default transactionsApi;