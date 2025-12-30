// src/Components/DashboardSidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div
          className="fixed inset-0 bg-black/50 z-[998] lg:hidden animate-fadeIn"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-gradient-to-b from-[#1a1d2e] to-[#16182b] text-white flex flex-col z-[999] transition-transform duration-300 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.12)] border-r border-white/5 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="text-xl text-primary"><i className="fas fa-comments"></i></span>
            <span>Ask Freely</span>
          </div>
          <button
            className="lg:hidden bg-transparent border-none text-white text-lg cursor-pointer p-1.5 rounded-md hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          {userProfile?.logoUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={userProfile.logoUrl}
                alt={userProfile.organizationName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-lg flex-shrink-0">
              <i className="fas fa-building"></i>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white m-0 truncate">
              {userProfile?.organizationName || 'Organization'}
            </p>
            <p className="text-xs text-white/60 m-0">Organizer</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
          <ul className="list-none m-0 p-0">
            {/* Overview */}
            <li>
              <NavLink
                to="/organizer/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-primary/15 shadow-[inset_3px_0_0_#FF6B35]'
                      : 'text-white/75 hover:text-white hover:bg-white/[0.08] hover:translate-x-0.5'
                  }`
                }
                onClick={closeSidebarOnMobile}
              >
                {({ isActive }) => (
                  <>
                    <i className={`fas fa-chart-line w-5 text-center text-base ${isActive ? 'text-primary' : 'text-white/70'}`}></i>
                    <span className="flex-1">Overview</span>
                  </>
                )}
              </NavLink>
            </li>

            {/* Events Section */}
            <li>
              <button
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 text-sm font-medium rounded-lg transition-all w-[calc(100%-1rem)] text-left cursor-pointer bg-transparent border-none ${
                  eventsExpanded ? 'text-white bg-white/[0.08]' : 'text-white/75 hover:text-white hover:bg-white/[0.08]'
                }`}
                onClick={() => setEventsExpanded(!eventsExpanded)}
              >
                <i className="fas fa-calendar-alt w-5 text-center text-base text-white/70"></i>
                <span className="flex-1">Events</span>
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${eventsExpanded ? 'rotate-180' : ''}`}></i>
              </button>
              {eventsExpanded && (
                <ul className="list-none m-0 p-0 bg-black/15 animate-slideDown">
                  <li>
                    <NavLink
                      to="/organizer/events/all"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'text-white bg-primary/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`
                      }
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-list w-3 text-center text-[10px]"></i>
                      <span>All Events</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/active"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'text-white bg-primary/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`
                      }
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-circle w-3 text-center text-[10px] text-emerald-500"></i>
                      <span>Active</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/draft"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'text-white bg-primary/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`
                      }
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-circle w-3 text-center text-[10px] text-amber-500"></i>
                      <span>Drafts</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/organizer/events/archived"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'text-white bg-primary/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`
                      }
                      onClick={closeSidebarOnMobile}
                    >
                      <i className="fas fa-archive w-3 text-center text-[10px] text-neutral-400"></i>
                      <span>Archived</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* Analytics */}
            <li>
              <NavLink
                to="/organizer/analytics"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-primary/15 shadow-[inset_3px_0_0_#FF6B35]'
                      : 'text-white/75 hover:text-white hover:bg-white/[0.08] hover:translate-x-0.5'
                  }`
                }
                onClick={closeSidebarOnMobile}
              >
                {({ isActive }) => (
                  <>
                    <i className={`fas fa-chart-bar w-5 text-center text-base ${isActive ? 'text-primary' : 'text-white/70'}`}></i>
                    <span className="flex-1">Analytics</span>
                  </>
                )}
              </NavLink>
            </li>

            {/* Divider */}
            <li className="h-px bg-white/10 mx-4 my-3"></li>

            {/* Settings */}
            <li>
              <NavLink
                to="/organizer/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-primary/15 shadow-[inset_3px_0_0_#FF6B35]'
                      : 'text-white/75 hover:text-white hover:bg-white/[0.08] hover:translate-x-0.5'
                  }`
                }
                onClick={closeSidebarOnMobile}
              >
                {({ isActive }) => (
                  <>
                    <i className={`fas fa-cog w-5 text-center text-base ${isActive ? 'text-primary' : 'text-white/70'}`}></i>
                    <span className="flex-1">Settings</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-red-500/20 hover:border-red-500"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
