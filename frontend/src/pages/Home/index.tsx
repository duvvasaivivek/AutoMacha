import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, AlertCircle, Loader2 } from 'lucide-react';
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
      } catch {
        setError('Failed to load travel destinations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinationsData();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Header Section */}
      {isAuthenticated ? (
        <div className="w-full mb-12 bg-neutral-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Where are you heading?
            </h1>
          </div>
          <div className="flex shrink-0">
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
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black">
            AutoMacha
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-bold bg-black text-white hover:bg-neutral-800 shadow-xl shadow-black/10 px-8 h-12">
                <span>Login</span>
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

      {/* Destinations Section */}
      <div className="w-full space-y-8">
        <div className="flex items-end justify-between border-b border-neutral-200 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Destinations
          </h2>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        )}

        {!isLoading && error && (
          <div className="max-w-md mx-auto my-8 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-base">Unable to Load Destinations</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && destinations.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-3">
            <MapPin className="h-8 w-8 text-neutral-400 mx-auto" />
            <h3 className="font-bold text-black text-base">No Destinations Available</h3>
          </div>
        )}

        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="group relative bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-black tracking-tight pt-1">
                    {dest.name}
                  </h3>
                </div>

                {isAuthenticated && (
                  <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-end">
                    <Link
                      to="/travel-requests/new"
                      state={{ selectedDestinationId: dest.id.toString() }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-black group-hover:translate-x-1 transition-transform"
                    >
                      <span>Select</span>
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
