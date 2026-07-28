export interface AutoDriver {
  id: number;
  full_name: string;
  phone_number: string;
  vehicle_number?: string;
  notes?: string;
  is_verified: boolean;
  is_active: boolean;
  created_by_username?: string | null;
  created_at: string;
}

export interface SuggestAutoDriverPayload {
  full_name: string;
  phone_number: string;
  vehicle_number?: string;
  notes?: string;
}

export interface SuggestAutoDriverResponse {
  message: string;
  driver: AutoDriver;
}
