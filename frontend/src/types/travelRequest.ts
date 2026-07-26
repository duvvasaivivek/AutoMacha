import type { Destination } from './destination';

export type Direction = 'TO_CAMPUS' | 'FROM_CAMPUS';
export type Status = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface TravelRequestUser {
  id: number;
  username: string;
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
}

export interface TravelRequest {
  id: number;
  destination: number;
  destination_details?: Destination;
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

export interface TravelRequestFilters {
  destination?: string | number;
  direction?: Direction | '';
}

export interface TravelRequestMatch {
  id: number;
  destination: string | { id: number; name: string };
  username: string;
  direction: Direction;
  travel_datetime: string;
  time_difference: number;
}
