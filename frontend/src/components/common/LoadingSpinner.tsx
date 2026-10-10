import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ message, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-black" />
      {message && <p className="text-xs font-semibold text-neutral-500 animate-pulse">{message}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
