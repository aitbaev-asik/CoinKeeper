import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, demoLogin, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
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
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };
  
  const handleDemoLogin = () => {
    dispatch(demoLogin());
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-dark-700 rounded-lg shadow-card">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold text-gradient">WalletApp</h1>
          <p className="mt-2 text-gray-400">Войдите в свой аккаунт</p>
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
                className="mt-1 block w-full input-field"
                placeholder="Введите имя пользователя"
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full input-field"
                placeholder="Введите ваш пароль"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-accent-500 text-sm text-center">{error}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
          
          <div className="text-center text-gray-400 text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;