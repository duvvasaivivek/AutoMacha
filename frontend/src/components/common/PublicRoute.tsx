import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';

interface PublicRouteProps {
  children?: React.ReactNode;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
          <p className="text-sm font-medium text-neutral-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as LocationState | null)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
