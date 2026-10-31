import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#080512] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-purple-600/30 selection:text-purple-200">
      {/* Ambient vertical purple aurora light beam matching the screenshot */}
      <div className="ambient-purple-aurora" />

      {/* Top Header spanning across the top */}
      <Header />

      {/* Main Container with Fixed Centered Sidebar Dock */}
      <div className="flex-1 flex relative">
        {/* Fixed, vertically centered sidebar that DOES NOT SCROLL */}
        <Sidebar />

        {/* Main Content Area with left offset to accommodate the centered dock */}
        <main className="flex-1 pl-20 sm:pl-28 pr-4 sm:pr-8 py-6 max-w-[1700px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
