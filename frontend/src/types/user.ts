export interface User {
  id: number;
  username: string;
  full_name?: string;
  institute_email: string;
  roll_number: string;
  branch: string;
  academic_year?: string;
  hostel: string;
  gender: string;
  phone_number?: string;
  bio?: string;
  profile_picture?: string | null;
  date_joined?: string;
  last_updated?: string;
  average_rating?: number | string;
  total_ratings?: number;
  total_completed_rides?: number;
  total_travel_requests?: number;
  total_ride_shares?: number;
  verification_status?: 'verified' | 'pending' | 'unverified';
  role?: string;
  is_email_verified?: boolean;
  account_age_days?: number;
  is_staff?: boolean;
  is_superuser?: boolean;
}

