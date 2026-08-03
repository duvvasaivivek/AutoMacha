import { api } from './index';
import type { Destination, SavedDestination } from '@/types';

export async function getDestinations(): Promise<Destination[]> {
  const response = await api.get<Destination[]>('/destinations/');
  return response.data;
}

export async function getSavedDestinations(): Promise<SavedDestination[]> {
  const response = await api.get<SavedDestination[]>('/destinations/saved/');
  return response.data;
}

export async function saveDestination(destinationId: number, label?: string): Promise<SavedDestination> {
  const response = await api.post<SavedDestination>('/destinations/saved/', {
    destination: destinationId,
    label: label || '',
  });
  return response.data;
}

export async function removeSavedDestination(savedId: number): Promise<void> {
  await api.delete(`/destinations/saved/${savedId}/`);
}

export const destinationService = {
  getDestinations,
  getSavedDestinations,
  saveDestination,
  removeSavedDestination,
};

export default destinationService;
