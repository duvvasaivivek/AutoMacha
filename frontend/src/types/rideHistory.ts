import type { TravelRequestUser } from './travelRequest';

export type RideStatus = 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface RideHistoryPartner {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  branch?: string;
  hostel?: string;
  phone_number?: string;
  institute_email?: string;
}

export interface RideHistory {
  id: number;
  user: number;
  travel_request?: number | null;
  travel_request_id?: number | null;
  ride_request_id?: number | null;
  ride_partner?: RideHistoryPartner | null;
  destination: string;
  pickup_location: string;
  departure_time: string;
  completed_at?: string | null;
  ride_status: RideStatus;
  status_display: string;
  rating?: number | null;
  review_text?: string;
  achievements?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RideHistoryFilters {
  status?: RideStatus | 'ALL' | '';
  search?: string;
  destination?: string;
  ride_partner?: string | number;
  date_range?: 'today' | 'week' | 'month' | 'custom' | '';
  from_date?: string;
  to_date?: string;
  ordering?: '-departure_time' | 'departure_time' | '-created_at' | 'created_at';
  page?: number;
}

export interface RideHistorySummary {
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  expired_rides: number;
}

export interface PaginatedRideHistoryResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: RideHistory[];
}
