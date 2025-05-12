import { createSlice } from '@reduxjs/toolkit';

// Получаем сохраненную тему из localStorage или используем темную по умолчанию
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme || 'dark';
};

// Применяем класс к body для переключения темы
const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
    document.documentElement.classList.remove('dark-theme');
  } else {
    document.documentElement.classList.add('dark-theme');
    document.documentElement.classList.remove('light-theme');
  }
  // Сохраняем выбор в localStorage
  localStorage.setItem('theme', theme);
};

// Применяем тему при инициализации
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const initialState = {
  theme: initialTheme,
  currency: 'KZT',
  notifications: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme(action.payload);
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
  },
});

export const { setTheme, setCurrency, toggleNotifications } = settingsSlice.actions;
export default settingsSlice.reducer; 