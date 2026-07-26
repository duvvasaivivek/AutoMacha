import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
