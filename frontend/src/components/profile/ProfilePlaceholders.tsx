import React, { useState } from 'react';
import {
  History,
  Star,
  Award,
  Bookmark,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const ProfilePlaceholders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('history');

  const tabs = [
    { id: 'history', label: 'Ride History', icon: History },
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'saved', label: 'Saved Trips', icon: Bookmark },
    { id: 'destinations', label: 'Favorite Destinations', icon: MapPin },
  ];

  const getTabDetails = (id: string) => {
    switch (id) {
      case 'history':
        return {
          title: 'Ride & Travel History',
          description: 'Your completed travel history and detailed logs will appear here.',
        };
      case 'ratings':
        return {
          title: 'Ratings & Reviews',
          description: 'Feedback and star ratings received from co-travelers will be displayed here.',
        };
      case 'achievements':
        return {
          title: 'Travel Badges & Achievements',
          description: 'Earn badges as you complete trips, share rides, and build reputation.',
        };
      case 'saved':
        return {
          title: 'Saved & Reusable Trips',
          description: 'Quickly bookmark frequent travel routes to recreate requests instantly.',
        };
      case 'destinations':
        return {
          title: 'Favorite Destinations',
          description: 'Pin campus hubs and stations you frequently visit for faster booking.',
        };
      default:
        return {
          title: 'Upcoming Feature',
          description: 'This feature is currently under active development.',
        };
    }
  };

  const currentInfo = getTabDetails(activeTab);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-700" />
            <span>Extended Features</span>
          </h2>
          <p className="text-xs font-semibold text-neutral-500 mt-0.5">
            Upcoming profile extensions and historical analytics modules.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Placeholder Card */}
      <Card className="border-neutral-200/80 bg-white shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shadow-inner">
            <Sparkles className="w-8 h-8 text-neutral-500 animate-pulse" />
          </div>

          <div className="max-w-md space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-extrabold text-[11px] uppercase tracking-wider mb-1">
              <span>Coming Soon</span>
            </div>
            <h3 className="text-lg font-black text-neutral-900">
              {currentInfo.title}
            </h3>
            <p className="text-xs font-medium text-neutral-500 leading-relaxed">
              {currentInfo.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
