import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute, LoadingSpinner } from '@/components/common';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminDestinationsPage = lazy(() => import('@/pages/admin/AdminDestinationsPage'));
const AdminAutoDriversPage = lazy(() => import('@/pages/admin/AdminAutoDriversPage'));
const AdminTravelRequestsPage = lazy(() => import('@/pages/admin/AdminTravelRequestsPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminSystemLogsPage = lazy(() => import('@/pages/admin/AdminSystemLogsPage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'));
const AdminHealthPage = lazy(() => import('@/pages/admin/AdminHealthPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auto-drivers" element={<AutoDriversPage />} />

        {/* Student App Routes */}
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

        {/* Dedicated Admin Portal Routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/destinations" element={<AdminDestinationsPage />} />
            <Route path="/admin/auto-drivers" element={<AdminAutoDriversPage />} />
            <Route path="/admin/travel-requests" element={<AdminTravelRequestsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/logs" element={<AdminSystemLogsPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/health" element={<AdminHealthPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
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
