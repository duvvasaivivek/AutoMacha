import { api } from './index';
import type { DashboardStats } from '@/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>('/dashboard/stats/');
  return response.data;
}

export const dashboardService = {
  getDashboardStats,
};

export default dashboardService;
