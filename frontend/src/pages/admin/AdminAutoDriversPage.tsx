import React, { useEffect, useState } from 'react';
import { Car, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { getAdminAutoDrivers, updateAdminAutoDriver, deleteAdminAutoDriver } from '@/services/admin.service';
import type { AutoDriver } from '@/types/autoDriver';

export const AdminAutoDriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<AutoDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminAutoDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Failed to load auto drivers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (driver: AutoDriver) => {
    try {
      const updated = await updateAdminAutoDriver(driver.id, { is_verified: true, is_active: true });
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? updated : d)));
    } catch {
      alert('Failed to approve auto driver.');
    }
  };

  const handleToggleActive = async (driver: AutoDriver) => {
    try {
      const updated = await updateAdminAutoDriver(driver.id, { is_active: !driver.is_active });
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? updated : d)));
    } catch {
      alert('Failed to update driver status.');
    }
  };

  const handleDelete = async (driver: AutoDriver) => {
    if (!confirm(`Are you sure you want to delete driver '${driver.full_name}'?`)) return;
    try {
      await deleteAdminAutoDriver(driver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
    } catch {
      alert('Failed to delete auto driver.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Auto Drivers Management</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Review student driver suggestions, approve records, or deactivate outdated entries.</p>
      </div>

      {/* Drivers Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading auto drivers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Driver Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Vehicle Number</th>
                  <th className="p-4">Suggested By</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {drivers.map((drv) => (
                  <tr key={drv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Car className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {drv.full_name}
                    </td>
                    <td className="p-4 font-mono text-gray-700 dark:text-gray-300">{drv.phone_number}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{drv.vehicle_number || '-'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{drv.created_by_username || 'Admin Direct'}</td>
                    <td className="p-4">
                      {drv.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!drv.is_verified && (
                        <button
                          onClick={() => handleApprove(drv)}
                          className="px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(drv)}
                        className={`px-3 py-1 rounded-lg font-semibold text-xs transition ${
                          drv.is_active
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {drv.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(drv)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAutoDriversPage;
