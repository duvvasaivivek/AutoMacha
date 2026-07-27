import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Navigation,
  PlusCircle,
  Loader2,
  AlertCircle,
  Edit2,
  XCircle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMyTravelRequests, cancelTravelRequest } from '@/services/travelRequest.service';
import type { MyTravelRequest } from '@/types';
import { formatDate, formatTime } from '@/utils/date';

export const MyTravelRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<MyTravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyTravelRequests();
      setRequests(data);
    } catch {
      setError('Failed to load your travel requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this travel request?')) {
      return;
    }
    setCancellingId(id);
    try {
      await cancelTravelRequest(id);
      await fetchMyRequests();
    } catch {
      alert('Failed to cancel travel request. It may no longer be open.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            My Travel Requests
          </h1>
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

      {isLoading && (
        <div className="w-full flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
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
            <h3 className="font-bold text-black text-lg">No Requests Yet</h3>
            <p className="text-xs text-neutral-500">You haven't created any travel requests.</p>
          </div>
          <Link to="/travel-requests/new">
            <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5">
              <span>Create Request</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {requests.map((req) => {
            const isLeaving = req.direction === 'FROM_CAMPUS';
            const isOpen = req.status === 'OPEN';
            const isExpired = req.status === 'EXPIRED';
            const isCancelled = req.status === 'CANCELLED';
            const isClosed = req.status === 'CLOSED';

            let cardStyle = "group relative overflow-hidden border-neutral-200/80 bg-white hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between rounded-2xl";
            if (isExpired) {
              cardStyle = "group relative overflow-hidden border-neutral-200 bg-neutral-100/70 opacity-75 hover:opacity-100 transition-all duration-300 flex flex-col justify-between rounded-2xl grayscale-[15%]";
            } else if (isCancelled || isClosed) {
              cardStyle = "group relative overflow-hidden border-neutral-200 bg-neutral-50 opacity-70 hover:opacity-90 transition-all duration-300 flex flex-col justify-between rounded-2xl";
            }

            return (
              <Card key={req.id} className={cardStyle}>
                <div>
                  <CardHeader className="bg-neutral-50/60 border-b border-neutral-100 px-5 py-4 flex flex-row items-center justify-between gap-2 space-y-0">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                      <Navigation className={`h-3.5 w-3.5 text-black ${isLeaving ? 'rotate-45' : '-rotate-135'}`} />
                      <span>{isLeaving ? 'From Campus' : 'To Campus'}</span>
                    </div>

                    {isOpen && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Open</span>
                      </span>
                    )}

                    {isExpired && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-700 border border-neutral-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                        <span>Expired</span>
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        <span>Cancelled</span>
                      </span>
                    )}

                    {isClosed && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        <span>Closed</span>
                      </span>
                    )}
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-black tracking-tight mt-0.5 flex items-center gap-2">
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
                  </CardContent>
                </div>

                <CardFooter className="bg-neutral-50/80 border-t border-neutral-100 px-5 py-3.5 flex flex-col gap-2">
                  {isOpen ? (
                    <>
                      <Link to={`/travel-requests/${req.id}/matches`} className="w-full">
                        <Button size="sm" className="w-full bg-black text-white hover:bg-neutral-800 font-bold text-xs shadow-sm gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>View Matches</span>
                        </Button>
                      </Link>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Link to={`/travel-requests/${req.id}/edit`} className="w-full">
                          <Button size="sm" variant="outline" className="w-full font-bold text-xs gap-1 border-neutral-300 hover:bg-neutral-100">
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(req.id)}
                          disabled={cancellingId === req.id}
                          className="w-full font-bold text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {cancellingId === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="w-full font-semibold text-xs text-neutral-400 bg-neutral-100 border-neutral-200 cursor-not-allowed"
                    >
                      <span>{isExpired ? 'Expired — No Actions Available' : 'Inactive Request'}</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTravelRequestsPage;
