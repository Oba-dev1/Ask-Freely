// src/Components/DashboardLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import './DashboardLayout.css';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className="header-spacer"></div>

          {/* Header Actions (notifications, profile, etc.) */}
          <div className="header-actions">
            {/* Future: Add notifications, search, user menu */}
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
