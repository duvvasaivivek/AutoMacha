import api from './index';
import type { AutoDriver, SuggestAutoDriverPayload, SuggestAutoDriverResponse } from '@/types/autoDriver';

export const getVerifiedAutoDrivers = async (search?: string): Promise<AutoDriver[]> => {
  const params: Record<string, string> = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await api.get<AutoDriver[]>('/auto-drivers/', { params });
  return response.data;
};

export const suggestAutoDriver = async (payload: SuggestAutoDriverPayload): Promise<SuggestAutoDriverResponse> => {
  const response = await api.post<SuggestAutoDriverResponse>('/auto-drivers/suggest/', payload);
  return response.data;
};

export const getMyAutoDriverSuggestions = async (): Promise<AutoDriver[]> => {
  const response = await api.get<AutoDriver[]>('/auto-drivers/my-suggestions/');
  return response.data;
};
