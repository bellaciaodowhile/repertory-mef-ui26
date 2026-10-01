import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {this.props.fallbackTitle || 'Ocurrió un error en el reproductor'}
          </h2>
          <p className="text-sm text-neutral-400 max-w-sm mb-6">
            Hemos restablecido la interfaz para que puedas seguir ensayando sin interrupciones.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-full bg-white text-neutral-900 font-semibold text-sm flex items-center space-x-2 shadow-lg active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
