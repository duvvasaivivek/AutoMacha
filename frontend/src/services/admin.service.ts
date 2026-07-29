import api from './index';
import type {
  AdminDashboardStats,
  AdminUser,
  AuditLog,
  SystemLog,
  AnalyticsData,
  SystemHealth,
  ImpersonationResponse,
} from '@/types/admin';
import type { Destination } from '@/types/destination';
import type { AutoDriver } from '@/types/autoDriver';
import type { TravelRequest } from '@/types/travelRequest';
import type { Notification } from '@/types/notification';

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get<AdminDashboardStats>('/admin-portal/dashboard/');
  return response.data;
};

export const getAdminUsers = async (params?: { search?: string; role?: string; is_active?: string }): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>('/admin-portal/users/', { params });
  return response.data;
};

export const toggleAdminUserActive = async (id: number): Promise<{ message: string; user: AdminUser }> => {
  const response = await api.patch<{ message: string; user: AdminUser }>(`/admin-portal/users/${id}/toggle-active/`);
  return response.data;
};

export const getAdminDestinations = async (): Promise<Destination[]> => {
  const response = await api.get<Destination[]>('/admin-portal/destinations/');
  return response.data;
};

export const createAdminDestination = async (data: Partial<Destination>): Promise<Destination> => {
  const response = await api.post<Destination>('/admin-portal/destinations/', data);
  return response.data;
};

export const updateAdminDestination = async (id: number, data: Partial<Destination>): Promise<Destination> => {
  const response = await api.patch<Destination>(`/admin-portal/destinations/${id}/`, data);
  return response.data;
};

export const deleteAdminDestination = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin-portal/destinations/${id}/`);
  return response.data;
};

export const getAdminAutoDrivers = async (): Promise<AutoDriver[]> => {
  const response = await api.get<AutoDriver[]>('/admin-portal/auto-drivers/');
  return response.data;
};

export const updateAdminAutoDriver = async (id: number, data: { is_verified?: boolean; is_active?: boolean }): Promise<AutoDriver> => {
  const response = await api.patch<AutoDriver>(`/admin-portal/auto-drivers/${id}/`, data);
  return response.data;
};

export const deleteAdminAutoDriver = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin-portal/auto-drivers/${id}/`);
  return response.data;
};

export const getAdminTravelRequests = async (params?: { search?: string; status?: string }): Promise<TravelRequest[]> => {
  const response = await api.get<TravelRequest[]>('/admin-portal/travel-requests/', { params });
  return response.data;
};

export const updateAdminTravelRequestStatus = async (id: number, status: string): Promise<TravelRequest> => {
  const response = await api.patch<TravelRequest>(`/admin-portal/travel-requests/${id}/`, { status });
  return response.data;
};

export const deleteAdminTravelRequest = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin-portal/travel-requests/${id}/`);
  return response.data;
};

export const getAdminNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/admin-portal/notifications/');
  return response.data;
};

export const deleteAdminNotification = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin-portal/notifications/${id}/`);
  return response.data;
};

export const getAdminAnalytics = async (): Promise<AnalyticsData> => {
  const response = await api.get<AnalyticsData>('/admin-portal/analytics/');
  return response.data;
};

export const getAdminSystemLogs = async (params?: { file?: string; search?: string; level?: string }): Promise<{ logs: SystemLog[] }> => {
  const response = await api.get<{ logs: SystemLog[] }>('/admin-portal/logs/', { params });
  return response.data;
};

export const getAdminAuditLogs = async (): Promise<AuditLog[]> => {
  const response = await api.get<AuditLog[]>('/admin-portal/audit-logs/');
  return response.data;
};

export const getAdminHealthStatus = async (): Promise<SystemHealth> => {
  const response = await api.get<SystemHealth>('/admin-portal/health/');
  return response.data;
};

export const getAdminSettings = async (): Promise<Record<string, any>> => {
  const response = await api.get<Record<string, any>>('/admin-portal/settings/');
  return response.data;
};

export const impersonateUser = async (userId: number): Promise<ImpersonationResponse> => {
  const response = await api.post<ImpersonationResponse>(`/admin-portal/impersonate/${userId}/`);
  return response.data;
};
