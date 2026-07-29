import React from 'react';
import {
  Send,
  Users,
  Car,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const OrbitFeatures: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Post Outing Request',
      description: 'Select your pickup point, campus destination, date, and preferred departure time.',
      icon: Send,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      number: '02',
      title: 'Instant Peer Match',
      description: 'Discover batchmates traveling to the same location within your departure window.',
      icon: Users,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      number: '03',
      title: 'Split Auto Fare & Ride',
      description: 'Connect, split auto fare equally, and travel safely with verified IIITDM peers.',
      icon: Car,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="w-full mb-16 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Seamless 3-Step Process</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          How Campus Ride Sharing Works
        </h2>
        <p className="text-sm font-semibold text-neutral-600">
          Simple, fast, and secure coordination for all your Kurnool outings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-white p-8 rounded-3xl border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col justify-between space-y-6 relative group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3.5 rounded-2xl border ${step.badgeColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-neutral-200 group-hover:text-neutral-900 transition-colors">
                  {step.number}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Process</span>
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
