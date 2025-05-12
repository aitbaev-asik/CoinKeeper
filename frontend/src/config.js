// Конфигурационные константы для приложения

// Определение URL сервера (для разработки и продакшена)
export const SERVER_URL = import.meta.env.VITE_API_URL || 'https://iot-app.beeline.kz/api/';

// API URL для подключения к бэкенду - обновлен для домена
export const API_URL = SERVER_URL;

// API пути
export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/token/',
    REFRESH: '/api/auth/token/refresh/',
    REGISTER: '/api/auth/register/',
    PROFILE: '/api/auth/profile/',
  },
  TRANSACTIONS: '/api/transactions/',
  CATEGORIES: '/api/categories/',
  ACCOUNTS: '/api/accounts/',
  STATISTICS: '/api/transactions/statistics/',
};

// Настройки для токенов авторизации
export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Тайминги
export const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 минуты в миллисекундах
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут в миллисекундах 