import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserCheck, UserX, UserSearch, Trash2 } from 'lucide-react';
import { getAdminUsers, toggleAdminUserActive, impersonateUser, deleteAdminUser } from '@/services/admin.service';
import type { AdminUser } from '@/types/admin';
import { useAuth } from '@/hooks';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers({ search, role: roleFilter, is_active: statusFilter });
      setUsers(Array.isArray(data) ? data : (data as any)?.results || []);
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleActive = async (userObj: AdminUser) => {
    try {
      const res = await toggleAdminUserActive(userObj.id);
      setUsers((prev) => prev.map((u) => (u.id === userObj.id ? res.user : u)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle user status.');
    }
  };

  const handleImpersonate = async (targetUser: AdminUser) => {
    if (!currentUser?.is_superuser) return;
    if (!confirm(`Are you sure you want to impersonate ${targetUser.username}?`)) return;

    try {
      const res = await impersonateUser(targetUser.id);
      sessionStorage.setItem('original_admin_token', localStorage.getItem('access_token') || '');
      sessionStorage.setItem('original_admin_refresh', localStorage.getItem('refresh_token') || '');
      sessionStorage.setItem('impersonating_user', String(targetUser.id));
      sessionStorage.setItem('impersonating_user_name', targetUser.username);

      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);

      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Impersonation failed.');
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (targetUser.id === currentUser?.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }

    if (!confirm(`ARE YOU SURE you want to PERMANENTLY delete user "${targetUser.username}"?\n\nThis action cannot be undone and will delete all associated data.`)) {
      return;
    }

    try {
      await deleteAdminUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Search, manage active status, impersonate, or permanently delete system accounts.</p>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username, email, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="staff">Staff / Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading user accounts...</div>
        ) : (!Array.isArray(users) || users.length === 0) ? (
          <div className="p-8 text-center text-xs text-gray-400">No users found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(users || []).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{u.username}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{u.institute_email}</td>
                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{u.roll_number}</td>
                    <td className="p-4">
                      {u.is_superuser ? (
                        <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          Superuser
                        </span>
                      ) : u.is_staff ? (
                        <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                          Staff
                        </span>
                      ) : (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium px-2 py-0.5 rounded-md">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                          <UserX className="w-3.5 h-3.5" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-3 py-1 rounded-lg font-semibold text-xs transition ${
                          u.is_active
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>

                      {currentUser?.is_superuser && !u.is_superuser && (
                        <button
                          onClick={() => handleImpersonate(u)}
                          title="Impersonate User"
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          <UserSearch className="w-3.5 h-3.5" /> Impersonate
                        </button>
                      )}

                      {u.id !== currentUser?.id && (!u.is_superuser || currentUser?.is_superuser) && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User Permanently"
                          className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
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

export default AdminUsersPage;
