import { api } from './index';
import type {
  TravelRequest,
  TravelRequestListItem,
  MyTravelRequest,
  CreateTravelRequestPayload,
  UpdateTravelRequestPayload,
  TravelRequestFilters,
  TravelRequestMatch,
} from '@/types';

export async function createTravelRequest(payload: CreateTravelRequestPayload): Promise<TravelRequest> {
  const response = await api.post<TravelRequest>('/travel-requests/', payload);
  return response.data;
}

export async function getTravelRequests(filters?: TravelRequestFilters): Promise<TravelRequestListItem[]> {
  const params: Record<string, string | number> = {};
  if (filters?.destination) {
    params.destination = filters.destination;
  }
  if (filters?.direction) {
    params.direction = filters.direction;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.date) {
    params.date = filters.date;
  }
  if (filters?.from_datetime) {
    params.from_datetime = filters.from_datetime;
  }
  if (filters?.to_datetime) {
    params.to_datetime = filters.to_datetime;
  }
  if (filters?.matching_only !== undefined) {
    params.matching_only = String(filters.matching_only);
  }
  const response = await api.get<TravelRequestListItem[]>('/travel-requests/', { params });
  return response.data;
}

export async function getMyTravelRequests(): Promise<MyTravelRequest[]> {
  const response = await api.get<MyTravelRequest[]>('/travel-requests/my/');
  return response.data;
}

export async function getTravelRequestById(id: number | string): Promise<TravelRequest> {
  const response = await api.get<TravelRequest>(`/travel-requests/${id}/`);
  return response.data;
}

export async function updateTravelRequest(id: number | string, payload: UpdateTravelRequestPayload): Promise<TravelRequest> {
  const response = await api.patch<TravelRequest>(`/travel-requests/${id}/`, payload);
  return response.data;
}

export async function cancelTravelRequest(id: number | string): Promise<TravelRequest> {
  const response = await api.post<TravelRequest>(`/travel-requests/${id}/cancel/`);
  return response.data;
}

export async function getMatches(requestId: number | string): Promise<TravelRequestMatch[]> {
  const response = await api.get<TravelRequestMatch[]>(`/travel-requests/${requestId}/matches/`);
  return response.data;
}

export async function requestRideShare(requestId: number | string): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(`/travel-requests/${requestId}/request-share/`);
  return response.data;
}

export async function respondRideShare(requestId: number | string, sender_username: string, action: 'ACCEPT' | 'DECLINE'): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(`/travel-requests/${requestId}/respond-share/`, { sender_username, action });
  return response.data;
}

export const travelRequestService = {
  createTravelRequest,
  getTravelRequests,
  getMyTravelRequests,
  getTravelRequestById,
  updateTravelRequest,
  cancelTravelRequest,
  getMatches,
  requestRideShare,
  respondRideShare,
};

export default travelRequestService;
