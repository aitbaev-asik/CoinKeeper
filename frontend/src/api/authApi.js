import apiClient, { createMockApi } from './axiosConfig';
import { nanoid } from 'nanoid';

// Normal API functions for when backend is ready
export const authApiReal = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getUser: () => apiClient.get('/auth/user'),
};

// Mock implementation for demo
export const authApi = {
  login: ({ email, password }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation for demo
        if (email && password) {
          const user = {
            id: nanoid(),
            email,
            name: email.split('@')[0],
            token: `mock-jwt-token-${nanoid()}`
          };
          resolve({ data: { user } });
        } else {
          reject({ 
            response: { 
              data: { 
                message: 'Неверный email или пароль' 
              } 
            } 
          });
        }
      }, 800);
    });
  },
  register: ({ email, password, name }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation for demo
        if (email && password && name) {
          const user = {
            id: nanoid(),
            email,
            name,
            token: `mock-jwt-token-${nanoid()}`
          };
          resolve({ data: { user } });
        } else {
          reject({ 
            response: { 
              data: { 
                message: 'Пожалуйста, заполните все поля' 
              } 
            } 
          });
        }
      }, 800);
    });
  },
  logout: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: null });
      }, 300);
    });
  },
};