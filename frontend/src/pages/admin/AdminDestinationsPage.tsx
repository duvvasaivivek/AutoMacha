import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, MapPin, X } from 'lucide-react';
import { getAdminDestinations, createAdminDestination, updateAdminDestination, deleteAdminDestination } from '@/services/admin.service';
import type { Destination } from '@/types/destination';

export const AdminDestinationsPage: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDestinations = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDestinations();
      setDestinations(data);
    } catch (err) {
      console.error('Failed to load destinations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAdminDestination({
        name: name.trim(),
        category: category.trim() || 'General',
        distance_km: distanceKm ? parseFloat(distanceKm) : undefined,
        description: description.trim() || undefined,
        is_active: true,
      });
      setIsModalOpen(false);
      setName('');
      setCategory('');
      setDistanceKm('');
      setDescription('');
      fetchDestinations();
    } catch (err: any) {
      alert(err.response?.data?.name?.[0] || 'Failed to create destination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (dest: Destination) => {
    try {
      const updated = await updateAdminDestination(dest.id, { is_active: !dest.is_active });
      setDestinations((prev) => prev.map((d) => (d.id === dest.id ? updated : d)));
    } catch {
      alert('Failed to update destination status.');
    }
  };

  const handleDelete = async (dest: Destination) => {
    if (!confirm(`Are you sure you want to delete destination '${dest.name}'?`)) return;
    try {
      await deleteAdminDestination(dest.id);
      setDestinations((prev) => prev.filter((d) => d.id !== dest.id));
    } catch {
      alert('Failed to delete destination.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Destination Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">View, create, approve, or remove travel destinations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      </div>

      {/* Destinations Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading destinations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Destination Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Distance (km)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {destinations.map((dest) => (
                  <tr key={dest.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {dest.name}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{dest.category || 'General'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{dest.distance_km ? `${dest.distance_km} km` : '-'}</td>
                    <td className="p-4">
                      {dest.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(dest)}
                        className={`px-3 py-1 rounded-lg font-semibold text-xs transition ${
                          dest.is_active
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {dest.is_active ? 'Deactivate' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDelete(dest)}
                        className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 rounded-lg font-semibold text-xs transition"
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

      {/* Modal Add Destination */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Approved Destination</h2>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Destination Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tirupati Railway Station"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Transit, Mall, Temple"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-500">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDestinationsPage;
