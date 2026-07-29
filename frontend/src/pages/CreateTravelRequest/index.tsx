import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Car,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

const QUICK_TIME_SLOTS = [
  { label: '06:00 AM', value: '06:00' },
  { label: '08:00 AM', value: '08:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '02:00 PM', value: '14:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '06:00 PM', value: '18:00' },
  { label: '08:00 PM', value: '20:00' },
  { label: '10:00 PM', value: '22:00' },
];

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

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const inTwoDaysObj = new Date();
  inTwoDaysObj.setDate(inTwoDaysObj.getDate() + 2);
  const inTwoDaysStr = inTwoDaysObj.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TravelRequestFormData>({
    resolver: zodResolver(travelRequestSchema),
    defaultValues: {
      date: todayStr,
      time: '09:00',
    },
  });

  const selectedDate = watch('date');
  const selectedTime = watch('time');

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
      } catch {
        setDestinationsError('Failed to load destinations.');
      } finally {
        setDestinationsLoading(false);
      }
    };

    fetchDestinationsList();
  }, [preSelectedDestinationId]);

  const handleFromChange = (val: string) => {
    setFromLocation(val);
    if (val !== 'CAMPUS' && val !== '') {
      setToLocation('CAMPUS');
    } else if (val === 'CAMPUS' && toLocation === 'CAMPUS') {
      setToLocation('');
    }
  };

  const handleToChange = (val: string) => {
    setToLocation(val);
    if (val !== 'CAMPUS' && val !== '') {
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

  const onSubmit = async (data: TravelRequestFormData) => {
    if (!fromLocation || !toLocation) {
      setApiError('Please select both Pickup and Dropoff locations.');
      return;
    }
    if (fromLocation === 'CAMPUS' && toLocation === 'CAMPUS') {
      setApiError('Pickup and dropoff locations cannot both be Campus.');
      return;
    }
    if (fromLocation !== 'CAMPUS' && toLocation !== 'CAMPUS') {
      setApiError('Either Pickup or Dropoff must be Campus.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      let destId: number;
      let dir: Direction;

      if (fromLocation === 'CAMPUS') {
        destId = parseInt(toLocation, 10);
        dir = 'FROM_CAMPUS';
      } else {
        destId = parseInt(fromLocation, 10);
        dir = 'TO_CAMPUS';
      }

      const travel_datetime = new Date(`${data.date}T${data.time}`).toISOString();
      await createTravelRequest({
        destination: destId,
        direction: dir,
        travel_datetime,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/my-travel-requests');
      }, 1500);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const errorMessage =
        (errData?.detail as string) ||
        (Array.isArray(errData?.non_field_errors) ? (errData.non_field_errors[0] as string) : null) ||
        (Array.isArray(errData?.destination) ? (errData.destination[0] as string) : null) ||
        (Array.isArray(errData?.travel_datetime) ? (errData.travel_datetime[0] as string) : null) ||
        'Failed to submit request. Please try again.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <Card className="max-w-md w-full border-emerald-200 bg-emerald-50/80 shadow-2xl text-center p-8 space-y-6 animate-in zoom-in-95 duration-300 rounded-3xl">
          <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-emerald-950">Request Submitted Successfully!</h2>
            <p className="text-sm font-semibold text-emerald-800">Redirecting to your requests...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-2xl mx-auto w-full">
      <div className="w-full space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3.5 border-b border-neutral-200 pb-5">
          <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              Create Travel Request
            </h1>
            <p className="text-xs font-semibold text-neutral-600 mt-0.5">
              Specify your travel route, date, and preferred departure time.
            </p>
          </div>
        </div>

        <Card className="border-neutral-200 shadow-xl bg-white overflow-hidden rounded-3xl">
          <CardHeader className="bg-neutral-50/70 border-b border-neutral-100 px-6 py-5">
            <CardTitle className="text-lg font-black text-neutral-900">
              Route & Schedule Selection
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-neutral-500">
              Easy one-click options for route and schedule selection.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {(apiError || destinationsError) && (
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Notice</p>
                    <p className="text-red-700 mt-0.5">{apiError || destinationsError}</p>
                  </div>
                </div>
              )}

              {/* Location Selectors */}
              <div className="space-y-4 bg-neutral-50/80 p-5 rounded-2xl border border-neutral-200/80">
                <div className="space-y-1.5">
                  <Label htmlFor="fromLocation" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    <span>Pickup Location (From)</span>
                  </Label>
                  
                  {destinationsLoading ? (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select
                      id="fromLocation"
                      value={fromLocation}
                      onChange={(e) => handleFromChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-bold text-neutral-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select Pickup Location</option>
                      <option value="CAMPUS">IIITDM Kurnool Campus</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id.toString()}>
                          {dest.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Swap Button */}
                <div className="flex justify-center py-1">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    disabled={isSubmitting || destinationsLoading}
                    title="Swap Pickup and Dropoff"
                    className="h-10 w-10 rounded-full bg-black text-white hover:bg-neutral-800 hover:scale-105 shadow-md flex items-center justify-center border-2 border-white transition-all focus:outline-none"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="toLocation" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-200" />
                    <span>Dropoff Location (To)</span>
                  </Label>
                  
                  {destinationsLoading ? (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select
                      id="toLocation"
                      value={toLocation}
                      onChange={(e) => handleToChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-bold text-neutral-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select Dropoff Location</option>
                      <option value="CAMPUS">IIITDM Kurnool Campus</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id.toString()}>
                          {dest.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="date" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-neutral-600" />
                    <span>Travel Date</span>
                  </Label>
                  <span className="text-[11px] font-semibold text-neutral-400">Quick selection available</span>
                </div>

                {/* Date Quick Choice Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('date', todayStr, { shouldValidate: true })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === todayStr
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('date', tomorrowStr, { shouldValidate: true })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === tomorrowStr
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('date', inTwoDaysStr, { shouldValidate: true })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === inTwoDaysStr
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    In 2 Days
                  </button>
                </div>

                {/* Custom Date Input */}
                <Input
                  id="date"
                  type="date"
                  min={todayStr}
                  {...register('date')}
                  disabled={isSubmitting}
                  className={`h-11 rounded-xl shadow-sm text-sm font-semibold bg-white ${
                    errors.date ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                  }`}
                />
                {errors.date && <p className="text-xs text-red-600 font-bold mt-1">{errors.date.message}</p>}
              </div>

              {/* Time Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time" className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-neutral-600" />
                    <span>Travel Time</span>
                  </Label>
                  <span className="text-[11px] font-semibold text-neutral-400">Popular departure slots</span>
                </div>

                {/* Quick Time Slots Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  {QUICK_TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setValue('time', slot.value, { shouldValidate: true })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-black text-white shadow-sm'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Time Selection Dropdown & Native Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-500">Standard Slot Dropdown</span>
                    <select
                      value={selectedTime || ''}
                      onChange={(e) => setValue('time', e.target.value, { shouldValidate: true })}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">-- Select Time Slot --</option>
                      {QUICK_TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label} ({slot.value})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-500">Exact Custom Time</span>
                    <Input
                      id="time"
                      type="time"
                      {...register('time')}
                      disabled={isSubmitting}
                      className={`h-11 rounded-xl shadow-sm text-sm font-semibold bg-white ${
                        errors.time ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                      }`}
                    />
                  </div>
                </div>
                {errors.time && <p className="text-xs text-red-600 font-bold mt-1">{errors.time.message}</p>}
              </div>

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
                      <span>Submit Travel Request</span>
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

export default CreateTravelRequest;
