import React from 'react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkState();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-destructive text-destructive-foreground animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="container mx-auto flex items-center justify-between max-w-md">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">You're offline</span>
            <span className="text-xs opacity-90">Viewing cached data where available.</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
