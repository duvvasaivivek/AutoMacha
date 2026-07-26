import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { isAuthenticated as checkAuth, setTokens, clearTokens } from '@/lib/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (access?: string, refresh?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return checkAuth();
  });

  useEffect(() => {
    const authExists = checkAuth();
    setIsAuthenticated(authExists);
  }, []);

  const login = (access?: string, refresh?: string) => {
    if (access && refresh) {
      setTokens(access, refresh);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
