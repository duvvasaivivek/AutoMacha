import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAdminAuditLogs } from '@/services/admin.service';
import type { AuditLog } from '@/types/admin';

export const AdminAuditLogsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Audit Logs</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Immutable trail of administrative operations, security changes, and impersonation events.</p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading audit history...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No audit log entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Affected Object</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Request ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{log.admin_username}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-200 dark:border-emerald-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{log.affected_object}</td>
                    <td className="p-4 font-mono text-gray-500">{log.ip_address || '-'}</td>
                    <td className="p-4 font-mono text-xs text-gray-400">{log.request_id || '-'}</td>
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

export default AdminAuditLogsPage;
