import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MapPin, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { getDestinations } from '@/services/destination.service';
import type { Destination } from '@/types';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinationsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDestinations();
        setDestinations(data);
      } catch (err) {
        setError('Failed to load travel destinations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinationsData();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Header Section: Customized for Authenticated vs Public Users */}
      {isAuthenticated ? (
        <div className="w-full mb-12 bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-neutral-800">
          <div className="space-y-3 text-center sm:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-neutral-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              <span>IIITDM Kurnool • Student Outing Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Where are you heading today?
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Create and track your official campus outing requests, transit passes, and cab sharing in just a few clicks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <Link to="/travel-requests/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2.5 bg-white text-black hover:bg-neutral-100 font-bold px-7 h-12 shadow-lg hover:scale-[1.02] transition-all">
                <span>+ New Outing Request</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl w-full text-center space-y-6 py-10 sm:py-16 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart Campus Transit Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight">
            Welcome to <span className="underline decoration-neutral-300 underline-offset-8">AutoMacha</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl mx-auto font-normal">
            The automated outing and transit platform designed exclusively for IIITDM Kurnool students and administration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-bold bg-black text-white hover:bg-neutral-800 shadow-xl shadow-black/10 px-8 h-12">
                <span>Login to Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 hover:text-black px-8 h-12">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Approved Destinations Section */}
      <div className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Authorized Locations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Approved Outing Destinations
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              Select an authorized Kurnool transit or dining hub below to initiate an instant travel request.
            </p>
          </div>
          {!isLoading && !error && destinations.length > 0 && (
            <span className="text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-3.5 py-1.5 rounded-full w-fit shrink-0">
              {destinations.length} Active Hubs
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <p className="text-sm font-medium text-neutral-500">Loading Kurnool destinations...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto my-8 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Unable to Load Destinations</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && destinations.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-3">
            <MapPin className="h-8 w-8 text-neutral-400 mx-auto" />
            <h3 className="font-bold text-black text-base">No Destinations Available</h3>
            <p className="text-xs text-neutral-600">
              There are currently no active travel destinations listed. Please check back soon!
            </p>
          </div>
        )}

        {/* Destination Cards Grid */}
        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="group relative bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-sm shadow-sm">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Active Hub
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-black tracking-tight group-hover:text-black pt-1">
                    {dest.name}
                  </h3>
                  <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed font-normal">
                    {dest.description || 'Authorized outing destination for IIITDM Kurnool students.'}
                  </p>
                </div>

                {isAuthenticated && (
                  <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-end">
                    <Link
                      to="/travel-requests/new"
                      state={{ selectedDestinationId: dest.id.toString() }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-black group-hover:translate-x-1 transition-transform"
                    >
                      <span>Select Destination</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
