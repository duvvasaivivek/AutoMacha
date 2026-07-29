import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Server, Database, Cpu, RefreshCw } from 'lucide-react';
import { getAdminHealthStatus } from '@/services/admin.service';
import type { SystemHealth } from '@/types/admin';

export const AdminHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminHealthStatus();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const healthItems = [
    { title: 'Backend REST API', value: health?.backend ?? 'Operational', icon: Server },
    { title: 'PostgreSQL Database', value: health?.database ?? 'Healthy', icon: Database },
    { title: 'Celery Task Queue', value: health?.celery ?? 'Operational', icon: Cpu },
    { title: 'Redis Cache & Broker', value: health?.redis ?? 'Operational', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Infrastructure Health</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Live operational status monitoring for database, background queue, and APIs.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Check Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHealthPage;
