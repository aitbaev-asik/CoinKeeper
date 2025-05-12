import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loadUserProfile } from './store/slices/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import TransactionModal from './components/transactions/TransactionModal';
import CategoryModal from './components/categories/CategoryModal';
import AccountModal from './components/accounts/AccountModal';
import AccountsListModal from './components/accounts/AccountsListModal';
import { closeModals } from './store/slices/uiSlice';
import { initializeCategories } from './store/slices/categoriesSlice';
import { initializeAccounts, createDefaultAccounts } from './store/slices/accountsSlice';

// Создаем встроенный компонент 404
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-dark-800 p-4">
    <div className="max-w-md w-full text-center space-y-6 bg-dark-700 rounded-lg shadow-card p-8">
      <h1 className="text-4xl font-bold text-gradient">404</h1>
      <h2 className="text-2xl font-medium text-white">Страница не найдена</h2>
      <p className="text-gray-400">
        Запрашиваемая страница не существует или была перемещена.
      </p>
      <div className="pt-4">
        <Link 
          to="/" 
          className="btn btn-primary inline-block"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  </div>
);

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return <div className="loading-screen">Загрузка...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { isTransactionModalOpen, isAccountModalOpen, isCategoryModalOpen, isAccountsListModalOpen } = useSelector(state => state.ui);
  
  // Получаем текущую тему из хранилища Redux
  const { theme } = useSelector(state => state.settings);
  
  useEffect(() => {
    // Если есть токен, но нет полных данных пользователя - загружаем профиль
    if (user && (!user.first_name || !user.username)) {
      dispatch(loadUserProfile());
    }
  }, [dispatch, user]);
  
  // Закрываем модалки при смене роута
  useEffect(() => {
    dispatch(closeModals());
  }, [location.pathname, dispatch]);
  
  // Инициализируем счета и категории при первом запуске приложения
  useEffect(() => {
    console.log('App: проверка наличия пользователя для инициализации данных');
    if (user) {
      console.log('App: обнаружен авторизованный пользователь, инициализируем данные');
      // Проверяем, есть ли уже категории и счета в localStorage
      const storedCategories = localStorage.getItem('wallet_categories');
      const storedAccounts = localStorage.getItem('wallet_accounts');
      
      const initData = async () => {
        try {
          // Инициализация категорий
          if (!storedCategories) {
            console.log('App: категории не найдены, инициализируем');
            await dispatch(initializeCategories()).unwrap();
          }
          
          // Инициализация счетов
          if (!storedAccounts) {
            console.log('App: счета не найдены, инициализируем и создаем стандартные');
            await dispatch(initializeAccounts()).unwrap();
            await dispatch(createDefaultAccounts()).unwrap();
          }
        } catch (error) {
          console.error('App: ошибка при инициализации данных:', error);
        }
      };
      
      initData();
    }
  }, [user, dispatch]);

  // Устанавливаем класс темы на documentElement
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <>
      <Routes>
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stats" element={<StatisticsPage />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Модальные окна */}
      {isTransactionModalOpen && <TransactionModal />}
      {isAccountModalOpen && <AccountModal />}
      {isCategoryModalOpen && <CategoryModal />}
      {isAccountsListModalOpen && <AccountsListModal />}
      
      {/* Тосты для уведомлений */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <AppContent />
      </div>
    </Router>
  );
};

export default App;