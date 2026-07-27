import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Filter,
  PlusCircle,
  AlertCircle,
  Loader2,
  Navigation,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getDestinations } from '@/services/destination.service';
import { getTravelRequests } from '@/services/travelRequest.service';
import { useAuth } from '@/hooks';
import type { Destination, Direction, TravelRequestListItem, TravelRequestFilters, Status } from '@/types';

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

export const TravelRequestsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<TravelRequestListItem[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local filter input state
  const [destInput, setDestInput] = useState<string>('');
  const [dirInput, setDirInput] = useState<Direction | ''>('');
  const [statusInput, setStatusInput] = useState<string>('OPEN');
  const [dateInput, setDateInput] = useState<string>('');
  const [fromTimeInput, setFromTimeInput] = useState<string>('');
  const [toTimeInput, setToTimeInput] = useState<string>('');

  // Applied filter state
  const [activeFilters, setActiveFilters] = useState<TravelRequestFilters>({ status: 'OPEN' });

  useEffect(() => {
    getDestinations()
      .then((data) => setDestinations(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchRequestsList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTravelRequests(activeFilters);
        setRequests(data);
      } catch {
        setError('Failed to load travel requests.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequestsList();
  }, [activeFilters]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const filters: TravelRequestFilters = {};
    if (destInput) filters.destination = destInput;
    if (dirInput) filters.direction = dirInput;
    if (statusInput) filters.status = statusInput as Status | 'ALL';
    if (dateInput) filters.date = dateInput;

    if (fromTimeInput) {
      if (dateInput) {
        filters.from_datetime = `${dateInput}T${fromTimeInput}`;
      } else {
        filters.from_datetime = `${new Date().toISOString().split('T')[0]}T${fromTimeInput}`;
      }
    }

    if (toTimeInput) {
      if (dateInput) {
        filters.to_datetime = `${dateInput}T${toTimeInput}`;
      } else {
        filters.to_datetime = `${new Date().toISOString().split('T')[0]}T${toTimeInput}`;
      }
    }

    setActiveFilters(filters);
  };

  const handleResetFilters = () => {
    setDestInput('');
    setDirInput('');
    setStatusInput('OPEN');
    setDateInput('');
    setFromTimeInput('');
    setToTimeInput('');
    setActiveFilters({ status: 'OPEN' });
  };

  const hasActiveFilters = Boolean(
    destInput ||
      dirInput ||
      statusInput !== 'OPEN' ||
      dateInput ||
      fromTimeInput ||
      toTimeInput
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Open</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300/80">
            <span>Closed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300/80">
            <span>Cancelled</span>
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-300">
            <span>Expired</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            Travel Requests
          </h1>
          <p className="text-sm font-semibold text-neutral-600 mt-1">
            Discover and browse travel requests created by your peers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/travel-requests/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 bg-black text-white hover:bg-neutral-800 font-bold px-6 shadow-md">
              <PlusCircle className="h-4 w-4" />
              <span>Create Request</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <form onSubmit={handleApplyFilters} className="w-full bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm mb-8 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-black">
            <Filter className="h-4 w-4 text-neutral-600" />
            <span>Filter Requests</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="filter-destination" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Destination
            </label>
            <select
              id="filter-destination"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Destinations</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id.toString()}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-direction" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Direction
            </label>
            <select
              id="filter-direction"
              value={dirInput}
              onChange={(e) => setDirInput(e.target.value as Direction | '')}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Directions</option>
              <option value="FROM_CAMPUS">From Campus</option>
              <option value="TO_CAMPUS">To Campus</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-status" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Status
            </label>
            <select
              id="filter-status"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="OPEN">Open (Default)</option>
              <option value="ALL">All Statuses</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-date" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Travel Date
            </label>
            <input
              id="filter-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-from-time" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Time From
            </label>
            <input
              id="filter-from-time"
              type="time"
              value={fromTimeInput}
              onChange={(e) => setFromTimeInput(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filter-to-time" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Time To
            </label>
            <input
              id="filter-to-time"
              type="time"
              value={toTimeInput}
              onChange={(e) => setToTimeInput(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="font-semibold border-neutral-300 hover:bg-neutral-100 px-4"
          >
            Reset Filters
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-black text-white hover:bg-neutral-800 font-bold gap-2 px-6 shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span>Apply Filters</span>
          </Button>
        </div>
      </form>

      {/* Results Section */}
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <span>Available Rides</span>
          {!isLoading && !error && (
            <span className="bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full border border-neutral-200">
              {requests.length} Found
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        )}

        {!isLoading && error && (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Unable to Load Requests</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && requests.length === 0 && (
          <div className="max-w-md mx-auto my-12 p-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-black text-lg">No requests found.</h3>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-semibold">
                Reset Filters
              </Button>
            ) : (
              <Link to="/travel-requests/new">
                <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5">
                  <span>Create Request</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const isLeaving = req.direction === 'FROM_CAMPUS';
              const isOwner = Boolean(
                currentUser && (req.user.id === currentUser.id || req.user.username === currentUser.username)
              );

              return (
                <Card
                  key={req.id}
                  className="group relative overflow-hidden border-neutral-200/80 bg-white hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between rounded-2xl"
                >
                  <div>
                    <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-5 py-4 flex flex-row items-center justify-between gap-2 space-y-0">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                        <Navigation className={`h-3.5 w-3.5 text-black ${isLeaving ? 'rotate-45' : '-rotate-135'}`} />
                        <span>{isLeaving ? 'From Campus' : 'To Campus'}</span>
                      </div>

                      {getStatusBadge(req.status)}
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-black tracking-tight mt-0.5 group-hover:text-black flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-neutral-700 shrink-0" />
                          <span className="truncate">{req.destination.name}</span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                        <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
                          <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span>{formatDate(req.travel_datetime)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-neutral-800 font-semibold">
                          <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span>{formatTime(req.travel_datetime)}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                            {req.user.username.slice(0, 2)}
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-black">@{req.user.username}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="bg-neutral-50/40 px-5 py-2.5 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium flex items-center justify-between">
                    <span>Posted {formatDate(req.created_at)}</span>
                    {isOwner && req.status === 'OPEN' && (
                      <Link to={`/travel-requests/${req.id}/matches`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-neutral-300 text-black hover:bg-black hover:text-white hover:border-black transition-all gap-1">
                          <span>View Matches</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelRequestsPage;
