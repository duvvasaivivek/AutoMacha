import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
          <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 shadow-xl text-center space-y-6">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-black">Something went wrong</h1>
              <p className="text-sm text-neutral-600 font-medium">
                An unexpected error occurred in the application. Please try refreshing the page.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-neutral-100 p-4 rounded-xl text-left text-xs font-mono text-neutral-700 overflow-x-auto max-h-32 border border-neutral-200">
                {this.state.error.message}
              </div>
            )}

            <Button
              onClick={this.handleReset}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold gap-2 py-5 rounded-2xl shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
