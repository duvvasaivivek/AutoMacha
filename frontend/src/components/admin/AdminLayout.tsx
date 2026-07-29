import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Car,
  Compass,
  Bell,
  BarChart3,
  Terminal,
  ShieldAlert,
  Activity,
  Settings,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  LogOut,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Impersonation state
  const isImpersonating = sessionStorage.getItem('impersonating_user') !== null;
  const impersonatedUserName = sessionStorage.getItem('impersonating_user_name') || '';

  const handleExitImpersonation = () => {
    const originalToken = sessionStorage.getItem('original_admin_token');
    const originalRefresh = sessionStorage.getItem('original_admin_refresh');

    if (originalToken && originalRefresh) {
      localStorage.setItem('access_token', originalToken);
      localStorage.setItem('refresh_token', originalRefresh);
    }
    sessionStorage.removeItem('impersonating_user');
    sessionStorage.removeItem('impersonating_user_name');
    sessionStorage.removeItem('original_admin_token');
    sessionStorage.removeItem('original_admin_refresh');

    window.location.href = '/admin';
  };

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Travel Requests', path: '/admin/travel-requests', icon: Compass },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Destinations', path: '/admin/destinations', icon: MapPin },
        { name: 'Auto Drivers', path: '/admin/auto-drivers', icon: Car },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'System Logs', path: '/admin/logs', icon: Terminal },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
        { name: 'Health Status', path: '/admin/health', icon: Activity },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  // Derive breadcrumb path
  const currentPath = location.pathname;
  let pageTitle = 'Dashboard';
  navSections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.path === currentPath) {
        pageTitle = item.name;
      }
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 flex items-center justify-between shadow-lg text-sm font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Read-Only Banner: You are currently impersonating <strong>{impersonatedUserName}</strong>.</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col justify-between hidden md:flex ${isImpersonating ? 'pt-10' : ''}`}>
        <div className="p-4 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-800">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wide text-white">AutoMacha</h2>
              <p className="text-xs text-emerald-400 font-medium">Admin Portal</p>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <h3 className="px-3 text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">
                  {section.title}
                </h3>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Info Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="text-xs">
              <p className="font-bold text-white line-clamp-1">{user?.username}</p>
              <p className="text-gray-500 text-[10px]">{user?.is_superuser ? 'Superuser' : 'Staff Admin'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            title="Return to Student Portal"
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className={`flex-1 flex flex-col min-w-0 ${isImpersonating ? 'pt-10' : ''}`}>
        {/* Topbar / Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          {/* Breadcrumbs & Title */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden text-gray-600 dark:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-gray-400 font-medium">Admin</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-900 dark:text-white">{pageTitle}</span>
          </div>

          {/* Quick Exit to Main Site */}
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Student App <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex md:hidden">
          <div className="w-64 bg-gray-900 text-white h-full p-4 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold text-white">Admin Portal</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <h3 className="px-3 text-[10px] font-extrabold text-gray-400 uppercase">{section.title}</h3>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                            location.pathname === item.path ? 'bg-emerald-600 text-white' : 'text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
