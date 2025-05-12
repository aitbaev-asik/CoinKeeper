import apiClient, { createMockApi } from './axiosConfig';
import { initialCategories } from '../store/slices/categoriesSlice';
import { API_URL } from '../config';

// Вспомогательная функция для преобразования значений в числовой формат
const ensureNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Определение, используем ли локальное хранилище
const isUsingLocalStorage = () => {
  // Всегда возвращаем false, используем только серверное API
  return false;
};

// Real API functions for when backend is ready
const categoriesApiReal = {
  getAll: () => {
    console.log('Загрузка всех категорий с сервера');
    return apiClient.get('/categories/');
  },
  
  getById: (id) => {
    const numericId = ensureNumber(id);
    console.log(`Получение категории с ID: ${numericId} с сервера`);
    return apiClient.get(`/categories/${numericId}/`);
  },
  
  add: (category) => {
    console.log('Добавление новой категории на сервер:', category);
    return apiClient.post('/categories/', category);
  },
  
  update: (category) => {
    const numericId = ensureNumber(category.id);
    console.log(`Обновление категории с ID: ${numericId} на сервере`, category);
    return apiClient.put(`/categories/${numericId}/`, category);
  },
  
  delete: (id) => {
    const numericId = ensureNumber(id);
    console.log(`Удаление категории с ID: ${numericId} с сервера`);
    return apiClient.delete(`/categories/${numericId}/`);
  },
  
  createDefaults: () => {
    console.log('Создание категорий по умолчанию на сервере');
    return apiClient.post('/categories/create-defaults/');
  }
};

