import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Функция для получения имени пользователя
  const getUserName = () => {
    if (!user) return 'Пользователь';
    
    if (user.first_name) return user.first_name;
    if (user.username) return user.username.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    
    return 'Пользователь';
  };
  
  // Функция для получения первой буквы имени
  const getInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };
  
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="bg-dark-700 border-b border-dark-600 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gradient">WalletApp</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{getUserName()}</p>
            </div>
            <div className="relative flex items-center space-x-2">
              <div 
                className="h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-lg select-none"
                title={getUserName()}
              >
                {getInitial()}
              </div>
              <span className="block md:hidden text-sm font-medium">{getUserName()}</span>
              <button 
                className="ml-2 px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-xs text-gray-300"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;