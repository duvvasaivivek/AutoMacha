import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { CreateTravelRequest } from '@/pages/CreateTravelRequest';
import { TravelRequestsPage } from '@/pages/TravelRequestsPage';
import { MatchesPage } from '@/pages/MatchesPage';
import { MyTravelRequestsPage } from '@/pages/MyTravelRequestsPage';
import { EditTravelRequestPage } from '@/pages/EditTravelRequestPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute, PublicRoute } from '@/components/common';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/travel-requests" element={<TravelRequestsPage />} />
        <Route path="/my-travel-requests" element={<MyTravelRequestsPage />} />
        <Route path="/travel-requests/new" element={<CreateTravelRequest />} />
        <Route path="/travel-requests/:id/edit" element={<EditTravelRequestPage />} />
        <Route path="/travel-requests/:id/matches" element={<MatchesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
