import type { Destination } from './destination';

export type Direction = 'TO_CAMPUS' | 'FROM_CAMPUS';
export type Status = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';

export interface TravelRequestUser {
  id: number;
  username: string;
  phone_number?: string;
  institute_email?: string;
  branch?: string;
  hostel?: string;
}

export interface TravelRequestDestination {
  id: number;
  name: string;
}

export interface TravelRequestListItem {
  id: number;
  destination: TravelRequestDestination;
  user: TravelRequestUser;
  direction: Direction;
  travel_datetime: string;
  status: Status;
  created_at: string;
  is_match?: boolean;
  match_info?: string;
}

export interface MyTravelRequest {
  id: number;
  destination: TravelRequestDestination;
  direction: Direction;
  travel_datetime: string;
  status: Status;
  created_at: string;
}

export interface TravelRequest {
  id: number;
  destination: number;
  destination_details?: Destination;
  user?: TravelRequestUser;
  direction: Direction;
  travel_datetime: string;
  status: Status;
  created_at: string;
}

export interface CreateTravelRequestPayload {
  destination: number;
  direction: Direction;
  travel_datetime: string;
}

export interface UpdateTravelRequestPayload {
  destination?: number;
  direction?: Direction;
  travel_datetime?: string;
}

export interface TravelRequestFilters {
  destination?: string | number;
  direction?: Direction | '';
  status?: Status | 'ALL' | '';
  date?: string;
  from_datetime?: string;
  to_datetime?: string;
  matching_only?: boolean | string;
}

export interface TravelRequestMatch {
  id: number;
  destination: string | { id: number; name: string };
  user?: TravelRequestUser;
  username: string;
  direction: Direction;
  travel_datetime: string;
  time_difference: number;
}
