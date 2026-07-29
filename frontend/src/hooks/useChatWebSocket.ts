import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/auth';
import type { ChatMessage, WebSocketEvent } from '@/types';

interface UseChatWebSocketOptions {
  rideRequestId: number | null;
  enabled?: boolean;
  currentUsername?: string;
  onNewMessage?: (msg: ChatMessage) => void;
}

export function useChatWebSocket({
  rideRequestId,
  enabled = true,
  currentUsername,
  onNewMessage,
}: UseChatWebSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!rideRequestId || !enabled) return;

    const token = getAccessToken();
    if (!token) {
      setError('Authentication token missing. Please log in.');
      return;
    }

    // Determine WS protocol (ws:// or wss://)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || '127.0.0.1:8000';
    const wsUrl = `${protocol}//${host}/ws/chat/${rideRequestId}/?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);

        if (data.type === 'chat_message_broadcast') {
          const newMsg: ChatMessage = {
            id: data.message_id,
            chat_room: data.chat_room_id,
            sender: data.sender_id,
            sender_user: data.sender ? { id: data.sender_id || 0, username: data.sender } : null,
            message: data.message,
            message_type: data.message_type,
            is_read: data.is_read,
            created_at: data.created_at,
          };

          setMessages((prev) => {
            // Avoid duplicate message appending
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });

          if (onNewMessage) {
            onNewMessage(newMsg);
          }
        } else if (data.type === 'typing_broadcast') {
          if (data.sender !== currentUsername) {
            setPartnerIsTyping(data.is_typing);
            if (data.is_typing) {
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => {
                setPartnerIsTyping(false);
              }, 3000);
            }
          }
        } else if (data.type === 'read_receipt_broadcast') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender_user?.username !== data.reader ? { ...msg, is_read: true } : msg
            )
          );
        } else if (data.type === 'error') {
          setError(data.message);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      setError('Real-time connection error.');
    };

    ws.onclose = (evt) => {
      setIsConnected(false);
      socketRef.current = null;

      if (evt.code === 4003) {
        setError('Unauthorized: You are not a participant in this ride chat.');
        return;
      }
      if (evt.code === 4001) {
        setError('Authentication expired. Please log in again.');
        return;
      }

      // Exponential backoff auto-reconnect (up to 5 attempts)
      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };
  }, [rideRequestId, enabled, currentUsername, onNewMessage]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          message: text,
        })
      );
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'typing',
          is_typing: isTyping,
        })
      );
    }
  }, []);

  const markRead = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'mark_read',
        })
      );
    }
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    sendTyping,
    markRead,
    isConnected,
    partnerIsTyping,
    error,
  };
}
