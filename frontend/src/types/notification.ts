import type { TravelRequestUser } from './travelRequest';

export type NotificationType =
  | 'RIDE_SHARE_REQUEST_RECEIVED'
  | 'RIDE_SHARE_REQUEST_ACCEPTED'
  | 'RIDE_SHARE_REQUEST_DECLINED'
  | 'TRAVEL_REQUEST_EXPIRED'
  | 'NEW_MATCH_FOUND';

export interface Notification {
  id: number;
  user?: number;
  user_username?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  related_object_id?: number;
  is_read: boolean;
  created_at: string;
  sender_user?: TravelRequestUser;
}
