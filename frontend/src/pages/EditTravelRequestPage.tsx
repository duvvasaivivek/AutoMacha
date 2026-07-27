import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Edit2,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDestinations } from '@/services/destination.service';
import { getTravelRequestById, updateTravelRequest } from '@/services/travelRequest.service';
import type { Destination, Direction } from '@/types';

const editRequestSchema = z
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

type EditRequestFormData = z.infer<typeof editRequestSchema>;

export const EditTravelRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // FROM and TO selection state ('CAMPUS' or destination ID string)
  const [fromLocation, setFromLocation] = useState<string>('CAMPUS');
  const [toLocation, setToLocation] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditRequestFormData>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      date: '',
      time: '',
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      setLoading(true);
      setInitError(null);
      try {
        const [destData, reqData] = await Promise.all([
          getDestinations(),
          getTravelRequestById(id),
        ]);
        setDestinations(destData);

        if (reqData.status !== 'OPEN') {
          setInitError('This travel request is no longer open and cannot be edited.');
          return;
        }

        const destIdStr = String(reqData.destination);
        if (reqData.direction === 'FROM_CAMPUS') {
          setFromLocation('CAMPUS');
          setToLocation(destIdStr);
        } else {
          setFromLocation(destIdStr);
          setToLocation('CAMPUS');
        }

        const dt = new Date(reqData.travel_datetime);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const hours = String(dt.getHours()).padStart(2, '0');
        const mins = String(dt.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${mins}`;

        setValue('date', dateStr);
        setValue('time', timeStr);
      } catch (err: any) {
        setInitError(err.response?.data?.detail || 'Failed to load travel request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, setValue]);

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
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const onSubmit = async (data: EditRequestFormData) => {
    if (!id) return;
    if (fromLocation === '' || toLocation === '') {
      setApiError('Please select both Pickup and Dropoff locations.');
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
      await updateTravelRequest(id, {
        destination: destId,
        direction: dir,
        travel_datetime,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/my-travel-requests');
      }, 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to update request. Please try again.';
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        const firstKey = Object.keys(errorData)[0];
        if (firstKey && Array.isArray(errorData[firstKey])) {
          errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <Card className="max-w-md w-full border-red-200 bg-red-50 text-center p-8 space-y-6 rounded-2xl shadow-xl">
          <div className="h-16 w-16 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-950">Cannot Edit Request</h2>
            <p className="text-sm text-red-800">{initError}</p>
          </div>
          <Link to="/my-travel-requests">
            <Button className="bg-black text-white hover:bg-neutral-800 font-semibold w-full">
              Back to My Requests
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <Card className="max-w-md w-full border-green-200 bg-green-50/80 shadow-2xl text-center p-8 space-y-6 animate-in zoom-in-95 duration-300 rounded-2xl">
          <div className="h-16 w-16 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-green-600/30">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-green-950">Request Updated!</h2>
            <p className="text-sm text-green-800 font-medium">Redirecting to your requests...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-xl mx-auto w-full">
      <div className="w-full space-y-6">
        <Link
          to="/my-travel-requests"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Requests</span>
        </Link>

        <div className="flex items-center gap-3.5 border-b border-neutral-200 pb-5">
          <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shrink-0">
            <Edit2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              Edit Request
            </h1>
          </div>
        </div>

        <Card className="border-neutral-200 shadow-xl bg-white overflow-hidden rounded-2xl">
          <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-6 py-5">
            <CardTitle className="text-base font-bold text-black">
              Update Route & Schedule
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {apiError && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Error</p>
                    <p className="text-red-700 mt-0.5">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Location Selector */}
              <div className="space-y-4 bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center">
                  <div className="space-y-1.5">
                    <Label htmlFor="from-location" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      From (Pickup)
                    </Label>
                    <select
                      id="from-location"
                      value={fromLocation}
                      onChange={(e) => handleFromChange(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="CAMPUS" className="font-bold text-black">
                        🏫 Campus
                      </option>
                      {destinations.map((dest) => (
                        <option key={`from-${dest.id}`} value={dest.id.toString()}>
                          📍 {dest.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center sm:pt-6">
                    <button
                      type="button"
                      onClick={handleSwapLocations}
                      className="h-10 w-10 rounded-xl bg-white border border-neutral-200 hover:border-black hover:bg-neutral-50 text-black flex items-center justify-center shadow-xs transition-all active:scale-95"
                      title="Swap From and To"
                    >
                      <ArrowUpDown className="h-4 w-4 sm:rotate-90 text-neutral-600" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="to-location" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      To (Dropoff)
                    </Label>
                    <select
                      id="to-location"
                      value={toLocation}
                      onChange={(e) => handleToChange(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="CAMPUS" className="font-bold text-black">
                        🏫 Campus
                      </option>
                      {destinations.map((dest) => (
                        <option key={`to-${dest.id}`} value={dest.id.toString()}>
                          📍 {dest.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-bold text-black uppercase tracking-wider">
                    Travel Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      {...register('date')}
                      className={`h-11 rounded-xl font-semibold pl-10 bg-white ${
                        errors.date ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                      }`}
                    />
                    <Calendar className="h-4 w-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                  {errors.date && (
                    <p className="text-xs font-semibold text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs font-bold text-black uppercase tracking-wider">
                    Travel Time
                  </Label>
                  <div className="relative">
                    <Input
                      id="time"
                      type="time"
                      {...register('time')}
                      className={`h-11 rounded-xl font-semibold pl-10 bg-white ${
                        errors.time ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-300'
                      }`}
                    />
                    <Clock className="h-4 w-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                  {errors.time && (
                    <p className="text-xs font-semibold text-red-600">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <Link to="/my-travel-requests">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-6 font-bold text-sm border-neutral-300 hover:bg-neutral-100"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="h-11 px-8 font-bold text-sm bg-black text-white hover:bg-neutral-800 shadow-md gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <Send className="h-4 w-4" />
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

export default EditTravelRequestPage;
