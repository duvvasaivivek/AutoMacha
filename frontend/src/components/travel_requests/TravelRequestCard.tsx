import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Navigation, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/utils/date';
import type { TravelRequestListItem, TravelRequestUser, User } from '@/types';

interface TravelRequestCardProps {
  request: TravelRequestListItem;
  currentUser: User | null;
  onSelectPartner?: (partnerData: { user: TravelRequestUser; destName: string; dateStr: string; reqId: number }) => void;
}

export const TravelRequestCard: React.FC<TravelRequestCardProps> = ({
  request,
  currentUser,
  onSelectPartner,
}) => {
  const isLeaving = request.direction === 'FROM_CAMPUS';
  const isOwner = Boolean(
    currentUser && (request.user.id === currentUser.id || request.user.username === currentUser.username)
  );

  return (
    <Card
      className={`group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between rounded-2xl border ${
        request.is_match ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-neutral-200/80 hover:border-black'
      }`}
    >
      <div>
        {request.is_match && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-extrabold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>✨ RIDE MATCH</span>
            </span>
            <span className="text-[11px] font-semibold opacity-95 truncate max-w-[190px]">
              {request.match_info || 'Compatible with your trip'}
            </span>
          </div>
        )}
        <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-5 py-4 flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
            <Navigation className={`h-3.5 w-3.5 text-black ${isLeaving ? 'rotate-45' : '-rotate-135'}`} />
            <span>{isLeaving ? 'From Campus' : 'To Campus'}</span>
          </div>

          <StatusBadge status={request.status} />
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-xl font-black text-black tracking-tight mt-0.5 group-hover:text-black flex items-center gap-2">
              <MapPin className="h-5 w-5 text-neutral-700 shrink-0" />
              <span className="truncate">{request.destination.name}</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
              <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                <Calendar className="h-4 w-4" />
              </div>
              <span>{formatDate(request.travel_datetime)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
              <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                <Clock className="h-4 w-4" />
              </div>
              <span>{formatTime(request.travel_datetime)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                {request.user.username.slice(0, 2)}
              </div>
              <div className="text-xs">
                <span className="font-bold text-black">@{request.user.username}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="bg-neutral-50/40 px-5 py-2.5 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium flex items-center justify-between gap-2">
        <span>Posted {formatDate(request.created_at)}</span>
        <div className="flex items-center gap-2">
          {request.is_match && !isOwner && (
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 text-[11px] shadow-2xs">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Compatible</span>
            </span>
          )}
          {!isOwner && request.status === 'OPEN' && onSelectPartner && (
            <Button
              size="sm"
              onClick={() => {
                onSelectPartner({
                  user: request.user,
                  destName: request.destination.name,
                  dateStr: `${formatDate(request.travel_datetime)} at ${formatTime(request.travel_datetime)}`,
                  reqId: request.id,
                });
              }}
              className="bg-black text-white hover:bg-neutral-800 font-bold text-xs gap-1 h-7 px-2.5 shadow-2xs"
            >
              <MessageCircle className="h-3 w-3 text-emerald-400" />
              <span>Connect & Chat</span>
            </Button>
          )}
          {isOwner && request.status === 'OPEN' && (
            <Link to={`/travel-requests/${request.id}/matches`}>
              <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-neutral-300 text-black hover:bg-black hover:text-white hover:border-black transition-all gap-1">
                <span>View Matches</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TravelRequestCard;
