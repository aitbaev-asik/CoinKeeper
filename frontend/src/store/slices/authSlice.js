import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../api/auth';

// Demo user data
const demoUser = {
  id: 'demo-user',
  email: 'demo@example.com',
  username: 'Demo User',
  first_name: 'Demo',
  last_name: 'User',
  access: 'demo-token',
  refresh: 'demo-refresh-token'
};

// Функция загрузки пользователя из localStorage
const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
};

// Проверка авторизации при загрузке страницы
const storedUser = loadUserFromStorage();
const isUserAuthenticated = !!storedUser?.access;

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Login attempt:', credentials.username);
      const response = await authApi.login(credentials.username, credentials.password);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      
      // Улучшенная обработка ошибок
      let errorMessage = 'Ошибка входа в систему';
      
      if (error.status === 401) {
        errorMessage = 'Неверное имя пользователя или пароль';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Некорректные данные для входа';
      } else if (error.status === 0) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Registration attempt:', userData.username);
      const response = await authApi.register(userData);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Улучшенная обработка ошибок регистрации
      let errorMessage = 'Ошибка при регистрации';
      
      if (error.status === 400) {
        if (error.message && error.message.includes('username')) {
          errorMessage = 'Пользователь с таким именем уже существует';
        } else if (error.message && error.message.includes('email')) {
          errorMessage = 'Пользователь с таким email уже существует';
        } else {
          errorMessage = error.message || 'Некорректные данные для регистрации';
        }
      } else if (error.status === 0) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
);

export const loadUserProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      return response;
    } catch (error) {
      console.error('Profile load error:', error);
      return rejectWithValue(error.message || 'Ошибка загрузки профиля');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    isAuthenticated: isUserAuthenticated,
    loading: false,
    error: null,
  },
  reducers: {
    // Мгновенный вход в демо-режим
    demoLogin: (state) => {
      state.user = demoUser;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(demoUser));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Profile
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        if (state.user?.access) {
          state.user = {
            ...action.payload,
            access: state.user.access,
            refresh: state.user.refresh
          };
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      });
  },
});

export const { demoLogin, clearError } = authSlice.actions;
export default authSlice.reducer;