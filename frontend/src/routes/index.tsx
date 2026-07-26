import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { CreateTravelRequest } from '@/pages/CreateTravelRequest';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute, PublicRoute } from '@/components/common';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Universal Home Route: Everyone can view the portal home page and outing destinations */}
      <Route path="/" element={<Home />} />

      {/* Protected Routes: Only authenticated users should access them */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/travel-requests/new" element={<CreateTravelRequest />} />
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
