export interface DashboardStats {
  active_requests: number;
  expired_requests: number;
  cancelled_requests: number;
  total_requests: number;
  available_matches: number;
  favorite_destination: {
    id: number;
    name: string;
  } | null;
  next_trip: {
    id: number;
    destination: string;
    travel_datetime: string;
  } | null;
}
