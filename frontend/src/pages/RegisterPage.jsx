import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../store/slices/authSlice';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    // Clear any previous auth errors
    dispatch(clearError());
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [dispatch, isAuthenticated, navigate]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear password match error when user types
    if (['password', 'password2'].includes(e.target.name)) {
      setPasswordError('');
    }
  };
  
  // Функция для обработки успешной регистрации
  const handleSuccessfulRegistration = () => {
    console.log('Регистрация успешна! Загружаем данные пользователя...');
    // Перенаправление на дашборд сработает автоматически благодаря useEffect
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    
    // Split name into first_name and last_name
    const nameParts = formData.username.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    
    dispatch(registerUser({
      ...formData,
      first_name,
      last_name,
    }))
      .unwrap()
      .then(() => {
        // Успешная регистрация
        handleSuccessfulRegistration();
      })
      .catch((error) => {
        console.error('Ошибка при регистрации:', error);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-dark-700 rounded-lg shadow-card">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold text-gradient">WalletApp</h1>
          <p className="mt-2 text-gray-400">Создайте аккаунт</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full p-3 bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-dark-600"
                placeholder="Введите имя пользователя"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full p-3 bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-dark-600"
                placeholder="Введите ваш email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full p-3 bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-dark-600"
                placeholder="Придумайте пароль"
              />
            </div>
            
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-300">
                Подтверждение пароля
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password2}
                onChange={handleChange}
                className="mt-1 block w-full p-3 bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-dark-600"
                placeholder="Повторите пароль"
              />
            </div>
          </div>
          
          {(error || passwordError) && (
            <div className="text-accent-500 text-sm text-center">
              {passwordError || error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all flex items-center justify-center"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
          
          <div className="text-center text-gray-400 text-sm">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;