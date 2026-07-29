export type MessageType = 'TEXT' | 'SYSTEM' | 'IMAGE' | 'LOCATION' | 'VOICE';

export interface ChatMessageSender {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  branch?: string;
  hostel?: string;
  phone_number?: string;
  institute_email?: string;
}

export interface ChatMessage {
  id: number;
  chat_room: number;
  sender: number | null;
  sender_user?: ChatMessageSender | null;
  message: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  ride_request: number;
  created_by: number;
  created_by_user: ChatMessageSender;
  partner: number;
  partner_user: ChatMessageSender;
  destination_name: string;
  travel_datetime: string;
  ride_status: string;
  is_active: boolean;
  closed_at?: string | null;
  unread_count: number;
  last_message?: ChatMessage | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedChatMessageResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: ChatMessage[];
}

export interface WebSocketChatMessageEvent {
  type: 'chat_message_broadcast';
  message_id: number;
  chat_room_id: number;
  ride_request_id: number;
  sender: string | null;
  sender_id: number | null;
  message: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
}

export interface WebSocketTypingEvent {
  type: 'typing_broadcast';
  sender: string;
  sender_id: number;
  is_typing: boolean;
}

export interface WebSocketReadReceiptEvent {
  type: 'read_receipt_broadcast';
  chat_room_id: number;
  reader: string;
  reader_id: number;
}

export interface WebSocketErrorEvent {
  type: 'error';
  message: string;
}

export type WebSocketEvent =
  | WebSocketChatMessageEvent
  | WebSocketTypingEvent
  | WebSocketReadReceiptEvent
  | WebSocketErrorEvent;
