import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center space-y-8 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-sm font-semibold animate-pulse shadow-sm">
          <Sparkles className="h-4 w-4" />
          <span>Next-Gen Campus Automation Portal</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-black">
          Welcome to{' '}
          <span className="text-black underline decoration-neutral-300 underline-offset-8">
            AutoMacha
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-600 leading-relaxed font-normal">
          The all-in-one smart automation platform designed exclusively for institute students and campus management. Streamline your campus experience with secure, lightning-fast services.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 group text-base font-semibold bg-black text-white hover:bg-neutral-800 shadow-xl shadow-black/10">
              <span>Login to Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-semibold bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 hover:text-black hover:border-neutral-400 shadow-sm">
              Create New Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
