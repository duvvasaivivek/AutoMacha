import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Compass,
  UserCog,
  Bell,
  Phone,
  History,
  ShieldCheck,
} from 'lucide-react';
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
    { name: 'Auto Drivers', path: '/auto-drivers', icon: Phone },
    { name: 'Login', path: '/login', icon: LogIn },
    { name: 'Register', path: '/register', icon: UserPlus },
  ];

  const authNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Travel Requests', path: '/travel-requests', icon: Compass },
    { name: 'Ride History', path: '/rides/history', icon: History },
    { name: 'Create Request', path: '/travel-requests/new', icon: PlusCircle },
    { name: 'Auto Drivers', path: '/auto-drivers', icon: Phone },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: UserCog },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white transition-transform duration-200 group-hover:scale-105 shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-neutral-900 leading-none">
              AutoMacha
            </span>
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mt-0.5">
              IIITDM Kurnool Rides
            </span>
          </div>
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
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                      }`
                    }
                  >
                    <div className="relative flex items-center">
                      <Icon className="h-4 w-4" />
                      {isNotif && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}

              {/* Admin Portal Button */}
              {user && (user.is_staff || user.is_superuser) && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition shadow-xs ${
                      isActive
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-black'
                    }`
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Portal</span>
                </NavLink>
              )}

              {/* Logout Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="ml-3 gap-2 font-bold border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded-xl"
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
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="text-neutral-800 hover:bg-neutral-100 rounded-xl"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {isAuthenticated ? (
            <>
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isNotif = item.path === '/notifications';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
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

              {user && (user.is_staff || user.is_superuser) && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold bg-amber-500 text-black hover:bg-amber-600 transition-all"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>Admin Portal</span>
                </NavLink>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-all text-left"
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
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })
          )}
        </div>
      )}
    </header>
  );
};
