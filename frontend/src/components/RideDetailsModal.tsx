import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Home,
  Star,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RideHistory } from '@/types';
import { formatDate, formatTime, formatDateTime } from '@/utils/date';

interface RideDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: RideHistory | null;
}

export const RideDetailsModal: React.FC<RideDetailsModalProps> = ({
  isOpen,
  onClose,
  ride,
}) => {
  if (!isOpen || !ride) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Expired</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            title="Close details modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-neutral-300 px-2.5 py-0.5 rounded-full border border-white/10">
                Ride Record #{ride.id}
              </span>
              {getStatusBadge(ride.ride_status)}
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5 truncate">
              <MapPin className="h-6 w-6 text-emerald-400 shrink-0" />
              <span className="truncate">{ride.destination}</span>
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Travel Timings & Pickup */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">
              Ride Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
                <Calendar className="h-4 w-4 text-neutral-600 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase">Departure Date</div>
                  <div className="font-bold text-neutral-900">{formatDate(ride.departure_time)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
                <Clock className="h-4 w-4 text-neutral-600 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase">Scheduled Time</div>
                  <div className="font-bold text-neutral-900">{formatTime(ride.departure_time)}</div>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 flex items-center gap-2.5 bg-white p-3 rounded-xl border border-neutral-200">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase">Pickup Location</div>
                  <div className="font-bold text-neutral-900">{ride.pickup_location || 'Campus'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ride Partner Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">
              Ride Partner
            </h4>
            {ride.ride_partner ? (
              <div className="bg-neutral-900 text-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black font-black text-lg flex items-center justify-center uppercase shadow-md shrink-0">
                  {ride.ride_partner.username.slice(0, 2)}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h3 className="font-black text-white text-base truncate">
                    @{ride.ride_partner.username}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 font-medium">
                    {ride.ride_partner.branch && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{ride.ride_partner.branch}</span>
                      </span>
                    )}
                    {ride.ride_partner.hostel && (
                      <span className="flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{ride.ride_partner.hostel}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 border border-neutral-200 p-4 rounded-2xl text-center text-xs font-semibold text-neutral-500">
                Solo Travel / No Ride Partner Linked
              </div>
            )}
          </div>

          {/* Section 3: Technical Reference IDs & Completion Timestamp */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">
              Record Metadata
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
              <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Travel Request ID</span>
                <span className="text-neutral-900 font-extrabold">
                  {ride.travel_request_id || ride.travel_request || 'N/A'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Ride Request ID</span>
                <span className="text-neutral-900 font-extrabold">
                  {ride.ride_request_id || 'N/A'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Status Updated</span>
                <span className="text-neutral-900 font-extrabold truncate block">
                  {ride.completed_at ? formatDateTime(ride.completed_at) : formatDateTime(ride.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Rating & Review Placeholder */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-700">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span>Rate & Review Ride</span>
              </div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Coming Soon
              </span>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-purple-500/10 border border-amber-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-1 justify-center text-amber-400 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-6 w-6 fill-amber-300 stroke-amber-500 cursor_not_allowed opacity-80" />
                ))}
              </div>
              <p className="text-[11px] text-neutral-600 text-center font-medium leading-relaxed">
                Rating & review feature will be unlocked in the next release to let you rate your companion experience and earn Macha badges!
              </p>
              <Button
                disabled
                className="w-full bg-neutral-200 text-neutral-500 font-bold text-xs py-4 rounded-xl shadow-none cursor-not-allowed"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                <span>Rate Ride (Feature Locked)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-bold text-xs px-5 border-neutral-300 hover:bg-neutral-200/60 text-black"
          >
            Close Dialog
          </Button>
        </div>
      </div>
    </div>
  );
};
