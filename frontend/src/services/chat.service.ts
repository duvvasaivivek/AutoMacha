import api from './index';
import type {
  ChatRoom,
  ChatMessage,
  PaginatedChatMessageResponse,
} from '@/types';

export async function getChatRoom(rideRequestId: number): Promise<ChatRoom> {
  const response = await api.get<ChatRoom>(`/chat/room/${rideRequestId}/`);
  return response.data;
}

export async function getChatMessages(
  rideRequestId: number,
  page: number = 1
): Promise<PaginatedChatMessageResponse> {
  const response = await api.get<PaginatedChatMessageResponse | ChatMessage[]>(
    `/chat/room/${rideRequestId}/messages/`,
    { params: { page } }
  );

  if (Array.isArray(response.data)) {
    return {
      count: response.data.length,
      next: null,
      previous: null,
      results: response.data,
    };
  }

  return response.data;
}

export async function getChatUnreadCount(): Promise<{ unread_count: number }> {
  const response = await api.get<{ unread_count: number }>('/chat/unread-count/');
  return response.data;
}

export async function markChatRoomRead(rideRequestId: number): Promise<void> {
  await api.post(`/chat/room/${rideRequestId}/mark-read/`);
}
