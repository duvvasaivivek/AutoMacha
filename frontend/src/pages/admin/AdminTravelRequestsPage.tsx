import React, { useEffect, useState, useCallback } from 'react';
import { Compass, Search, Trash2 } from 'lucide-react';
import { getAdminTravelRequests, updateAdminTravelRequestStatus, deleteAdminTravelRequest } from '@/services/admin.service';
import type { TravelRequest } from '@/types/travelRequest';

export const AdminTravelRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminTravelRequests({ search, status: statusFilter });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load travel requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleStatusChange = async (reqObj: TravelRequest, newStatus: string) => {
    try {
      const updated = await updateAdminTravelRequestStatus(reqObj.id, newStatus);
      setRequests((prev) => prev.map((r) => (r.id === reqObj.id ? updated : r)));
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (reqObj: TravelRequest) => {
    if (!confirm(`Are you sure you want to delete Travel Request #${reqObj.id}?`)) return;
    try {
      await deleteAdminTravelRequest(reqObj.id);
      setRequests((prev) => prev.filter((r) => r.id !== reqObj.id));
    } catch {
      alert('Failed to delete request.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Travel Request Operations</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Search, monitor, update status, or purge student travel requests.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student username or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading travel requests...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">Direction</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">#{r.id}</td>
                    <td className="p-4 font-semibold text-gray-800 dark:text-gray-200">{r.user_username || `User #${r.user}`}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-500" />
                      {r.destination_name || `Destination #${r.destination}`}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{r.direction}</td>
                    <td className="p-4 font-mono text-gray-500">{new Date(r.travel_datetime).toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r, e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="EXPIRED">EXPIRED</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(r)}
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

export default AdminTravelRequestsPage;
