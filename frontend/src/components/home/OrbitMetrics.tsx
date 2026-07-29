import React from 'react';
import {
  Users,
  Car,
  PiggyBank,
  Star,
} from 'lucide-react';

export const OrbitMetrics: React.FC = () => {
  const stats = [
    {
      label: 'Verified IIITDM Students',
      value: '500+',
      description: 'Active campus batchmates',
      icon: Users,
      badge: 'Student Network',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      label: 'Shared Outing Requests',
      value: '1,200+',
      description: 'Completed campus rides',
      icon: Car,
      badge: 'Outing History',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      label: 'Total Student Fare Saved',
      value: '₹45,000+',
      description: 'Saved on auto rickshaws',
      icon: PiggyBank,
      badge: 'Cost Savings',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      label: 'Community Ride Rating',
      value: '4.9 / 5',
      description: 'Top student satisfaction',
      icon: Star,
      badge: 'Top Rated',
      color: 'bg-amber-50 text-amber-500 border-amber-200',
    },
  ];

  return (
    <div className="w-full mb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
                  {item.badge}
                </span>
              </div>

              <div>
                <div className="text-3xl font-black text-neutral-900 tracking-tight">
                  {item.value}
                </div>
                <div className="text-sm font-bold text-neutral-800 mt-1">
                  {item.label}
                </div>
                <div className="text-xs font-semibold text-neutral-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
