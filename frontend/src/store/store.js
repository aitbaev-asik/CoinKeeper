import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import transactionsReducer from './slices/transactionsSlice';
import categoriesReducer from './slices/categoriesSlice';
import uiReducer from './slices/uiSlice';
import accountsReducer, { accountsMiddleware } from './slices/accountsSlice';
import dashboardReducer, { dashboardMiddleware } from './slices/dashboardSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer,
    ui: uiReducer,
    accounts: accountsReducer,
    dashboard: dashboardReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(accountsMiddleware, dashboardMiddleware),
});