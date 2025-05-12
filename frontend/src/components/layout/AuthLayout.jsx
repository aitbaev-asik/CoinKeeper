import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  // Макет для страниц авторизации без навигации
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
