import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogIn, UserPlus, LogOut, LayoutDashboard, PlusCircle, Compass, User as UserIcon, UserCog, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { getUnreadCount } from '@/services/notification.service';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.count);
      } catch {
        // ignore silently
      }
    };
    fetchUnread();

    const handleUpdate = () => {
      fetchUnread();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [isAuthenticated, location.pathname]);

  const publicNavItems = [
    { name: 'Login', path: '/login', icon: LogIn },
    { name: 'Register', path: '/register', icon: UserPlus },
  ];

  const authNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Travel Requests', path: '/travel-requests', icon: Compass },
    { name: 'My Requests', path: '/my-travel-requests', icon: UserIcon },
    { name: 'Create Request', path: '/travel-requests/new', icon: PlusCircle },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: UserCog },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white transition-all duration-300 group-hover:bg-neutral-800 group-hover:shadow-md group-hover:scale-105">
            <Car className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-black group-hover:text-neutral-600 transition-all">
            AutoMacha
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isNotif = item.path === '/notifications';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-black text-white font-semibold shadow-xs'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                      }`
                    }
                  >
                    <div className="relative flex items-center">
                      <Icon className="h-4 w-4" />
                      {isNotif && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex.5 h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-2xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
              {user && (
                <span className="text-sm font-semibold text-neutral-800 ml-2 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
                  Hello, {user.username}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="ml-2 gap-2 font-semibold border-neutral-300 hover:bg-neutral-100 text-black"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            publicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-black text-white font-semibold shadow-xs'
                        : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="text-neutral-700 hover:bg-neutral-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated ? (
            <>
              {user && (
                <div className="px-4 py-2.5 text-sm font-semibold text-neutral-800 bg-neutral-100 rounded-lg border border-neutral-200 mb-2">
                  Hello, {user.username}
                </div>
              )}
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isNotif = item.path === '/notifications';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all ${
                        isActive
                          ? 'bg-black text-white font-semibold shadow-md'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {isNotif && unreadCount > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white shadow-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            publicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-black text-white font-semibold shadow-md'
                        : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })
          )}
        </div>
      )}
    </header>
  );
};

