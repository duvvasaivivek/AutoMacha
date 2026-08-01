import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
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
      console.log('SW Registered:', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
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
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    setIsInstallDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // If there's an update, show the update prompt. It takes precedence.
  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 bg-card text-card-foreground p-4 rounded-xl shadow-lg border border-border animate-in slide-in-from-bottom-5">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">Update Available</h3>
            <button 
              onClick={() => setNeedRefresh(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            A new version of AutoMacha is available. Update now to get the latest features.
          </p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update App
          </button>
        </div>
      </div>
    );
  }

  // If install is available and not dismissed, show install prompt
  if (installPrompt && !isInstallDismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 bg-card text-card-foreground p-4 rounded-xl shadow-lg border border-border animate-in slide-in-from-bottom-5">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <img src="/pwa-72x72.png" alt="AutoMacha Icon" className="w-8 h-8 rounded-md" />
              <h3 className="font-semibold text-base">Install AutoMacha</h3>
            </div>
            <button 
              onClick={dismissInstall}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Install our app for a faster, native experience and offline support.
          </p>
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </button>
        </div>
      </div>
    );
  }

  return null;
};
