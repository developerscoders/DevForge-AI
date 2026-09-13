import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#111114] border border-rose-500/30 p-8 rounded-xl shadow-2xl space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                {this.props.fallbackTitle || 'Session State Recovered'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The application encountered an unexpected runtime issue, but your data and project workspaces remain safe.
              </p>
              {this.state.error && (
                <div className="bg-[#050507] p-3 rounded border border-[#222] text-[10px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded shadow transition flex items-center space-x-1.5"
                id="error-boundary-reload-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover & Refresh</span>
              </button>

              <a
                href="/projects"
                className="bg-[#18181b] hover:bg-[#222] border border-[#333] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition flex items-center space-x-1.5"
                id="error-boundary-home-btn"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Projects</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
