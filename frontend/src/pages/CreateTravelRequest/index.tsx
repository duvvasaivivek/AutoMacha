import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Car,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDestinations } from '@/services/destination.service';
import { createTravelRequest } from '@/services/travelRequest.service';
import type { Destination, Direction } from '@/types';

const travelRequestSchema = z
  .object({
    date: z.string().min(1, 'Please select a travel date'),
    time: z.string().min(1, 'Please select a travel time'),
  })
  .superRefine((data, ctx) => {
    if (data.date && data.time) {
      const selectedDateTime = new Date(`${data.date}T${data.time}`);
      const now = new Date();
      if (isNaN(selectedDateTime.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid date or time format',
          path: ['date'],
        });
      } else if (selectedDateTime < now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Travel date and time cannot be in the past',
          path: ['time'],
        });
      }
    }
  });

type TravelRequestFormData = z.infer<typeof travelRequestSchema>;

export const CreateTravelRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedDestinationId = location.state?.selectedDestinationId || '';

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState<boolean>(true);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);

  // FROM and TO selection state ('CAMPUS' or destination ID string)
  const [fromLocation, setFromLocation] = useState<string>('CAMPUS');
  const [toLocation, setToLocation] = useState<string>(preSelectedDestinationId || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelRequestFormData>({
    resolver: zodResolver(travelRequestSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: '',
    },
  });

  useEffect(() => {
    const fetchDestinationsList = async () => {
      setDestinationsLoading(true);
      setDestinationsError(null);
      try {
        const data = await getDestinations();
        setDestinations(data);
        if (preSelectedDestinationId) {
          setToLocation(preSelectedDestinationId);
          setFromLocation('CAMPUS');
        }
      } catch (err) {
        setDestinationsError('Failed to load approved destinations from server.');
      } finally {
        setDestinationsLoading(false);
      }
    };

    fetchDestinationsList();
  }, [preSelectedDestinationId]);

  const handleFromChange = (val: string) => {
    setFromLocation(val);
    if (val !== 'CAMPUS' && val !== '') {
      // If From is an outing location, To automatically becomes Campus
      setToLocation('CAMPUS');
    } else if (val === 'CAMPUS' && toLocation === 'CAMPUS') {
      setToLocation('');
    }
  };

  const handleToChange = (val: string) => {
    setToLocation(val);
    if (val !== 'CAMPUS' && val !== '') {
      // If To is an outing location, From automatically becomes Campus
      setFromLocation('CAMPUS');
    } else if (val === 'CAMPUS' && fromLocation === 'CAMPUS') {
      setFromLocation('');
    }
  };

  const handleSwapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation || 'CAMPUS');
    setToLocation(temp || 'CAMPUS');
  };

  // Find destination object if selected in either box to show description
  const activeDestId = fromLocation !== 'CAMPUS' ? fromLocation : toLocation !== 'CAMPUS' ? toLocation : null;
  const selectedDestObj = destinations.find((d) => d.id.toString() === activeDestId);

  const onSubmit = async (data: TravelRequestFormData) => {
    if (!fromLocation || !toLocation) {
      setApiError('Please select both From (Pickup) and To (Dropoff) locations.');
      return;
    }
    if (fromLocation === 'CAMPUS' && toLocation === 'CAMPUS') {
      setApiError('Pickup and dropoff locations cannot both be IIITDM Kurnool Campus.');
      return;
    }
    if (fromLocation !== 'CAMPUS' && toLocation !== 'CAMPUS') {
      setApiError('Either Pickup or Dropoff must be IIITDM Kurnool Campus.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      let destId: number;
      let dir: Direction;

      if (fromLocation === 'CAMPUS') {
        destId = parseInt(toLocation, 10);
        dir = 'FROM_CAMPUS'; // Leaving campus going to destination
      } else {
        destId = parseInt(fromLocation, 10);
        dir = 'TO_CAMPUS'; // Returning from destination to campus
      }

      const travel_datetime = new Date(`${data.date}T${data.time}`).toISOString();
      await createTravelRequest({
        destination: destId,
        direction: dir,
        travel_datetime,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.destination?.[0] ||
        err?.response?.data?.travel_datetime?.[0] ||
        'Failed to submit travel request. Please verify your details and try again.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <Card className="max-w-md w-full border-green-200 bg-green-50/80 shadow-2xl text-center p-8 space-y-6 animate-in zoom-in-95 duration-300 rounded-2xl">
          <div className="h-16 w-16 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-green-600/30">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-green-950">Request Submitted!</h2>
            <p className="text-sm text-green-800 leading-relaxed font-medium">
              Your outing request has been recorded and linked to your IIITDM Kurnool student account.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-green-200 text-xs font-semibold text-green-900">
            Redirecting to Outing Hub in just a moment...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-xl mx-auto w-full">
      <div className="w-full space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Outing Hub</span>
        </Link>

        {/* Minimalist Page Header */}
        <div className="flex items-center gap-3.5 border-b border-neutral-200 pb-5">
          <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              New Outing Request
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600">
              Select your pickup and dropoff locations for IIITDM Kurnool transit.
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-neutral-200 shadow-xl bg-white overflow-hidden rounded-2xl">
          <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-6 py-5">
            <CardTitle className="text-base font-bold text-black flex items-center justify-between">
              <span>Route & Schedule</span>
              <span className="text-[11px] font-semibold text-neutral-500 font-mono bg-white px-2.5 py-1 rounded-md border border-neutral-200">
                TRANSIT HUB
              </span>
            </CardTitle>
            <CardDescription className="text-neutral-600 text-xs">
              Select where you are starting from and heading to in Kurnool.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* API Error Message */}
              {apiError && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Submission Error</p>
                    <p className="text-red-700 mt-0.5">{apiError}</p>
                  </div>
                </div>
              )}

              {/* FROM and TO Selection Boxes */}
              <div className="space-y-2 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200/80">
                {/* FROM BOX */}
                <div className="space-y-1.5">
                  <Label htmlFor="fromLocation" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    <span>From (Pickup Location)</span>
                  </Label>
                  
                  {destinationsLoading ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select
                      id="fromLocation"
                      value={fromLocation}
                      onChange={(e) => handleFromChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">-- Select Pickup --</option>
                      <option value="CAMPUS">🏫 IIITDM Kurnool (Main Campus)</option>
                      <option disabled>────────── Outing Destinations ──────────</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id.toString()}>
                          📍 {dest.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SWAP BUTTON */}
                <div className="flex justify-center py-1 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    disabled={isSubmitting || destinationsLoading}
                    title="Swap pickup and dropoff locations"
                    className="h-10 w-10 rounded-full bg-black text-white hover:bg-neutral-800 hover:scale-110 shadow-md flex items-center justify-center border-2 border-white transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>

                {/* TO BOX */}
                <div className="space-y-1.5">
                  <Label htmlFor="toLocation" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500 ring-2 ring-red-200" />
                    <span>To (Dropoff Location)</span>
                  </Label>
                  
                  {destinationsLoading ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select
                      id="toLocation"
                      value={toLocation}
                      onChange={(e) => handleToChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">-- Select Dropoff --</option>
                      <option value="CAMPUS">🏫 IIITDM Kurnool (Main Campus)</option>
                      <option disabled>────────── Outing Destinations ──────────</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id.toString()}>
                          📍 {dest.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Destination Info Card */}
                {selectedDestObj && selectedDestObj.description && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5 shadow-sm animate-in fade-in-50 duration-200">
                    <Building2 className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-black">{selectedDestObj.name}: </span>
                      <span>{selectedDestObj.description}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Date and Time Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Date</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('date')}
                    disabled={isSubmitting}
                    className={`h-11 rounded-xl shadow-sm text-sm ${
                      errors.date ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {errors.date && <p className="text-xs text-red-600 font-medium">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Time</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    {...register('time')}
                    disabled={isSubmitting}
                    className={`h-11 rounded-xl shadow-sm text-sm ${
                      errors.time ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {errors.time && <p className="text-xs text-red-600 font-medium">{errors.time.message}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-neutral-100">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || destinationsLoading}
                  className="w-full gap-2 h-12 rounded-xl text-base font-bold bg-black text-white hover:bg-neutral-800 shadow-xl shadow-black/10 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Outing Request</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
