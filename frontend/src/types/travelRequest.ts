import type { Destination } from './destination';

export type Direction = 'TO_CAMPUS' | 'FROM_CAMPUS';
export type Status = 'OPEN' | 'CLOSED' | 'CANCELLED';

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
