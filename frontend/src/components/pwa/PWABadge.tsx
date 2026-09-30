import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-expect-error: Virtual module provided by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWABadge: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.debug('SW Registered:', r);
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error);
    },
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallDismissed, setIsInstallDismissed] = useState(
    localStorage.getItem('pwa-install-dismissed') === 'true'
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await installPrompt.userChoice;
    
    // User choice outcome is tracked internally if needed
    
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    setIsInstallDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80 bg-card text-card-foreground p-4 rounded-xl shadow-2xl border border-border"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Update Available
              </h3>
              <button 
                onClick={() => setNeedRefresh(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A new version of AutoMacha is available. Update now to get the latest features and improvements.
            </p>
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update App
            </button>
          </div>
        </motion.div>
      )}

      {installPrompt && !isInstallDismissed && !needRefresh && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80 bg-card text-card-foreground p-4 rounded-xl shadow-2xl border border-border"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img src="/pwa-72x72.png" alt="AutoMacha Icon" className="w-10 h-10 rounded-lg shadow-sm" />
                <h3 className="font-semibold text-base leading-tight">Install<br/>AutoMacha</h3>
              </div>
              <button 
                onClick={dismissInstall}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Install our app for a faster, native experience and offline support.
            </p>
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm active:scale-[0.98]"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
