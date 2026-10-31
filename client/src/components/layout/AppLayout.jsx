import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#080512] text-slate-100 flex relative overflow-x-hidden selection:bg-purple-600/30 selection:text-purple-200">
      {/* Ambient vertical purple aurora light beam matching the screenshot */}
      <div className="ambient-purple-aurora" />

      {/* Main Left Vertical Icon Dock Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
