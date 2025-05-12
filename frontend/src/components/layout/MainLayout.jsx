import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  // Основной макет приложения с сайдбаром и навбаром
  return (
    <div className="flex h-screen bg-dark-900 text-white">
      {/* Боковое меню */}
      <Sidebar />
      
      {/* Основной контент */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Верхняя навигация */}
        <Navbar />
        
        {/* Контент страницы */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 