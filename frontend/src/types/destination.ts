export interface Destination {
  id: number;
  name: string;
  category?: string;
  distance_km?: number;
  description?: string;
  is_active?: boolean;
}

export interface SavedDestination {
  id: number;
  destination: number;
  destination_details: Destination;
  label?: string;
  created_at: string;
}
