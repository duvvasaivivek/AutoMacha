import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Destination, Direction } from '@/types';

interface FilterBarProps {
  destinations: Destination[];
  destInput: string;
  setDestInput: (val: string) => void;
  dirInput: Direction | '';
  setDirInput: (val: Direction | '') => void;
  statusInput: string;
  setStatusInput: (val: string) => void;
  dateInput: string;
  setDateInput: (val: string) => void;
  fromTimeInput: string;
  setFromTimeInput: (val: string) => void;
  toTimeInput: string;
  setToTimeInput: (val: string) => void;
  onApplyFilters: (e?: React.FormEvent) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  destinations,
  destInput,
  setDestInput,
  dirInput,
  setDirInput,
  statusInput,
  setStatusInput,
  dateInput,
  setDateInput,
  fromTimeInput,
  setFromTimeInput,
  toTimeInput,
  setToTimeInput,
  onApplyFilters,
  onResetFilters,
}) => {
  const hasActiveFilters = Boolean(
    destInput ||
      dirInput ||
      statusInput !== 'OPEN' ||
      dateInput ||
      fromTimeInput ||
      toTimeInput
  );

  return (
    <form onSubmit={onApplyFilters} className="w-full bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm mb-8 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-black">
          <Filter className="h-4 w-4 text-neutral-600" />
          <span>Filter Requests</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
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
          onClick={onResetFilters}
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
  );
};

export default FilterBar;
