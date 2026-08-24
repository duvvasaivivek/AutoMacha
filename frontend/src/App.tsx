import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { AppRoutes } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/common';
import { PWABadge } from '@/components/pwa/PWABadge';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Toaster } from 'sonner';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <AppRoutes />
            </main>
            <PWABadge />
            <OfflineBanner />
            <Toaster position="top-center" richColors />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
