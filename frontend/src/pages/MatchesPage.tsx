import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Navigation,
  ArrowLeft,
  Users,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getMatches } from '@/services/travelRequest.service';
import type { TravelRequestMatch } from '@/types';
import axios from 'axios';

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export const MatchesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<TravelRequestMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchesData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMatches(id);
        setMatches(data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            setError('You do not have permission to view matches for this request. Only the owner can view matches.');
          } else if (err.response?.status === 404) {
            setError('Travel request not found.');
          } else {
            setError('Failed to load compatible matches.');
          }
        } else {
          setError('An unexpected error occurred while loading matches.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchesData();
  }, [id]);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div className="space-y-1">
          <Link
            to="/travel-requests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Travel Requests</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black flex items-center gap-2.5">
            <span>Compatible Rides</span>
          </h1>
        </div>

        {!isLoading && !error && (
          <span className="bg-neutral-100 text-neutral-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-neutral-200 shrink-0">
            {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Found
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 text-base">Unable to Load Matches</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Link to="/travel-requests">
            <Button size="sm" variant="outline" className="font-semibold border-red-300 text-red-900 hover:bg-red-100">
              Return to Requests
            </Button>
          </Link>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && matches.length === 0 && (
        <div className="max-w-md mx-auto my-12 p-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-4">
          <Users className="h-10 w-10 text-neutral-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-black text-lg">No Matches Found</h3>
          </div>
          <Link to="/travel-requests">
            <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Requests</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Matches Grid */}
      {!isLoading && !error && matches.length > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => {
            const isLeaving = match.direction === 'FROM_CAMPUS';
            const destName = typeof match.destination === 'string' ? match.destination : match.destination?.name || '';
            const diffText = match.time_difference === 0
              ? '0 minutes apart (Same time)'
              : `${match.time_difference} minute${match.time_difference === 1 ? '' : 's'} apart`;

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

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                          {match.username.slice(0, 2)}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-black">@{match.username}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
