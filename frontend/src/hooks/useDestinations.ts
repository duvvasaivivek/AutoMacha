import { useEffect, useState } from 'react';
import { getDestinations } from '@/services/destination.service';
import type { Destination } from '@/types';

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getDestinations()
      .then((data) => setDestinations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { destinations, loading };
}

export default useDestinations;
