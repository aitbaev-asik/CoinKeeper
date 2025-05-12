import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openTransactionModal } from '../../store/slices/uiSlice';

// We'll use React Icons library
import { 
  FiHome, 
  FiPieChart, 
  FiSettings, 
  FiPlus, 
  FiMenu, 
  FiX 
} from 'react-icons/fi';

const Sidebar = () => {
  const dispatch = useDispatch();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navItems = [
    { path: '/dashboard', label: 'Главная', icon: <FiHome size={20} /> },
    { path: '/stats', label: 'Статистика', icon: <FiPieChart size={20} /> },
    { path: '/settings', label: 'Настройки', icon: <FiSettings size={20} /> },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary-500 text-dark-800 shadow-lg"
        onClick={toggleMobileSidebar}
      >
        {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar - desktop is persistent, mobile is conditional */}
      <div 
        className={`fixed md:relative z-40 h-full bg-dark-700 transition-all duration-300 ease-in-out
                    ${isMobileSidebarOpen ? 'w-64 left-0' : '-left-64 md:left-0 w-0 md:w-64'}`}
      >
        <div className="flex flex-col h-full w-64">
          {/* Logo/Brand */}
          <div className="py-6 px-4 border-b border-dark-600">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-dark-800 text-2xl font-semibold">W</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gradient">Wallet</h1>
            </div>
          </div>

          {/* Add Transaction Button */}
          <div className="p-4">
            <button 
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
              onClick={() => {
                dispatch(openTransactionModal());
                if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
              }}
            >
              <FiPlus size={20} />
              <span>Добавить</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-dark-600 text-primary-400' 
                          : 'text-gray-300 hover:bg-dark-600 hover:text-white'
                      }`
                    }
                    onClick={() => {
                      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Version */}
          <div className="p-4 text-xs text-gray-500">
            <p>v0.1.0 beta</p>
          </div>
        </div>
      </div>
      
      {/* Backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;