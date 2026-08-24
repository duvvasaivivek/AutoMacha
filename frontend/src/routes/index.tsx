import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute, LoadingSpinner, PageTransition } from '@/components/common';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AnimatePresence } from 'framer-motion';

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
const RideHistoryPage = lazy(() => import('@/pages/RideHistoryPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ChatsOverviewPage = lazy(() => import('@/pages/ChatsOverviewPage'));

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
  const location = useLocation();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition title="Home"><Home /></PageTransition>} />
          <Route path="/auto-drivers" element={<PageTransition title="Auto Drivers"><AutoDriversPage /></PageTransition>} />

          {/* Student App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<PageTransition title="Dashboard"><Dashboard /></PageTransition>} />
            <Route path="/travel-requests" element={<PageTransition title="Travel Requests"><TravelRequestsPage /></PageTransition>} />
            <Route path="/my-travel-requests" element={<PageTransition title="My Requests"><MyTravelRequestsPage /></PageTransition>} />
            <Route path="/travel-requests/new" element={<PageTransition title="Create Request"><CreateTravelRequest /></PageTransition>} />
            <Route path="/travel-requests/:id/edit" element={<PageTransition title="Edit Request"><EditTravelRequestPage /></PageTransition>} />
            <Route path="/travel-requests/:id/matches" element={<PageTransition title="Matches"><MatchesPage /></PageTransition>} />
            <Route path="/rides/history" element={<PageTransition title="Ride History"><RideHistoryPage /></PageTransition>} />
            <Route path="/chat/:rideRequestId" element={<PageTransition title="Chat"><ChatPage /></PageTransition>} />
            <Route path="/chats" element={<PageTransition title="Chats"><ChatsOverviewPage /></PageTransition>} />
            <Route path="/chats/:rideRequestId" element={<PageTransition title="Chats"><ChatsOverviewPage /></PageTransition>} />
            <Route path="/notifications" element={<PageTransition title="Notifications"><NotificationsPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition title="Profile"><ProfilePage /></PageTransition>} />
          </Route>

          {/* Dedicated Admin Portal Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<PageTransition title="Admin Dashboard"><AdminDashboardPage /></PageTransition>} />
              <Route path="/admin/users" element={<PageTransition title="Manage Users"><AdminUsersPage /></PageTransition>} />
              <Route path="/admin/destinations" element={<PageTransition title="Manage Destinations"><AdminDestinationsPage /></PageTransition>} />
              <Route path="/admin/auto-drivers" element={<PageTransition title="Manage Drivers"><AdminAutoDriversPage /></PageTransition>} />
              <Route path="/admin/travel-requests" element={<PageTransition title="Manage Requests"><AdminTravelRequestsPage /></PageTransition>} />
              <Route path="/admin/notifications" element={<PageTransition title="Manage Notifications"><AdminNotificationsPage /></PageTransition>} />
              <Route path="/admin/analytics" element={<PageTransition title="Analytics"><AdminAnalyticsPage /></PageTransition>} />
              <Route path="/admin/logs" element={<PageTransition title="System Logs"><AdminSystemLogsPage /></PageTransition>} />
              <Route path="/admin/audit-logs" element={<PageTransition title="Audit Logs"><AdminAuditLogsPage /></PageTransition>} />
              <Route path="/admin/health" element={<PageTransition title="Health"><AdminHealthPage /></PageTransition>} />
              <Route path="/admin/settings" element={<PageTransition title="Settings"><AdminSettingsPage /></PageTransition>} />
            </Route>
          </Route>

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<PageTransition title="Login"><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition title="Register"><Register /></PageTransition>} />
          </Route>

          <Route path="*" element={<PageTransition title="Not Found"><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};
