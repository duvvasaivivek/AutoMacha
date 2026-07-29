import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, Compass, CheckCircle2, Car, MapPin, Bell, RefreshCw } from 'lucide-react';
import { getAdminDashboardStats } from '@/services/admin.service';
import type { AdminDashboardStats } from '@/types/admin';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'from-blue-600 to-indigo-600', link: '/admin/users' },
    { title: 'Verified Users', value: stats?.verified_users ?? 0, icon: UserCheck, color: 'from-emerald-600 to-teal-600', link: '/admin/users' },
    { title: "Today's Registrations", value: stats?.today_registrations ?? 0, icon: UserPlus, color: 'from-cyan-600 to-blue-600', link: '/admin/users' },
    { title: 'Active Travel Requests', value: stats?.active_travel_requests ?? 0, icon: Compass, color: 'from-amber-500 to-orange-600', link: '/admin/travel-requests' },
    { title: 'Completed Rides', value: stats?.completed_rides ?? 0, icon: CheckCircle2, color: 'from-green-600 to-emerald-600', link: '/admin/travel-requests' },
    { title: 'Pending Driver Suggestions', value: stats?.pending_driver_suggestions ?? 0, icon: Car, color: 'from-purple-600 to-indigo-600', link: '/admin/auto-drivers' },
    { title: 'Pending Destinations', value: stats?.pending_destination_suggestions ?? 0, icon: MapPin, color: 'from-rose-500 to-pink-600', link: '/admin/destinations' },
    { title: 'Unread Notifications', value: stats?.unread_notifications ?? 0, icon: Bell, color: 'from-violet-600 to-purple-600', link: '/admin/notifications' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">System performance metrics and pending administrative tasks.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.link)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{card.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${card.color} text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {isLoading ? '...' : card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
