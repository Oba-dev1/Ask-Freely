// src/Components/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from './NotificationBell';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#fafbfc] overflow-x-hidden max-w-[100vw]">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-[260px] transition-[margin-left] duration-300 ease-out min-w-0 max-w-full overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-[100] flex items-center gap-3 px-4 py-3 md:px-6 md:py-3 lg:px-8 bg-white/[0.98] backdrop-blur-md border-b border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <button
            className="lg:hidden bg-transparent border-none text-xl text-neutral-800 cursor-pointer p-2 rounded-lg transition-all hover:bg-neutral-100 hover:scale-105"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className="flex-1"></div>

          {/* Header Actions (notifications, profile, etc.) */}
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-x-hidden box-border min-w-0">
          <div className="w-full max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
