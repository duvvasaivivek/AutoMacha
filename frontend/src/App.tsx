import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { AppRoutes } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
