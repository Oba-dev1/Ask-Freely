// src/Components/DashboardSidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardSidebar.css';

function DashboardSidebar({ isOpen, onClose }) {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [eventsExpanded, setEventsExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-profile">
          {userProfile?.logoUrl ? (
            <div className="profile-avatar">
              <img src={userProfile.logoUrl} alt={userProfile.organizationName} />
            </div>
          ) : (
            <div className="profile-avatar-placeholder">
              <i className="fas fa-building"></i>
            </div>
          )}
          <div className="profile-info">
            <p className="profile-name">{userProfile?.organizationName || 'Organization'}</p>
            <p className="profile-role">Organizer</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {/* Overview */}
            <li>
              <NavLink
                to="/organizer/dashboard"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="fas fa-chart-line nav-icon"></i>
                <span className="nav-text">Overview</span>
              </NavLink>
            </li>

            {/* Events Section */}
            <li>
              <button
                className={`nav-item nav-item-expandable ${eventsExpanded ? 'expanded' : ''}`}
                onClick={() => setEventsExpanded(!eventsExpanded)}
              >
                <i className="fas fa-calendar-alt nav-icon"></i>
                <span className="nav-text">Events</span>
                <i className={`fas fa-chevron-down expand-icon ${eventsExpanded ? 'rotated' : ''}`}></i>
              </button>
              {eventsExpanded && (
                <ul className="nav-sublist">
                  <li>
                    <NavLink
                      to="/organizer/events/all"
                      className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-list nav-subicon"></i>
                      <span className="nav-text">All Events</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/active"
                      className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-circle nav-subicon" style={{ color: '#10B981' }}></i>
                      <span className="nav-text">Active</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/draft"
                      className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-circle nav-subicon" style={{ color: '#F59E0B' }}></i>
                      <span className="nav-text">Drafts</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/archived"
                      className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-archive nav-subicon" style={{ color: '#6B7280' }}></i>
                      <span className="nav-text">Archived</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* Analytics */}
            <li>
              <NavLink
                to="/organizer/analytics"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="fas fa-chart-bar nav-icon"></i>
                <span className="nav-text">Analytics</span>
              </NavLink>
            </li>

            {/* Divider */}
            <li className="nav-divider"></li>

            {/* Settings */}
            <li>
              <NavLink
                to="/organizer/settings"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebarOnMobile}
              >
                <i className="fas fa-cog nav-icon"></i>
                <span className="nav-text">Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
