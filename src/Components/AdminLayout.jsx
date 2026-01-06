// src/Components/AdminLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { path: '/admin/users', icon: 'fa-users', label: 'Users' },
    { path: '/admin/events', icon: 'fa-calendar', label: 'Events' },
    { path: '/admin/messages', icon: 'fa-paper-plane', label: 'Messages' },
    { path: '/admin/activity', icon: 'fa-clock-rotate-left', label: 'Activity' },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-ink text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          <div className="flex items-center gap-2">
            <i className="fas fa-shield-halved text-primary"></i>
            <span className="font-bold">Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-ink text-white transition-transform duration-300 w-64 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-halved text-white"></i>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Super Admin</h1>
                <p className="text-xs text-white/70">Ask Freely</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <i className={`fas ${item.icon} w-5`}></i>
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-white/10">
              <NavLink
                to="/organizer/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <i className="fas fa-arrow-left w-5"></i>
                <span className="font-medium">Back to Organizer</span>
              </NavLink>
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentUser?.email}</p>
                <p className="text-xs text-neutral-400">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              <i className="fas fa-sign-out-alt"></i>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
