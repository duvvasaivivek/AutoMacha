import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 animate-bounce shadow-sm">
        <AlertCircle className="h-10 w-10" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter text-primary">404</h1>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Page Not Found</h2>
        <p className="max-w-md mx-auto text-slate-600">
          Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or is temporarily unavailable.
        </p>
      </div>

      <div className="pt-2">
        <Link to="/">
          <Button size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20">
            <HomeIcon className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
