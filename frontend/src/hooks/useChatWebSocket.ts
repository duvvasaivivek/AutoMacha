import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/auth';
import type { ChatMessage, WebSocketEvent } from '@/types';
import { encryptMessage, decryptMessage } from '@/utils/crypto';

interface UseChatWebSocketOptions {
  rideRequestId: number | null;
  enabled?: boolean;
  currentUsername?: string;
  cryptoKey?: CryptoKey | null;
  onNewMessage?: (msg: ChatMessage) => void;
}

export function useChatWebSocket({
  rideRequestId,
  enabled = true,
  currentUsername,
  cryptoKey = null,
  onNewMessage,
}: UseChatWebSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIntentionalCloseRef = useRef<boolean>(false);

  // Keep refs for cryptoKey and onNewMessage to avoid tearing down WebSocket on key updates
  const cryptoKeyRef = useRef<CryptoKey | null>(cryptoKey);
  const onNewMessageRef = useRef<((msg: ChatMessage) => void) | undefined>(onNewMessage);

  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;
  }, [cryptoKey]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Re-decrypt messages if cryptoKey becomes available after messages were received
  useEffect(() => {
    if (!cryptoKey) return;
    setMessages((prev) =>
      Promise.all(
        prev.map(async (msg) => {
          if (msg.message_type === 'TEXT' && msg.iv && !msg.is_deleted_everyone) {
            try {
              const decrypted = await decryptMessage(msg.message, msg.iv, cryptoKey);
              return { ...msg, message: decrypted };
            } catch {
              return msg;
            }
          }
          return msg;
        })
      ) as unknown as ChatMessage[]
    );
  }, [cryptoKey]);

  const connectWebSocket = useCallback(() => {
    if (!rideRequestId || !enabled) return;

    const token = getAccessToken();
    if (!token) {
      setError('Authentication token missing. Please log in.');
      return;
    }

    // Clean up any existing connection before opening a new one
    if (socketRef.current) {
      isIntentionalCloseRef.current = true;
      socketRef.current.close();
      socketRef.current = null;
    }

    isIntentionalCloseRef.current = false;

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

    ws.onmessage = async (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);

        if (data.type === 'chat_message_broadcast') {
          let decryptedText = data.message;
          const activeKey = cryptoKeyRef.current;
          if (data.message_type === 'TEXT' && data.iv && activeKey) {
            decryptedText = await decryptMessage(data.message, data.iv, activeKey);
          }

          const newMsg: ChatMessage = {
            id: data.message_id,
            chat_room: data.chat_room_id,
            sender: data.sender_id,
            sender_user: data.sender ? { id: data.sender_id || 0, username: data.sender } : null,
            message: decryptedText,
            iv: data.iv,
            message_type: data.message_type,
            is_read: data.is_read,
            is_deleted_everyone: data.is_deleted_everyone,
            created_at: data.created_at,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
            }
            return [...prev, newMsg];
          });

          if (onNewMessageRef.current) {
            onNewMessageRef.current(newMsg);
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
        } else if (data.type === 'delete_message_broadcast') {
          if (data.mode === 'everyone') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.message_id
                  ? { ...m, is_deleted_everyone: true, message: 'This message was deleted' }
                  : m
              )
            );
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
          }
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

      // Ignore intentional close during unmount or parameter changes
      if (isIntentionalCloseRef.current) {
        return;
      }

      if (evt.code === 4003) {
        setError('Unauthorized: You are not a participant in this ride chat.');
        return;
      }
      if (evt.code === 4001) {
        setError('Authentication expired. Please log in again.');
        return;
      }

      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };
  }, [rideRequestId, enabled, currentUsername]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        let payloadMessage = text;
        let payloadIv: string | null = null;
        const activeKey = cryptoKeyRef.current;

        if (activeKey) {
          try {
            const encrypted = await encryptMessage(text, activeKey);
            payloadMessage = encrypted.cipherText;
            payloadIv = encrypted.iv;
          } catch (e) {
            console.error('Encryption failed, sending unencrypted text:', e);
          }
        }

        socketRef.current.send(
          JSON.stringify({
            type: 'chat_message',
            message: payloadMessage,
            iv: payloadIv,
          })
        );
      }
    },
    []
  );

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
