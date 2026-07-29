import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getAdminNotifications, deleteAdminNotification } from '@/services/admin.service';
import type { Notification } from '@/types/notification';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('Failed to delete notification.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Notifications Management</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Inspect system notification queue and purge stale notifications.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading notifications...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Read</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{n.user_username || `User #${n.user}`}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{n.title}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 max-w-xs line-clamp-2">{n.message}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{n.notification_type}</td>
                    <td className="p-4">{n.is_read ? 'Yes' : 'No'}</td>
                    <td className="p-4 font-mono text-gray-400">{new Date(n.created_at).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold"
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

export default AdminNotificationsPage;
