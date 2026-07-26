import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute, PublicRoute } from '@/components/common';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Protected Routes: Only authenticated users should access them */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Public Routes: Prevent authenticated users from visiting /login and /register */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
