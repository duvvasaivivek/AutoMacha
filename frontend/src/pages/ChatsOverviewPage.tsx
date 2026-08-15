import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  MapPin,
  Loader2,
  ShieldCheck,
  Compass,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { getChatRooms, deleteChatRoom } from '@/services/chat.service';
import type { ChatRoom } from '@/types';
import { ChatPage } from './ChatPage';
import { formatTime } from '@/utils/date';

export const ChatsOverviewPage: React.FC = () => {
  const { rideRequestId } = useParams<{ rideRequestId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getChatRooms();
      setRooms(data);
    } catch {
      setError('Unable to load your conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteRoom = async (e: React.MouseEvent, rideRequestId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this chat from your inbox?')) {
      return;
    }
    try {
      await deleteChatRoom(rideRequestId);
      setRooms((prev) => prev.filter((r) => r.ride_request !== rideRequestId));
      if (activeRideRequestId === rideRequestId) {
        navigate('/chats');
      }
    } catch {
      alert('Failed to delete chat room.');
    }
  };

  const filteredRooms = searchKeyword.trim()
    ? rooms.filter((r) => {
        const otherParticipants = r.participant_users.filter(p => p.id !== currentUser?.id);
        const nameMatch = otherParticipants.some(p => p.username.toLowerCase().includes(searchKeyword.toLowerCase()));
        return (
          nameMatch ||
          r.destination_name.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      })
    : rooms;

  const activeRideRequestId = rideRequestId ? parseInt(rideRequestId, 10) : null;

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full bg-white shadow-xs">
      {/* LEFT SIDEBAR — Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-neutral-200 flex flex-col bg-neutral-50/50 ${
          activeRideRequestId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-200 bg-white space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                <MessageSquare className="h-5 w-5 text-emerald-400 fill-current" />
              </div>
              <div>
                <h1 className="font-extrabold text-black text-lg leading-none">Messages</h1>
                <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                  Ride Share Communications
                </p>
              </div>
            </div>

            <Link to="/travel-requests">
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 border-neutral-300">
                <Compass className="h-3.5 w-3.5" />
                <span>Find Rides</span>
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search chats by name or destination..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 h-9 text-xs font-medium bg-neutral-100 border-neutral-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-200/60">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-black" />
              <p className="text-xs text-neutral-500 font-semibold">Loading chats...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-red-600 font-semibold">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchRooms} className="text-xs font-bold">
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && filteredRooms.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-neutral-200/60 text-neutral-400 flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-neutral-900 text-sm">No Conversations</h3>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Chat rooms are automatically created when a ride request is accepted.
                </p>
              </div>
              <Link to="/travel-requests" className="inline-block pt-1">
                <Button size="sm" className="bg-black text-white hover:bg-neutral-800 text-xs font-bold">
                  Browse Rides
                </Button>
              </Link>
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredRooms.map((room) => {
              const otherParticipants = room.participant_users.filter(p => p.id !== currentUser?.id);
              const fallbackPartner = room.created_by_user;
              const displayPartner = otherParticipants[0] || fallbackPartner;
              const hasMultiplePartners = otherParticipants.length > 1;
              const isSelected = activeRideRequestId === room.ride_request;

              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/chats/${room.ride_request}`)}
                  className={`p-3.5 sm:p-4 cursor-pointer transition-all hover:bg-white flex items-center gap-3.5 group relative ${
                    isSelected ? 'bg-white border-l-4 border-l-black shadow-2xs' : ''
                  }`}
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-neutral-800 to-black text-white font-extrabold text-sm flex items-center justify-center uppercase shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {hasMultiplePartners ? 'GRP' : displayPartner.username.slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-extrabold text-neutral-900 text-sm truncate group-hover:text-black">
                        {hasMultiplePartners ? `Group Ride (${otherParticipants.length + 1})` : `@${displayPartner.username}`}
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-semibold shrink-0">
                        {formatTime(room.updated_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate mb-1">
                      <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate font-semibold">{room.destination_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          room.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {room.is_active ? 'Active Ride' : 'Archived'}
                      </span>

                      {room.unread_count > 0 && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shadow-2xs">
                          {room.unread_count}
                        </span>
                      )}
                      
                      {!room.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteRoom(e, room.ride_request)}
                          className="h-6 w-6 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RIGHT MAIN PANEL — Active Chat Room or Selection Empty State */}
      <div className={`flex-1 flex-col ${activeRideRequestId ? 'flex' : 'hidden md:flex'}`}>
        {activeRideRequestId ? (
          <ChatPage />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50/40">
            <div className="max-w-md space-y-4">
              <div className="h-20 w-20 rounded-3xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
                <MessageSquare className="h-10 w-10 text-emerald-400 fill-current" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-black">In-App Live Chat Hub</h2>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-sm mx-auto">
                  Select a conversation from the left sidebar to start chatting with your ride companion.
                  All messages are End-to-End Encrypted.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 p-3 rounded-2xl max-w-xs mx-auto shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero-Knowledge E2EE Protected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsOverviewPage;
