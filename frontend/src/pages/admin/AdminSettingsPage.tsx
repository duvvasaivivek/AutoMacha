import React, { useEffect, useState } from 'react';
import { getAdminSettings } from '@/services/admin.service';

export const AdminSettingsPage: React.FC = () => {
  const [configSettings, setConfigSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAdminSettings();
        setConfigSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Centralized Configuration</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Read-only view of environment-aware business rules, timings, and feature toggles.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading configuration parameters...</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(configSettings).map(([key, val]) => (
              <div key={key} className="py-3.5 flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{key}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {typeof val === 'boolean' ? (val ? 'ENABLED' : 'DISABLED') : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
