import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  PlusCircle,
  Compass,
  Eye,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getRideHistory,
  getRideHistorySummary,
} from '@/services/rideHistory.service';
import type {
  RideHistory,
  RideHistoryFilters,
  RideHistorySummary,
  RideStatus,
} from '@/types';
import { formatDate, formatTime } from '@/utils/date';
import { RideDetailsModal } from '@/components/RideDetailsModal';

export const RideHistoryPage: React.FC = () => {
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [summary, setSummary] = useState<RideHistorySummary | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);

  // Filters State
  const [searchInput, setSearchInput] = useState<string>('');
  const [statusInput, setStatusInput] = useState<RideStatus | 'ALL' | ''>('ALL');
  const [dateRangeInput, setDateRangeInput] = useState<'today' | 'week' | 'month' | 'custom' | ''>('');
  const [fromDateInput, setFromDateInput] = useState<string>('');
  const [toDateInput, setToDateInput] = useState<string>('');
  const [orderingInput, setOrderingInput] = useState<'-departure_time' | 'departure_time'>('-departure_time');

  const fetchHistoryData = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: RideHistoryFilters = {
        page: pageNum,
        ordering: orderingInput,
      };

      if (statusInput && statusInput !== 'ALL') {
        filters.status = statusInput;
      }
      if (searchInput.trim()) {
        filters.search = searchInput.trim();
      }
      if (dateRangeInput && dateRangeInput !== 'custom') {
        filters.date_range = dateRangeInput;
      }
      if (fromDateInput) {
        filters.from_date = fromDateInput;
      }
      if (toDateInput) {
        filters.to_date = toDateInput;
      }

      const [historyResponse, summaryData] = await Promise.all([
        getRideHistory(filters),
        getRideHistorySummary().catch(() => null),
      ]);

      setRides(historyResponse.results || []);
      setTotalCount(historyResponse.count || 0);
      setHasNextPage(Boolean(historyResponse.next));
      setHasPrevPage(Boolean(historyResponse.previous));
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch {
      setError('Failed to load ride history records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusInput, searchInput, dateRangeInput, fromDateInput, toDateInput, orderingInput]);

  useEffect(() => {
    fetchHistoryData(currentPage);
  }, [fetchHistoryData, currentPage]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistoryData(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusInput('ALL');
    setDateRangeInput('');
    setFromDateInput('');
    setToDateInput('');
    setOrderingInput('-departure_time');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput ||
    (statusInput && statusInput !== 'ALL') ||
    dateRangeInput ||
    fromDateInput ||
    toDateInput
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <span>Cancelled</span>
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <span>Expired</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Ride History
            </h1>
            <p className="text-sm font-semibold text-neutral-600 mt-1">
              View and filter all of your past completed, cancelled, and expired ride activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/travel-requests">
            <Button size="sm" variant="outline" className="gap-2 font-bold border-neutral-300 hover:bg-neutral-100 text-black">
              <Compass className="h-4 w-4" />
              <span>Find a Ride</span>
            </Button>
          </Link>
          <Link to="/travel-requests/new">
            <Button size="sm" className="gap-2 bg-black text-white hover:bg-neutral-800 font-bold px-5 shadow-md">
              <PlusCircle className="h-4 w-4" />
              <span>Create Request</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards Section */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-neutral-200/80 bg-white shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-neutral-50/50 border-b border-neutral-100 px-4 sm:px-5 py-3">
            <CardTitle className="text-xs font-bold uppercase text-neutral-600 tracking-wider">
              Total Rides
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-neutral-200/70 text-black">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-black text-black">
              {summary ? summary.total_rides : totalCount}
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 mt-1">All time recorded</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 border-b border-emerald-100 px-4 sm:px-5 py-3">
            <CardTitle className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
              Completed
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">
              {summary ? summary.completed_rides : 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-1">Successful trips</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 bg-white shadow-sm hover:shadow-md hover:border-rose-300 transition-all rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-rose-50/50 border-b border-rose-100 px-4 sm:px-5 py-3">
            <CardTitle className="text-xs font-bold uppercase text-rose-800 tracking-wider">
              Cancelled
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-black text-rose-950">
              {summary ? summary.cancelled_rides : 0}
            </div>
            <p className="text-[11px] font-semibold text-rose-700 mt-1">Cancelled plans</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-white shadow-sm hover:shadow-md hover:border-amber-300 transition-all rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-amber-50/50 border-b border-amber-100 px-4 sm:px-5 py-3">
            <CardTitle className="text-xs font-bold uppercase text-amber-800 tracking-wider">
              Expired
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-black text-amber-950">
              {summary ? summary.expired_rides : 0}
            </div>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">Past unfulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls Form */}
      <form
        onSubmit={handleApplyFilters}
        className="w-full bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm mb-8 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-black">
            <Filter className="h-4 w-4 text-neutral-600" />
            <span>Search & Filter History</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="search-history" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Search Keyword
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <Input
                id="search-history"
                type="text"
                placeholder="Search destination, partner name, pickup..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 rounded-xl border-neutral-300 text-sm font-semibold text-black"
              />
            </div>
          </div>

          {/* Status Select */}
          <div className="space-y-1.5">
            <label htmlFor="filter-status" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Ride Status
            </label>
            <select
              id="filter-status"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value as RideStatus | 'ALL')}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Date Range Shortcut */}
          <div className="space-y-1.5">
            <label htmlFor="filter-date-shortcut" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Time Period
            </label>
            <select
              id="filter-date-shortcut"
              value={dateRangeInput}
              onChange={(e) => setDateRangeInput(e.target.value as any)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Inputs (Conditional) */}
          {dateRangeInput === 'custom' && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="filter-from-date" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  From Date
                </label>
                <input
                  id="filter-from-date"
                  type="date"
                  value={fromDateInput}
                  onChange={(e) => setFromDateInput(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="filter-to-date" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  To Date
                </label>
                <input
                  id="filter-to-date"
                  type="date"
                  value={toDateInput}
                  onChange={(e) => setToDateInput(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
            </>
          )}

          {/* Ordering Select */}
          <div className="space-y-1.5">
            <label htmlFor="filter-ordering" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Sort By
            </label>
            <select
              id="filter-ordering"
              value={orderingInput}
              onChange={(e) => setOrderingInput(e.target.value as any)}
              className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="-departure_time">Newest Departure First</option>
              <option value="departure_time">Oldest Departure First</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 mt-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="font-semibold border-neutral-300 hover:bg-neutral-100 px-4 text-black"
            >
              Clear Filters
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="bg-black text-white hover:bg-neutral-800 font-bold gap-2 px-6 shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span>Apply Search</span>
          </Button>
        </div>
      </form>

      {/* Main Results Grid */}
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <span>Recorded Activities ({totalCount})</span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <p className="text-xs font-semibold text-neutral-500">Retrieving ride history...</p>
          </div>
        )}

        {/* Error Container */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Unable to Load Ride History</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && rides.length === 0 && (
          <div className="max-w-md mx-auto my-12 p-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto shadow-sm">
              <History className="h-8 w-8 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-black text-lg">
                {hasActiveFilters ? 'No matching rides found' : 'You haven\'t completed any rides yet.'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {hasActiveFilters
                  ? 'Try broadening your search or clearing active status and date filters.'
                  : 'Scheduled, cancelled, or expired rides will automatically be logged here in your activity history.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-semibold border-neutral-300 text-black">
                  Clear Filters
                </Button>
              ) : (
                <Link to="/travel-requests">
                  <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-bold gap-2 shadow-sm">
                    <Compass className="h-4 w-4" />
                    <span>Find a Ride</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* History Cards Grid */}
        {!isLoading && !error && rides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <Card
                key={ride.id}
                className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between rounded-2xl border border-neutral-200/80 hover:border-black"
              >
                <div>
                  <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-5 py-4 flex flex-row items-center justify-between gap-2 space-y-0">
                    <div className="text-[11px] font-extrabold text-neutral-500 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                      #{ride.id}
                    </div>

                    {getStatusBadge(ride.ride_status)}
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-black tracking-tight mt-0.5 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-neutral-700 shrink-0" />
                        <span className="truncate">{ride.destination}</span>
                      </h3>
                      <div className="text-xs text-neutral-500 font-medium mt-1">
                        Pickup: <span className="font-semibold text-neutral-800">{ride.pickup_location || 'Campus'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-2 text-xs text-neutral-800 font-semibold">
                        <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <span>{formatDate(ride.departure_time)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-800 font-semibold">
                        <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-600">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <span>{formatTime(ride.departure_time)}</span>
                      </div>
                    </div>

                    {/* Ride Partner Badge */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      {ride.ride_partner ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                            {ride.ride_partner.username.slice(0, 2)}
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-black">@{ride.ride_partner.username}</span>
                            <span className="text-[10px] text-neutral-400 block font-medium">Partner</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 font-medium italic">
                          Solo Trip
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="bg-neutral-50/40 px-5 py-3 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium flex items-center justify-between gap-2">
                  <span>
                    Recorded {ride.completed_at ? formatDate(ride.completed_at) : formatDate(ride.created_at)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedRide(ride)}
                    className="bg-black text-white hover:bg-neutral-800 font-bold text-xs gap-1.5 h-7 px-3 shadow-2xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Details</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && totalCount > 10 && (
          <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
            <div className="text-xs font-semibold text-neutral-500">
              Page {currentPage} of {Math.ceil(totalCount / 10)} ({totalCount} total entries)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevPage || currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="font-bold text-xs border-neutral-300 text-black gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="font-bold text-xs border-neutral-300 text-black gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ride Details Modal Dialog */}
      <RideDetailsModal
        isOpen={Boolean(selectedRide)}
        onClose={() => setSelectedRide(null)}
        ride={selectedRide}
      />
    </div>
  );
};

export default RideHistoryPage;
