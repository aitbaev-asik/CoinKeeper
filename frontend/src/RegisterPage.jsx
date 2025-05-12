import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../store/slices/authSlice';
import { createDefaultCategories } from '../store/slices/categoriesSlice';
import { createDefaultAccounts } from '../store/slices/accountsSlice';

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
        // Успешная регистрация - создаем стандартные категории и счета
        console.log('Создание стандартных категорий и счетов для нового пользователя...');
        return Promise.all([
          dispatch(createDefaultCategories()).unwrap(),
          dispatch(createDefaultAccounts()).unwrap()
        ]);
      })
      .then(() => {
        console.log('Стандартные категории и счета созданы успешно');
        // Перенаправление на дашборд сработает автоматически благодаря useEffect
      })
      .catch((error) => {
        console.error('Ошибка при регистрации или создании данных:', error);
        // Если регистрация успешна, но не удалось создать категории или счета,
        // все равно пытаемся создать их локально
        try {
          dispatch(createDefaultCategories());
          dispatch(createDefaultAccounts());
        } catch (e) {
          console.error('Ошибка при создании локальных данных:', e);
        }
      });
  };

  // Rest of the component...
} 