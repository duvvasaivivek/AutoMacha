import React from 'react';
import {
  Car,
  Send,
  Users,
  Star,
  MessageSquare,
  Clock,
} from 'lucide-react';
import type { User } from '@/types';

interface ProfileStatsProps {
  user: User;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ user }) => {
  const accountAgeText = user.account_age_days !== undefined
    ? `${user.account_age_days} ${user.account_age_days === 1 ? 'day' : 'days'}`
    : 'New member';

  const ratingText = user.average_rating ? Number(user.average_rating).toFixed(1) : '5.0';

  const stats = [
    {
      label: 'Completed Rides',
      value: user.total_completed_rides || 0,
      icon: Car,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Travel Requests',
      value: user.total_travel_requests || 0,
      icon: Send,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Ride Share Requests',
      value: user.total_ride_shares || 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Average Rating',
      value: ratingText,
      icon: Star,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-500 fill-amber-400',
    },
    {
      label: 'Reviews Received',
      value: user.total_ratings || 0,
      icon: MessageSquare,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Account Age',
      value: accountAgeText,
      icon: Clock,
      color: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      iconColor: 'text-neutral-600',
    },
  ];

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-black text-neutral-900 tracking-tight">
        Ride & Activity Statistics
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between space-y-3 hover:border-neutral-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${item.color}`}>
                  <IconComp className={`w-4 h-4 ${item.iconColor}`} />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-neutral-900 tracking-tight">
                  {item.value}
                </div>
                <div className="text-xs font-bold text-neutral-500 mt-0.5 truncate">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
