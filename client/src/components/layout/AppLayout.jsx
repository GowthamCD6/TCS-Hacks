import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B0B12] text-[#FFFFFF] flex flex-col relative overflow-x-hidden selection:bg-[#8B5CF6]/30 selection:text-[#C4B5FD]">
      {/* Top Header spanning across the top (Height: 68px) */}
      <Header />

      {/* Main Container with Fixed Centered Sidebar Dock */}
      <div className="flex-1 flex relative">
        {/* Fixed, vertically centered sidebar: width 84px - DOES NOT SCROLL */}
        <Sidebar />

        {/* Main Content Area: Left padding to account for fixed 84px sidebar */}
        <main className="flex-1 pl-24 sm:pl-28 pr-6 sm:pr-10 py-6 max-w-[1600px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
