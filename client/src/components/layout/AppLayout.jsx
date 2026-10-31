import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#080612] text-slate-100 flex relative overflow-x-hidden">
      {/* Ambient purple wave aurora in background matching the screenshot */}
      <div className="ambient-purple-aurora" />

      {/* Main Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
