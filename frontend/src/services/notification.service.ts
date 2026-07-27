import { api } from './index';
import type { Notification } from '@/types';

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get<Notification[]>('/notifications/');
  return response.data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await api.get<{ count: number }>('/notifications/unread-count/');
  return response.data;
}

export async function markAsRead(id: number): Promise<Notification> {
  const response = await api.patch<Notification>(`/notifications/${id}/read/`);
  return response.data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all/');
}
