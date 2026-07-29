import React, { useEffect, useState } from 'react';
import { MapPin, PieChart } from 'lucide-react';
import { getAdminAnalytics } from '@/services/admin.service';
import type { AnalyticsData } from '@/types/admin';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await getAdminAnalytics();
        setData(result);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Analytics & Growth</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Platform activity trends, registration growth, and travel demand analysis.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading system analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <PieChart className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">Travel Request Status Breakdown</h2>
            </div>
            <div className="space-y-3">
              {data?.status_breakdown.map((item) => (
                <div key={item.status} className="flex justify-between items-center text-xs p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{item.status}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Popular Destinations */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">Most Popular Destinations</h2>
            </div>
            <div className="space-y-3">
              {data?.top_destinations.map((item, idx) => (
                <div key={item.destination__name} className="flex justify-between items-center text-xs p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    #{idx + 1} {item.destination__name}
                  </span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">{item.count} requests</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
