import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, LoadingSpinner } from '@/components/common';

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const CreateTravelRequest = lazy(() => import('@/pages/CreateTravelRequest').then((m) => ({ default: m.CreateTravelRequest })));
const TravelRequestsPage = lazy(() => import('@/pages/TravelRequestsPage'));
const MatchesPage = lazy(() => import('@/pages/MatchesPage'));
const MyTravelRequestsPage = lazy(() => import('@/pages/MyTravelRequestsPage'));
const EditTravelRequestPage = lazy(() => import('@/pages/EditTravelRequestPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const AutoDriversPage = lazy(() => import('@/pages/AutoDriversPage'));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auto-drivers" element={<AutoDriversPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/travel-requests" element={<TravelRequestsPage />} />
          <Route path="/my-travel-requests" element={<MyTravelRequestsPage />} />
          <Route path="/travel-requests/new" element={<CreateTravelRequest />} />
          <Route path="/travel-requests/:id/edit" element={<EditTravelRequestPage />} />
          <Route path="/travel-requests/:id/matches" element={<MatchesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
