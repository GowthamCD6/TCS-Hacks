import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from '../navigation/Header';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#080512] text-[#FFFFFF] app-shell flex flex-col relative overflow-x-hidden selection:bg-[#8B5CF6]/30 selection:text-[#C4B5FD]">
      {/* Top Header: Fixed at top, does not scroll with page, no border line below */}
      <Header />

      {/* Main Container below fixed header */}
      <div className="flex-1 flex pt-[72px] relative w-full">
        {/* Floating individual icons on the left - fixed in place */}
        <Sidebar />

        {/* Content area filling the page properly */}
        <main className="flex-1 pl-16 sm:pl-20 md:pl-24 pr-3 sm:pr-6 md:pr-8 py-6 w-full max-w-[1680px] mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
