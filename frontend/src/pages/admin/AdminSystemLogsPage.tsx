import React, { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { getAdminSystemLogs } from '@/services/admin.service';
import type { SystemLog } from '@/types/admin';

export const AdminSystemLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [selectedFile, setSelectedFile] = useState('application.log');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminSystemLogs({ file: selectedFile, search, level: levelFilter });
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, search, levelFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Logs Console</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time structured application, security, and error log viewer.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search log messages or Request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <option value="application.log">application.log</option>
            <option value="errors.log">errors.log</option>
            <option value="security.log">security.log</option>
            <option value="authentication.log">authentication.log</option>
            <option value="background_tasks.log">background_tasks.log</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      {/* Log Console Output */}
      <div className="bg-gray-950 text-gray-200 border border-gray-800 rounded-2xl p-4 font-mono text-xs overflow-x-auto shadow-inner h-[600px] overflow-y-auto space-y-1">
        {isLoading ? (
          <div className="text-gray-500 p-4">Reading log file {selectedFile}...</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500 p-4">No log records matched your query.</div>
        ) : (
          logs.map((l, idx) => (
            <div key={idx} className="hover:bg-gray-900/60 p-1.5 rounded flex items-start gap-3">
              <span className="text-gray-500 flex-shrink-0">{l.timestamp}</span>
              <span
                className={`font-bold flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                  l.level === 'ERROR'
                    ? 'bg-red-900/60 text-red-300'
                    : l.level === 'WARNING'
                    ? 'bg-amber-900/60 text-amber-300'
                    : 'bg-emerald-900/60 text-emerald-300'
                }`}
              >
                {l.level}
              </span>
              <span className="text-cyan-400 flex-shrink-0">[{l.module}]</span>
              <span className="text-purple-400 flex-shrink-0 font-sans">req_id={l.req_id}</span>
              <span className="text-gray-300 break-all">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSystemLogsPage;
