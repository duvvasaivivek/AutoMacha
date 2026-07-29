import api from './index';
import type {
  RideHistory,
  RideHistoryFilters,
  RideHistorySummary,
  PaginatedRideHistoryResponse,
} from '@/types';

export async function getRideHistory(
  filters?: RideHistoryFilters
): Promise<PaginatedRideHistoryResponse> {
  const params: Record<string, string | number> = {};

  if (filters?.status && filters.status !== 'ALL') {
    params.status = filters.status;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.destination) {
    params.destination = filters.destination;
  }
  if (filters?.ride_partner) {
    params.ride_partner = filters.ride_partner;
  }
  if (filters?.date_range && filters.date_range !== 'custom') {
    params.date_range = filters.date_range;
  }
  if (filters?.from_date) {
    params.from_date = filters.from_date;
  }
  if (filters?.to_date) {
    params.to_date = filters.to_date;
  }
  if (filters?.ordering) {
    params.ordering = filters.ordering;
  }
  if (filters?.page) {
    params.page = filters.page;
  }

  const response = await api.get<PaginatedRideHistoryResponse | RideHistory[]>('/ride-history/', {
    params,
  });

  // Handle both paginated object and direct array response gracefully
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

export async function getRideHistorySummary(): Promise<RideHistorySummary> {
  const response = await api.get<RideHistorySummary>('/ride-history/summary/');
  return response.data;
}

export async function getRideHistoryById(id: number): Promise<RideHistory> {
  const response = await api.get<RideHistory>(`/ride-history/${id}/`);
  return response.data;
}
