import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  History,
  Layers,
  Heart,
  PlusCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Compass,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/services/dashboard.service';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/hooks';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Dashboard
            </h1>
            <p className="text-sm font-semibold text-neutral-600 mt-1">
              Welcome back{user ? `, ${user.username}` : ''}! Here is a quick overview of your travel activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="gap-2 font-semibold border-neutral-300 hover:bg-neutral-100"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link to="/travel-requests/new" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto gap-2 bg-black text-white hover:bg-neutral-800 font-bold px-5 shadow-md">
              <PlusCircle className="h-4 w-4" />
              <span>Create Request</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="w-full flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-xs font-semibold text-neutral-500">Loading your statistics...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 text-base">Unable to Load Dashboard</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Button onClick={fetchStats} size="sm" variant="outline" className="font-semibold border-red-300 hover:bg-red-100 text-red-900">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && stats && (
        <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-neutral-200/80 bg-white shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-neutral-50/50 border-b border-neutral-100 px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase text-neutral-600 tracking-wider">
                  Total Requests
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-neutral-200/70 text-black">
                  <Layers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-black">{stats.total_requests}</div>
                <p className="text-[11px] font-semibold text-neutral-500 mt-1">All time created</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 border-b border-emerald-100 px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
                  Active Requests
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-emerald-950">{stats.active_requests}</div>
                <p className="text-[11px] font-semibold text-emerald-700 mt-1">Currently open trips</p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200/80 bg-white shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-neutral-100/50 border-b border-neutral-100 px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase text-neutral-600 tracking-wider">
                  Expired Requests
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-neutral-200 text-neutral-700">
                  <History className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-neutral-800">{stats.expired_requests}</div>
                <p className="text-[11px] font-semibold text-neutral-500 mt-1">Past travel times</p>
              </CardContent>
            </Card>

            <Card className="border-red-200/80 bg-white shadow-sm hover:shadow-md hover:border-red-300 transition-all rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50 border-b border-red-100 px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase text-red-800 tracking-wider">
                  Cancelled
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
                  <XCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-red-950">{stats.cancelled_requests}</div>
                <p className="text-[11px] font-semibold text-red-700 mt-1">Aborted trips</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 border-b border-blue-100 px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase text-blue-800 tracking-wider">
                  Available Matches
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-blue-950">{stats.available_matches}</div>
                <p className="text-[11px] font-semibold text-blue-700 mt-1">Compatible peers</p>
              </CardContent>
            </Card>
          </div>

          {/* Highlights Row: Upcoming Trip & Favorite Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Trip Card */}
            <Card className="border-neutral-200/80 bg-white shadow-md hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between overflow-hidden">
              <CardHeader className="bg-neutral-900 text-white px-6 py-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-base font-bold text-white">
                    Next Upcoming Trip
                  </CardTitle>
                </div>
                {stats.next_trip && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Scheduled</span>
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                {stats.next_trip ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Destination
                      </div>
                      <div className="text-2xl font-black text-black flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-black shrink-0" />
                        <span className="truncate">{stats.next_trip.destination}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-neutral-800 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
                        <Calendar className="h-4 w-4 text-neutral-600 shrink-0" />
                        <span className="truncate">{formatDate(stats.next_trip.travel_datetime)}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-neutral-800 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
                        <Clock className="h-4 w-4 text-neutral-600 shrink-0" />
                        <span>{formatTime(stats.next_trip.travel_datetime)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link to={`/travel-requests/${stats.next_trip.id}/matches`} className="w-full block">
                        <Button className="w-full bg-black text-white hover:bg-neutral-800 font-bold gap-2 shadow-sm">
                          <Users className="h-4 w-4" />
                          <span>Check Ride Matches</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                      <Compass className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-base">No Upcoming Trips</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">You have no open travel requests scheduled for the future.</p>
                    </div>
                    <Link to="/travel-requests/new" className="inline-block pt-1">
                      <Button size="sm" className="bg-black text-white hover:bg-neutral-800 font-semibold gap-1.5">
                        <span>Schedule a Trip</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Destination Card */}
            <Card className="border-neutral-200/80 bg-white shadow-md hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white px-6 py-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-400 fill-rose-400" />
                  <CardTitle className="text-base font-bold text-white">
                    Favorite Destination
                  </CardTitle>
                </div>
                {stats.favorite_destination && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/60">
                    Top Pick
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                {stats.favorite_destination ? (
                  <div className="py-4 text-center space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                      <MapPin className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Most Frequently Visited
                      </div>
                      <h3 className="text-3xl font-black text-black tracking-tight">
                        {stats.favorite_destination.name}
                      </h3>
                    </div>
                    <div className="pt-3">
                      <Link to={`/travel-requests?destination=${stats.favorite_destination.id}`}>
                        <Button variant="outline" size="sm" className="font-bold gap-1.5 border-neutral-300 hover:bg-neutral-50 text-black">
                          <span>Browse Rides to {stats.favorite_destination.name}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-base">No Favorites Yet</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">As you create travel requests, your top destination will appear here.</p>
                    </div>
                    <Link to="/travel-requests">
                      <Button size="sm" variant="outline" className="font-semibold gap-1.5 border-neutral-300">
                        <span>Explore Rides</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
