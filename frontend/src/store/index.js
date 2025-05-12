import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoriesReducer from './slices/categoriesSlice';
import accountsReducer, { accountsMiddleware } from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';
import dashboardReducer, { dashboardMiddleware } from './slices/dashboardSlice';
import filtersReducer from './slices/filtersSlice';
import uiReducer from './slices/uiSlice';

// Создаем Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    accounts: accountsReducer,
    transactions: transactionsReducer,
    dashboard: dashboardReducer,
    filters: filtersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(accountsMiddleware, dashboardMiddleware),
  // Опционально: devTools и другие настройки
});

export default store; 