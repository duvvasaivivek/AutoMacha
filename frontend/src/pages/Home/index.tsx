import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, AlertCircle, Loader2, Car, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { getDestinations } from '@/services/destination.service';
import type { Destination } from '@/types';

import { OrbitHero } from '@/components/home/OrbitHero';
import { OrbitMetrics } from '@/components/home/OrbitMetrics';
import { OrbitFeatures } from '@/components/home/OrbitFeatures';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

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
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-6 sm:py-10 max-w-7xl mx-auto w-full">
      
      {/* 1. Orbit Network Hero Section */}
      <OrbitHero />

      {/* 2. Key Metrics Bar */}
      <OrbitMetrics />

      {/* 3. Workflow Steps */}
      <OrbitFeatures />

      {/* 4. Destinations Explorer Section */}
      <div className="w-full mb-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
              Popular Campus Destinations
            </h2>
            <p className="text-xs font-semibold text-neutral-500 mt-1">
              Frequently traveled hubs and locations around IIITDM Kurnool.
            </p>
          </div>

          <Link to={isAuthenticated ? '/travel-requests/new' : '/login'}>
            <Button variant="outline" size="sm" className="font-bold border-neutral-300 gap-2">
              <span>Explore All Rides</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <p className="text-xs font-semibold text-neutral-500">Loading destinations...</p>
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
                className="group bg-white rounded-3xl border border-neutral-200/80 p-7 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                      {dest.name}
                    </h3>
                    <p className="text-xs font-medium text-neutral-500 mt-1">
                      Direct auto route from IIITDM Kurnool Campus.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Regular Route
                  </span>
                  <Link
                    to={isAuthenticated ? '/travel-requests/new' : '/login'}
                    state={{ selectedDestinationId: dest.id.toString() }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-black group-hover:translate-x-1 transition-transform"
                  >
                    <span>Request Trip</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Bottom Action CTA Banner */}
      <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-black text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Car className="w-4 h-4" />
            <span>Ready for your next campus outing?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Start Matching Rides with Batchmates Today
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-400">
            Sign up with your IIITDM Kurnool email to request rides, split auto fares, and view auto driver listings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          {isAuthenticated ? (
            <Link to="/travel-requests/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-white text-black hover:bg-neutral-100 font-bold px-8 h-12 rounded-full shadow-lg">
                <span>Create Travel Request</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-white text-black hover:bg-neutral-100 font-bold px-8 h-12 rounded-full shadow-lg">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800 px-8 h-12 rounded-full">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Home;
