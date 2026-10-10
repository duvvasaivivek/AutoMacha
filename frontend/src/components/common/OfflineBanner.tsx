import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkState } from '@/hooks/useNetworkState';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = React.memo(() => {
  const { isOnline } = useNetworkState();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-neutral-900 text-white shadow-2xl border-t border-neutral-800"
        >
          <div className="container mx-auto flex items-center justify-between max-w-md">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-neutral-800 text-amber-400">
                <WifiOff className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">You're offline</span>
                <span className="text-xs text-neutral-400">Viewing cached data where available.</span>
              </div>
            </div>
            <motion.button
              whileHover={{ rotate: 90, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Retry connection"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

export default OfflineBanner;
