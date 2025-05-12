import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

// Create axios instance with our Django backend
const apiClient = axios.create({
  baseURL: `${API_URL}/api/`, // Берем URL из конфига, он уже содержит нужный порт
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд тайм-аут
});

// Проверка соединения с сервером
export const checkServerConnection = async () => {
  console.log('Проверка соединения с сервером...');
  try {
    // Пробуем сделать запрос к API
    try {
      const response = await axios.get(`${API_URL}/api/public/health-check/`, { 
        timeout: 3000,
        // Не передаем headers, чтобы не было автоматической авторизации
        headers: { 'Content-Type': 'application/json' },
        // Не перехватывать 401 ошибку через глобальный перехватчик
        _skipErrorHandler: true
      });
      console.log('Соединение с сервером установлено:', response.status);
      return true;
    } catch (error) {
      // Если мы получили любой ответ от сервера, включая 401, значит сервер работает
      if (error.response) {
        console.log('Получен ответ от сервера с ошибкой:', error.response.status);
        // Коды 401, 404 означают, что сервер работает, но эндпоинт недоступен или требует авторизации
        return true;
      }
      
      // Если нет ответа, значит проблема с соединением
      throw error;
    }
  } catch (error) {
    console.error('Ошибка соединения с сервером:', error.message);
    toast.error('Сервер недоступен. Приложение может работать некорректно', {
      position: 'top-right',
      autoClose: 5000,
    });
    return false;
  }
};

// Вызываем проверку соединения при загрузке приложения
checkServerConnection();

// Request interceptor to add auth token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data ? 'с данными:' : '', config.data || '');
    
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const token = userData.access;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token added to request:', token.substring(0, 15) + '...');
        } else {
          console.warn('No access token found in user data');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    } else {
      console.warn('No user data found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`, response.data ? 'с данными:' : '', 
      response.data ? (Array.isArray(response.data) ? `[${response.data.length} items]` : response.data) : '');
    return response;
  },
  async (error) => {
    // Если запрос помечен флагом _skipErrorHandler, пропускаем обработку ошибки
    if (error.config && error.config._skipErrorHandler) {
      return Promise.reject(error);
    }
    
    console.error('API Error:', error.message);
    
    // Проверка, является ли ошибка ошибкой сети
    if (error.message.includes('Network Error') || error.code === 'ECONNABORTED') {
      console.error('Обнаружена ошибка сети или тайм-аут');
      toast.error('Ошибка соединения с сервером');
      
      // Помечаем ошибку как сетевую для корректной обработки в API-функциях
      error.isNetworkError = true;
      return Promise.reject(error);
    }
    
    // Детальное логирование ошибок
    if (error.response) {
      console.error(`Status: ${error.response.status}, URL: ${error.config?.url}`);
      if (error.response.data) {
        console.error('Error data:', error.response.data);
      }
      
      // Показываем уведомление только для серьезных ошибок
      if (error.response.status === 500) {
        toast.error('Ошибка сервера: пожалуйста, попробуйте позже');
      } else if (error.response.status === 403) {
        toast.error('Доступ запрещен');
      } else if (error.response.status === 404) {
        console.error('Ресурс не найден:', error.config?.url);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      toast.error('Нет ответа от сервера');
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Attempting to refresh token...');
      
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.refresh) {
          console.error('No refresh token available');
          toast.error('Сессия истекла. Пожалуйста, войдите снова');
          throw new Error('No refresh token available');
        }
        
        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
          refresh: user.refresh,
        });
        
        console.log('Token refreshed successfully');
        toast.info('Сессия обновлена');
        
        // Update stored token
        user.access = response.data.access;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        toast.error('Ошибка авторизации. Пожалуйста, войдите снова');
        
        // Сохраняем исходную ошибку для обработки в API функциях
        error.authError = true;
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// For demo without actual backend we'll simulate API calls
export const createMockApi = (entityName, mockData = [], delay = 500) => {
  return {
    getAll: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockData });
        }, delay);
      });
    },
    getById: (id) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const item = mockData.find(item => item.id === id);
          if (item) {
            resolve({ data: item });
          } else {
            reject({ response: { data: { message: `${entityName} не найден` } } });
          }
        }, delay);
      });
    },
    add: (item) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newItem = { ...item, id: Date.now().toString() };
          resolve({ data: newItem });
        }, delay);
      });
    },
    update: (item) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = mockData.findIndex(i => i.id === item.id);
          if (index !== -1) {
            resolve({ data: item });
          } else {
            reject({ response: { data: { message: `${entityName} не найден` } } });
          }
        }, delay);
      });
    },
    delete: (id) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = mockData.findIndex(i => i.id === id);
          if (index !== -1) {
            resolve({ data: null });
          } else {
            reject({ response: { data: { message: `${entityName} не найден` } } });
          }
        }, delay);
      });
    },
  };
};

export default apiClient;