// Mock implementation for demo
// Use initialCategories as default mock data
const categoriesApiMock = {
  getAll: () => {
    return new Promise((resolve) => {
      // Get categories from localStorage or use initialCategories
      const storedCategories = localStorage.getItem('wallet_categories');
      let categories = storedCategories ? JSON.parse(storedCategories) : initialCategories;
      
      // Если нужно преобразовать существующие категории
      const convertedCategories = categories.map(cat => {
        // Если ID не строковое, оставляем как есть
        if (typeof cat.id !== 'string') return cat;
        
        // Если ID категории начинается с цифры, пытаемся преобразовать в число
        if (/^\d+$/.test(cat.id)) {
          return {
            ...cat,
            id: parseInt(cat.id, 10)
          };
        }
        
        // Если ID это cat_TIMESTAMP_RANDOM, генерируем числовой ID
        if (cat.id.startsWith('cat_')) {
          return {
            ...cat,
            id: Date.now() + Math.floor(Math.random() * 1000)
          };
        }
        
        // Для старых строковых ID, используем хеш-функцию
        let numericId = 0;
        for (let i = 0; i < cat.id.length; i++) {
          numericId = (numericId << 5) - numericId + cat.id.charCodeAt(i);
          numericId = numericId & numericId; // Преобразуем в 32-битное целое
        }
        numericId = Math.abs(numericId); // Убедимся, что ID положительный
        
        return {
          ...cat,
          id: numericId
        };
      });
      
      // Проверим, что все ID теперь числовые
      const allIdsAreNumeric = convertedCategories.every(cat => typeof cat.id === 'number');
      
      if (allIdsAreNumeric) {
        // Сохраняем преобразованные категории
        localStorage.setItem('wallet_categories', JSON.stringify(convertedCategories));
        categories = convertedCategories;
      }
      
      // If no categories in localStorage, save initialCategories
      if (!storedCategories) {
        localStorage.setItem('wallet_categories', JSON.stringify(categories));
      }
      
      console.log('Mock: Загрузка всех категорий из localStorage');
      setTimeout(() => {
        resolve({ data: categories });
      }, 500);
    });
  },
  
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const storedCategories = localStorage.getItem('wallet_categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : initialCategories;
      
      // Преобразуем ID в число для корректного сравнения
      const numericId = ensureNumber(id);
      console.log('Mock: Ищем категорию по ID:', id, 'преобразованный ID:', numericId);
      
      // Находим категорию с учетом преобразования типов ID
      const category = categories.find(cat => {
        const catId = ensureNumber(cat.id);
        return catId === numericId;
      });
      
      console.log('Mock: Найденная категория:', category);
      
      setTimeout(() => {
        if (category) {
          resolve({ data: category });
        } else {
          reject({ response: { data: { message: 'Категория не найдена' } } });
        }
      }, 500);
    });
  },
  
  add: (category) => {
    return new Promise((resolve) => {
      const storedCategories = localStorage.getItem('wallet_categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : initialCategories;
      
      // Генерируем числовой ID для новой категории
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      
      // Generate a random ID if not provided
      const newCategory = { 
        ...category, 
        id: category.id || newId
      };
      
      // Убедимся, что ID числовой
      if (typeof newCategory.id === 'string') {
        newCategory.id = parseInt(newCategory.id, 10) || newId;
      }
      
      console.log('Mock: Добавление новой категории в localStorage:', newCategory);
      const updatedCategories = [...categories, newCategory];
      localStorage.setItem('wallet_categories', JSON.stringify(updatedCategories));
      
      setTimeout(() => {
        resolve({ data: newCategory });
      }, 500);
    });
  },
  
  update: (category) => {
    return new Promise((resolve, reject) => {
      const storedCategories = localStorage.getItem('wallet_categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : initialCategories;
      
      // Преобразуем ID в число для корректного сравнения
      const numericId = ensureNumber(category.id);
      console.log('Mock: Обновляем категорию с ID:', category.id, 'преобразованный ID:', numericId);
      
      // Находим индекс категории с учетом преобразования типов ID
      const index = categories.findIndex(cat => {
        const catId = ensureNumber(cat.id);
        return catId === numericId;
      });
      
      if (index !== -1) {
        // Обновляем категорию, сохраняя числовой ID
        categories[index] = {
          ...category,
          id: numericId
        };
        localStorage.setItem('wallet_categories', JSON.stringify(categories));
        
        setTimeout(() => {
          resolve({ data: categories[index] });
        }, 500);
      } else {
        setTimeout(() => {
          reject({ response: { data: { message: 'Категория не найдена' } } });
        }, 500);
      }
    });
  },
  
  delete: (id) => {
    return new Promise((resolve, reject) => {
      const storedCategories = localStorage.getItem('wallet_categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : initialCategories;
      
      // Преобразуем ID в число для корректного сравнения
      const numericId = ensureNumber(id);
      console.log('Mock: Удаляем категорию с ID:', id, 'преобразованный ID:', numericId);
      
      // Находим индекс категории с учетом преобразования типов ID
      const index = categories.findIndex(cat => {
        const catId = ensureNumber(cat.id);
        return catId === numericId;
      });
      
      if (index !== -1) {
        // Фильтруем массив, убирая категорию с указанным ID
        const updatedCategories = categories.filter(cat => ensureNumber(cat.id) !== numericId);
        localStorage.setItem('wallet_categories', JSON.stringify(updatedCategories));
        
        setTimeout(() => {
          resolve({ data: null });
        }, 500);
      } else {
        setTimeout(() => {
          reject({ response: { data: { message: 'Категория не найдена' } } });
        }, 500);
      }
    });
  },
  
  createDefaults: () => {
    return new Promise((resolve) => {
      // Save initial categories to localStorage
      console.log('Mock: Создание категорий по умолчанию в localStorage');
      localStorage.setItem('wallet_categories', JSON.stringify(initialCategories));
      
      setTimeout(() => {
        resolve({ data: initialCategories });
      }, 500);
    });
  }
};

// Функция для определения, доступен ли сервер
const isServerAvailable = async () => {
  try {
    // Проверяем соединение с сервером
    const response = await fetch(`${API_URL}/api/health-check/`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.error('Сервер недоступен:', error);
    return false;
  }
};

// Создаем прокси для автоматического выбора API
// Теперь он всегда использует реальное API
const handler = {
  get: (target, prop) => {
    // Всегда используем реальное API
    const api = categoriesApiReal;
    
    // Логика для отслеживания ошибок и возможного резервного сохранения
    if (typeof api[prop] === 'function') {
      return async (...args) => {
        try {
          return await api[prop](...args);
        } catch (error) {
          console.error(`Ошибка API при выполнении ${prop}:`, error);
          
          // Сохраняем сообщение об ошибке для пользователя
          if (error.response) {
            const status = error.response.status;
            if (status === 401) {
              error.userMessage = 'Требуется авторизация';
            } else if (status === 403) {
              error.userMessage = 'Доступ запрещен';
            } else if (status === 404) {
              error.userMessage = 'Ресурс не найден';
            } else {
              error.userMessage = `Ошибка сервера: ${status}`;
            }
          } else {
            error.userMessage = 'Ошибка соединения с сервером';
          }
          
          throw error;
        }
      };
    }
    
    return api[prop];
  }
};

// Экспортируем прокси API
export default new Proxy({}, handler);