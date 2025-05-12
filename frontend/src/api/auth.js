import axios from 'axios';
import { API_URL } from '../config';

const AUTH_API_URL = `${API_URL}/api/auth`;

// Создаем инстанс axios с перехватчиками
const api = axios.create({
  baseURL: AUTH_API_URL,
});

// Перехватчик запросов - добавляет токен авторизации
api.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.access) {
      config.headers.Authorization = `Bearer ${user.access}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Перехватчик ответов - обрабатывает истечение токена
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и не было попытки обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const newTokens = await authApi.refreshToken();
        
        // Если успешно, повторяем запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновление не удалось - разлогиниваем пользователя
        authApi.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const authApi = {
    async register(userData) {
        try {
            const response = await api.post('/register/', userData);
            if (response.data.access) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async login(username, password) {
        try {
            const response = await api.post('/login/', {
                username,
                password,
            });
            if (response.data.access) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    logout() {
        try {
            // Пытаемся отправить запрос на logout
            api.post('/logout/', {
                refresh: JSON.parse(localStorage.getItem('user') || '{}').refresh
            }).catch(() => {});
        } finally {
            // Всегда удаляем данные из localStorage
            localStorage.removeItem('user');
        }
    },

    async refreshToken() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user?.refresh) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${AUTH_API_URL}/token/refresh/`, {
                refresh: user.refresh,
            });

            const newUser = {
                ...user,
                access: response.data.access,
                // Если сервер возвращает новый refresh токен
                refresh: response.data.refresh || user.refresh,
            };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        } catch (error) {
            this.logout();
            throw this.handleError(error);
        }
    },

    async getProfile() {
        try {
            const response = await api.get('/profile/');
            // Объединяем данные профиля с токенами
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { 
                ...response.data,
                access: user.access,
                refresh: user.refresh 
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    handleError(error) {
        if (error.response) {
            const errorMessage = error.response.data.detail || 
                                error.response.data.error || 
                                error.response.data.message || 
                                'Произошла ошибка';
            return {
                message: errorMessage,
                status: error.response.status,
            };
        } else if (error.request) {
            return {
                message: 'Нет ответа от сервера. Проверьте подключение.',
                status: 0,
            };
        } else {
            return {
                message: error.message || 'Неизвестная ошибка',
                status: 0,
            };
        }
    },
};

export default authApi; 