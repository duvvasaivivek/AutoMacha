import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Navigation,
  ArrowLeft,
  Users,
  Timer,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { getMatches } from '@/services/travelRequest.service';
import type { TravelRequestMatch, TravelRequestUser } from '@/types';
import { RideConnectModal } from '@/components/RideConnectModal';
import { formatDate, formatTime, getUserInitials } from '@/utils';

export const MatchesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<TravelRequestMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<{ partner: TravelRequestUser; destName: string; match: TravelRequestMatch } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchMatchesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMatches(parseInt(id, 10));
        setMatches(data);
      } catch {
        setError('Failed to load ride matches for this travel request.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchesData();
  }, [id]);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full border-b border-neutral-200 pb-6 mb-8 space-y-4">
        <Link
          to="/my-travel-requests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Requests</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black flex items-center gap-3">
              <span>Ride Matches</span>
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                Live
              </span>
            </h1>
            <p className="text-sm font-semibold text-neutral-600 mt-1">
              Students traveling in the same direction around your scheduled time window.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <LoadingSpinner message="Searching for compatible ride partners..." />
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-base">Unable to Load Matches</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && matches.length === 0 && (
        <EmptyState
          title="No Matching Rides Yet"
          description="No other students have posted requests for this destination around your scheduled departure time window."
          icon={<Users className="h-7 w-7 text-neutral-400" />}
          action={
            <Link to="/travel-requests">
              <Button size="sm" variant="outline" className="font-semibold text-xs border-neutral-300">
                Explore All Campus Rides
              </Button>
            </Link>
          }
        />
      )}

      {/* Matches Grid */}
      {!isLoading && !error && matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => {
            const destName = typeof match.destination === 'string' ? match.destination : match.destination.name;
            const isLeaving = match.direction === 'FROM_CAMPUS';
            const diffText = match.time_difference === 0
              ? '0 minutes apart (Same time)'
              : `${match.time_difference} minute${match.time_difference === 1 ? '' : 's'} apart`;
            const partnerUser: TravelRequestUser = match.user || { id: 0, username: match.username };

            return (
              <Card
                key={match.id}
                className="group relative overflow-hidden border-neutral-200/80 bg-white hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between rounded-2xl"
              >
                <div>
                  <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-5 py-4 flex flex-row items-center justify-between gap-2 space-y-0">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                      <Navigation className={`h-3.5 w-3.5 text-black ${isLeaving ? 'rotate-45' : '-rotate-135'}`} />
                      <span>{isLeaving ? 'From Campus' : 'To Campus'}</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Timer className="h-3.5 w-3.5 text-amber-700" />
                      <span>{diffText}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-black tracking-tight mt-0.5 group-hover:text-black flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-neutral-700 shrink-0" />
                        <span className="truncate">{destName}</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                      <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
                        <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span>{formatDate(match.travel_datetime)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
                        <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span>{formatTime(match.travel_datetime)}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="bg-neutral-50/60 px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs shrink-0">
                      {getUserInitials(undefined, partnerUser.username)}
                    </div>
                    <div className="text-xs truncate">
                      <span className="font-bold text-black block truncate">@{partnerUser.username}</span>
                      {partnerUser.branch && (
                        <span className="text-[10px] text-neutral-400 block font-medium truncate">{partnerUser.branch}</span>
                      )}
                    </div>
                  </div>
                  {match.chat_room_id ? (
                    <Link to={`/chats`}>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs gap-1.5 h-8 px-3 shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-white" />
                        <span>Open Chat</span>
                      </Button>
                    </Link>
                  ) : match.has_requested ? (
                    <Button
                      size="sm"
                      disabled
                      className="bg-neutral-200 text-neutral-500 font-bold text-xs gap-1.5 h-8 px-3 opacity-100"
                    >
                      <span>Request Sent</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPartner({ partner: partnerUser, destName, match });
                      }}
                      className="bg-black text-white hover:bg-neutral-800 font-bold text-xs gap-1.5 h-8 px-3 shadow-xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Connect & Chat</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedPartner && (
        <RideConnectModal
          isOpen={Boolean(selectedPartner)}
          onClose={() => setSelectedPartner(null)}
          partner={selectedPartner.partner}
          destinationName={selectedPartner.destName}
          travelDate={`${formatDate(selectedPartner.match.travel_datetime)} at ${formatTime(selectedPartner.match.travel_datetime)}`}
          requestId={selectedPartner.match.id}
          onRequestSent={() => {
            setMatches(prevMatches =>
              prevMatches.map(m =>
                m.id === selectedPartner.match.id ? { ...m, has_requested: true } : m
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default MatchesPage;

// SEO: Verify that appropriate meta tags are dynamically injected for this route
