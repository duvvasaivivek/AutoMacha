import { useCallback, useEffect, useState } from 'react';
import { getTravelRequests } from '@/services/travelRequest.service';
import type { TravelRequestFilters, TravelRequestListItem } from '@/types';

export function useTravelRequests(initialFilters: TravelRequestFilters = { status: 'OPEN' }) {
  const [requests, setRequests] = useState<TravelRequestListItem[]>([]);
  const [filters, setFilters] = useState<TravelRequestFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTravelRequests(filters);
      setRequests(data);
    } catch {
      setError('Failed to load travel requests.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchRequests,
  };
}

export default useTravelRequests;
