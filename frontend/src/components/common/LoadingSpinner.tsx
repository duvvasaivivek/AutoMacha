import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
      <Loader2 className="h-8 w-8 animate-spin text-black" />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;
