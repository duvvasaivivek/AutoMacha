import { api } from './index';
import type { TravelRequest, CreateTravelRequestPayload } from '@/types';

export async function createTravelRequest(payload: CreateTravelRequestPayload): Promise<TravelRequest> {
  const response = await api.post<TravelRequest>('/travel-requests/', payload);
  return response.data;
}

export const travelRequestService = {
  createTravelRequest,
};

export default travelRequestService;
