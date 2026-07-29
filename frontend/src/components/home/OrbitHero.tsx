import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Car,
  Plane,
  Train,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';

export const OrbitHero: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative w-full overflow-hidden bg-neutral-950 text-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16 border border-neutral-800/80 shadow-2xl mb-12">
      {/* Background Subtle Emerald Ambient Lighting (NO PURPLE) */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative container mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
        
        {/* Left Column: Reference Layout Typography & Headline */}
        <div className="flex-1 space-y-6 text-center lg:text-left max-w-xl">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 text-xs font-extrabold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>IIITDM Kurnool Ride Sharing</span>
          </div>

          {/* Main Headline (Inspired by reference layout) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
            Connect With Campus Peers Heading To The Same Destination –{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              Now Just One Click Away!
            </span>
          </h1>

          <p className="text-base sm:text-lg font-medium text-neutral-400 leading-relaxed">
            Find batchmates traveling to Kurnool Station, Orvakal Airport, or City Market. Split auto fares, travel safely together, and access verified drivers.
          </p>

          {/* Pill CTA Button (Inspired by reference "Start Project >") */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to={isAuthenticated ? '/travel-requests/new' : '/register'} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-13 px-8 text-base font-bold bg-white text-black hover:bg-neutral-100 rounded-full gap-3 shadow-xl hover:scale-105 transition-all"
              >
                <span>{isAuthenticated ? 'Post Request' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Button>
            </Link>

            <Link to="/auto-drivers" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-13 px-7 text-base font-bold bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800 rounded-full gap-2"
              >
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Auto Drivers List</span>
              </Button>
            </Link>
          </div>

          {/* Interactive User Tag Indicator (Inspired by reference "David" badge) */}
          <div className="pt-2 flex items-center justify-center lg:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Duvva (Campus Pickup Ready)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Orbital Network Graphic (Concentric Rings + Avatar Nodes + Center Stat) */}
        <div className="w-full lg:w-[500px] h-[460px] relative flex items-center justify-center shrink-0">
          
          {/* Outer Ring 3 */}
          <div className="absolute w-[440px] h-[440px] rounded-full border border-neutral-800/80 animate-[spin_60s_linear_infinite]" />

          {/* Middle Ring 2 */}
          <div className="absolute w-[320px] h-[320px] rounded-full border border-neutral-800 animate-[spin_40s_linear_infinite_reverse]" />

          {/* Inner Ring 1 */}
          <div className="absolute w-[200px] h-[200px] rounded-full border border-emerald-500/30 animate-[spin_25s_linear_infinite]" />

          {/* Center Graphic Display (Inspired by "20k+ Specialists" in reference) */}
          <div className="relative z-10 w-36 h-36 rounded-full bg-neutral-900 border-2 border-emerald-500/40 shadow-2xl flex flex-col items-center justify-center text-center p-2 backdrop-blur-md">
            <span className="text-3xl font-black text-white tracking-tight">500+</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Verified Students</span>
          </div>

          {/* Orbiting Avatar / Icon Node 1 (Top Right - Railway Station) */}
          <div className="absolute top-[30px] right-[70px] z-20 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 pr-3 rounded-full shadow-lg hover:border-emerald-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-xs shadow-sm">
              AS
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <Train className="w-3 h-3 text-emerald-400" />
              <span>Station</span>
            </div>
          </div>

          {/* Orbiting Avatar / Icon Node 2 (Left Center - Campus Dropoff) */}
          <div className="absolute top-[180px] left-[20px] z-20 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 pr-3 rounded-full shadow-lg hover:border-emerald-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
              RK
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span>Campus</span>
            </div>
          </div>

          {/* Orbiting Avatar / Icon Node 3 (Top Left - Airport) */}
          <div className="absolute top-[60px] left-[70px] z-20 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 pr-3 rounded-full shadow-lg hover:border-emerald-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-xs shadow-sm">
              VN
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <Plane className="w-3 h-3 text-amber-400" />
              <span>Airport</span>
            </div>
          </div>

          {/* Orbiting Avatar / Icon Node 4 (Bottom Right - Bus Stand) */}
          <div className="absolute bottom-[50px] right-[50px] z-20 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 pr-3 rounded-full shadow-lg hover:border-emerald-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
              PG
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <Car className="w-3 h-3 text-purple-400" />
              <span>Bus Stand</span>
            </div>
          </div>

          {/* Orbiting Avatar / Icon Node 5 (Bottom Left - D-Mart) */}
          <div className="absolute bottom-[80px] left-[60px] z-20 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 pr-3 rounded-full shadow-lg hover:border-emerald-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-teal-500 text-black font-black flex items-center justify-center text-xs shadow-sm">
              MS
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-teal-400" />
              <span>City Mall</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
