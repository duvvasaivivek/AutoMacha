import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useDestinations, useTravelRequests } from '@/hooks';
import type { Direction, Status, TravelRequestFilters, TravelRequestUser } from '@/types';
import { RideConnectModal } from '@/components/RideConnectModal';
import { TravelRequestCard } from '@/components/travel_requests/TravelRequestCard';
import { FilterBar } from '@/components/travel_requests/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export const TravelRequestsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { destinations } = useDestinations();

  // Local filter inputs
  const [destInput, setDestInput] = useState<string>('');
  const [dirInput, setDirInput] = useState<Direction | ''>('');
  const [statusInput, setStatusInput] = useState<string>('OPEN');
  const [dateInput, setDateInput] = useState<string>('');
  const [fromTimeInput, setFromTimeInput] = useState<string>('');
  const [toTimeInput, setToTimeInput] = useState<string>('');

  const [filterMode, setFilterMode] = useState<'MATCHES' | 'ALL'>(currentUser ? 'MATCHES' : 'ALL');
  const [selectedPartner, setSelectedPartner] = useState<{ user: TravelRequestUser; destName: string; dateStr: string; reqId: number } | null>(null);

  const { requests, setFilters, isLoading, error } = useTravelRequests({
    status: 'OPEN',
    matching_only: currentUser ? true : undefined,
  });

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

    if (filterMode === 'MATCHES') {
      filters.matching_only = true;
    }

    setFilters(filters);
  };

  const handleResetFilters = () => {
    setDestInput('');
    setDirInput('');
    setStatusInput('OPEN');
    setDateInput('');
    setFromTimeInput('');
    setToTimeInput('');
    setFilters({
      status: 'OPEN',
      matching_only: filterMode === 'MATCHES' ? true : undefined,
    });
  };

  const hasActiveFilters = Boolean(
    destInput ||
      dirInput ||
      statusInput !== 'OPEN' ||
      dateInput ||
      fromTimeInput ||
      toTimeInput
  );

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
      <FilterBar
        destinations={destinations}
        destInput={destInput}
        setDestInput={setDestInput}
        dirInput={dirInput}
        setDirInput={setDirInput}
        statusInput={statusInput}
        setStatusInput={setStatusInput}
        dateInput={dateInput}
        setDateInput={setDateInput}
        fromTimeInput={fromTimeInput}
        setFromTimeInput={setFromTimeInput}
        toTimeInput={toTimeInput}
        setToTimeInput={setToTimeInput}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Results Section */}
      <div className="w-full space-y-6">
        {currentUser && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-100/80 p-1.5 rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('MATCHES');
                  setFilters((prev) => ({ ...prev, matching_only: true }));
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  filterMode === 'MATCHES'
                    ? 'bg-black text-white shadow-md'
                    : 'text-neutral-600 hover:text-black hover:bg-white/60'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Ride Matches for My Trips</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('ALL');
                  setFilters((prev) => {
                    const { matching_only: _matching_only, ...rest } = prev;
                    return rest;
                  });
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  filterMode === 'ALL'
                    ? 'bg-black text-white shadow-md'
                    : 'text-neutral-600 hover:text-black hover:bg-white/60'
                }`}
              >
                <span>Explore All Campus Rides</span>
              </button>
            </div>
            <div className="text-xs font-medium text-neutral-500 px-3 hidden md:block">
              {filterMode === 'MATCHES'
                ? 'Showing rides from other students that match your active travel plans.'
                : 'Showing all open travel requests across campus (excluding your own).'}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <span>{filterMode === 'MATCHES' ? '✨ Compatible Rides Found' : 'Available Rides'}</span>
          {!isLoading && !error && (
            <span className="bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full border border-neutral-200">
              {requests.length} Found
            </span>
          )}
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && error && (
          <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Unable to Load Requests</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && requests.length === 0 && (
          <EmptyState
            title={filterMode === 'MATCHES' ? 'No matching rides found.' : 'No requests found.'}
            description={
              filterMode === 'MATCHES'
                ? "We couldn't find any open rides from other students that match your active travel requests right now."
                : "No open travel requests match your current filters."
            }
            action={
              filterMode === 'MATCHES' ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFilterMode('ALL');
                      setFilters((prev) => {
                        const { matching_only: _matching_only, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className="font-semibold text-xs border-neutral-300 hover:bg-neutral-100"
                  >
                    Browse All Campus Rides
                  </Button>
                  <Link to="/travel-requests/new">
                    <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold text-xs gap-1.5">
                      <span>Create Request</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-semibold border-neutral-300 hover:bg-neutral-100">
                  Reset Filters
                </Button>
              ) : (
                <Link to="/travel-requests/new">
                  <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5">
                    <span>Create Request</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )
            }
          />
        )}

        {!isLoading && !error && requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <TravelRequestCard
                key={req.id}
                request={req}
                currentUser={currentUser}
                onSelectPartner={setSelectedPartner}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPartner && (
        <RideConnectModal
          isOpen={Boolean(selectedPartner)}
          onClose={() => setSelectedPartner(null)}
          partner={selectedPartner.user}
          destinationName={selectedPartner.destName}
          travelDate={selectedPartner.dateStr}
          requestId={selectedPartner.reqId}
        />
      )}
    </div>
  );
};

export default TravelRequestsPage;
