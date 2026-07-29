import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  MapPin,
  Calendar,
  Clock,
  Phone,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  Lock,
  MessageSquare,
  Sparkles,
  Info,
  X,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import {
  getChatRoom,
  getChatMessages,
  markChatRoomRead,
} from '@/services/chat.service';
import type { ChatRoom, ChatMessage } from '@/types';
import { formatDate, formatTime } from '@/utils/date';

export const ChatPage: React.FC = () => {
  const { rideRequestId } = useParams<{ rideRequestId: string }>();
  const parsedRideRequestId = rideRequestId ? parseInt(rideRequestId, 10) : null;
  const { user: currentUser } = useAuth();

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleNewMessage = useCallback(() => {
    if (parsedRideRequestId) {
      markChatRoomRead(parsedRideRequestId).catch(() => {});
      window.dispatchEvent(new Event('chat-unread-updated'));
    }
  }, [parsedRideRequestId]);

  const {
    messages,
    setMessages,
    sendMessage,
    sendTyping,
    markRead,
    isConnected,
    partnerIsTyping,
    error: wsError,
  } = useChatWebSocket({
    rideRequestId: parsedRideRequestId,
    enabled: Boolean(parsedRideRequestId && room?.is_participant(currentUser)),
    currentUsername: currentUser?.username,
    onNewMessage: handleNewMessage,
  });

  // Fetch Chat Room details and initial message history
  useEffect(() => {
    if (!parsedRideRequestId) return;

    const fetchInitialChatData = async () => {
      setIsLoadingRoom(true);
      setRoomError(null);
      try {
        const roomData = await getChatRoom(parsedRideRequestId);
        setRoom(roomData);

        const historyData = await getChatMessages(parsedRideRequestId);
        setMessages(historyData.results || []);

        // Mark room as read on open
        await markChatRoomRead(parsedRideRequestId);
        window.dispatchEvent(new Event('chat-unread-updated'));
      } catch (err: any) {
        setRoomError(err?.response?.data?.detail || 'Unable to access chat room. You may not be an authorized ride participant.');
      } font: {
        setIsLoadingRoom(false);
      }
    };

    fetchInitialChatData();
  }, [parsedRideRequestId, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerIsTyping]);

  const partnerUser = room
    ? currentUser?.id === room.created_by
      ? room.partner_user
      : room.created_by_user
    : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);

    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !room?.is_active) return;

    sendMessage(inputText.trim());
    setInputText('');
    sendTyping(false);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
  };

  // Filter messages by search keyword
  const filteredMessages = searchKeyword.trim()
    ? messages.filter((msg) =>
        msg.message.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : messages;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full bg-white sm:border-x border-neutral-200">
      {/* 1. RIDE HEADER */}
      <header className="bg-neutral-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-neutral-800 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/my-travel-requests"
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Back to My Requests"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {partnerUser ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-black font-black text-sm flex items-center justify-center uppercase shrink-0 shadow-xs">
                {partnerUser.username.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-white text-base truncate">
                    @{partnerUser.username}
                  </h2>
                  {room && (
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        room.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-neutral-700 text-neutral-400 border-neutral-600'
                      }`}
                    >
                      {room.is_active ? 'Active Ride' : 'Archived'}
                    </span>
                  )}
                </div>
                {room && (
                  <div className="text-xs text-neutral-400 flex items-center gap-2 truncate">
                    <span className="truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{room.destination_name}</span>
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{formatTime(room.travel_datetime)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="font-bold text-sm text-neutral-400">Loading Ride Details...</div>
          )}
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl transition-colors text-neutral-300 hover:text-white ${
              showSearch ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800'
            }`}
            title="Search in chat"
          >
            <Search className="h-4 w-4" />
          </button>

          {partnerUser?.phone_number && (
            <a
              href={`tel:${partnerUser.phone_number}`}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs px-3"
              title="Call partner"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Call</span>
            </a>
          )}
        </div>
      </header>

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="bg-neutral-100 p-3 border-b border-neutral-200 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Search className="h-4 w-4 text-neutral-500 ml-2" />
          <Input
            type="text"
            placeholder="Search messages in conversation..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-9 bg-white text-xs font-medium border-neutral-300"
            autoFocus
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="text-xs font-semibold text-neutral-500 hover:text-black px-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* 2. MAIN MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/60">
        {/* Loading State */}
        {isLoadingRoom && (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <p className="text-xs font-medium text-neutral-500">Establishing chat connection...</p>
          </div>
        )}

        {/* Room Error / Security Violation */}
        {!isLoadingRoom && roomError && (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Chat Access Restricted</h3>
            <p className="text-xs text-red-700 leading-relaxed">{roomError}</p>
            <div className="pt-2">
              <Link to="/my-travel-requests">
                <Button size="sm" variant="outline" className="font-semibold text-xs border-red-300 text-red-900">
                  Return to My Requests
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* WS Connection Warning */}
        {wsError && room?.is_active && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{wsError}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingRoom && !roomError && filteredMessages.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-neutral-200/70 text-neutral-400 flex items-center justify-center mx-auto shadow-xs">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-black text-base">No messages yet</h3>
              <p className="text-xs text-neutral-500 font-medium">
                Say hello and coordinate your pickup point and timing!
              </p>
            </div>
          </div>
        )}

        {/* Messages List */}
        {!isLoadingRoom &&
          !roomError &&
          filteredMessages.map((msg) => {
            const isSystem = msg.message_type === 'SYSTEM' || msg.sender === null;
            const isMe = msg.sender_user?.username === currentUser?.username;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="bg-neutral-200/80 text-neutral-800 text-[11px] font-semibold px-4 py-1.5 rounded-full border border-neutral-300 text-center max-w-md shadow-2xs">
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-none'
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium px-1">
                  <span>{formatTime(msg.created_at)}</span>
                  {isMe && (
                    <span className="inline-flex items-center">
                      {msg.is_read ? (
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-500" title="Read" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-neutral-400" title="Delivered" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        {/* Typing Indicator */}
        {partnerIsTyping && partnerUser && (
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 animate-pulse py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>@{partnerUser.username} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. CLOSED ROOM WARNING BANNER */}
      {room && !room.is_active && (
        <div className="bg-neutral-100 border-t border-neutral-200 p-3 px-6 text-center text-xs font-semibold text-neutral-600 flex items-center justify-center gap-2 shrink-0">
          <Lock className="h-3.5 w-3.5 text-neutral-500" />
          <span>This ride has been completed or cancelled. Chat room is archived for reading only.</span>
        </div>
      )}

      {/* 4. STICKY MESSAGE INPUT */}
      {room && room.is_active && (
        <form
          onSubmit={handleSend}
          className="bg-white border-t border-neutral-200 p-3 sm:p-4 flex items-center gap-3 shrink-0"
        >
          <Input
            type="text"
            placeholder={`Message @${partnerUser?.username || 'partner'}...`}
            value={inputText}
            onChange={handleInputChange}
            disabled={!isConnected}
            className="flex-1 h-12 rounded-2xl border-neutral-300 text-sm font-semibold text-black bg-neutral-50 focus:bg-white"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="h-12 w-12 rounded-2xl bg-black text-white hover:bg-neutral-800 font-bold shrink-0 shadow-sm"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      )}
    </div>
  );
};

export default ChatPage;
