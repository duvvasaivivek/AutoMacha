export interface AdminDashboardStats {
  total_users: number;
  verified_users: number;
  today_registrations: number;
  active_travel_requests: number;
  completed_rides: number;
  pending_driver_suggestions: number;
  pending_destination_suggestions: number;
  unread_notifications: number;
}

export interface AdminUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  institute_email: string;
  roll_number: string;
  phone_number?: string;
  bio?: string;
  avatar_url?: string;
  is_verified?: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuditLog {
  id: number;
  admin_username: string;
  action: string;
  affected_object: string;
  details: Record<string, any>;
  request_id: string;
  ip_address: string;
  timestamp: string;
}

export interface SystemLog {
  timestamp: string;
  level: string;
  logger: string;
  module: string;
  req_id: string;
  user_ip: string;
  message: string;
}

export interface AnalyticsData {
  daily_registrations: Array<{ day: string; count: number }>;
  status_breakdown: Array<{ status: string; count: number }>;
  top_destinations: Array<{ destination__name: string; count: number }>;
}

export interface SystemHealth {
  backend: string;
  database: string;
  version: string;
  celery: string;
  redis: string;
  timestamp: string;
}

export interface ImpersonationResponse {
  message: string;
  access: string;
  refresh: string;
  target_user: AdminUser;
}
