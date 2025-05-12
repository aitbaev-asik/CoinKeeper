import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TransactionModal from '../transactions/TransactionModal';
import CategoryModal from '../categories/CategoryModal';
import DateRangeModal from '../common/DateRangeModal';
import DemoModeNotification from '../DemoModeNotification';

const Layout = () => {
  return (
    <div className="flex h-screen bg-dark-800 text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container mx-auto">
            {/* Уведомление о демо-режиме */}
            <DemoModeNotification />
            
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals */}
      <TransactionModal />
      <CategoryModal />
      <DateRangeModal />
    </div>
  );
};

export default Layout;