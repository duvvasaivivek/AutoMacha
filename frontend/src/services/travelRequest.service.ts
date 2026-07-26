import { api } from './index';
import type { TravelRequest, TravelRequestListItem, CreateTravelRequestPayload, TravelRequestFilters, TravelRequestMatch } from '@/types';

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
  const response = await api.get<TravelRequestListItem[]>('/travel-requests/', { params });
  return response.data;
}

export async function getMatches(requestId: number | string): Promise<TravelRequestMatch[]> {
  const response = await api.get<TravelRequestMatch[]>(`/travel-requests/${requestId}/matches/`);
  return response.data;
}

export const travelRequestService = {
  createTravelRequest,
  getTravelRequests,
  getMatches,
};

export default travelRequestService;
