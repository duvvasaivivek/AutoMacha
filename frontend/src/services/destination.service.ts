import { api } from './index';
import type { Destination } from '@/types';

export async function getDestinations(): Promise<Destination[]> {
  const response = await api.get<Destination[]>('/destinations/');
  return response.data;
}

export const destinationService = {
  getDestinations,
};

export default destinationService;
