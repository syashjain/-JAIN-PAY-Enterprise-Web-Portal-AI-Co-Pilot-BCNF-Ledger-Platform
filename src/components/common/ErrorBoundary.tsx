import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Application-level Error Boundary ensuring zero unhandled white-screen crashes.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected rendering exception.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[JainPay ErrorBoundary]', error, info.componentStack);
  }

  handleRecover = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#050507] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full card-3d-orange p-8 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EF4444]/15 border border-[#EF4444] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#FF8800] uppercase tracking-wider block mb-1">
                ZERO-TRUST FAULT ISOLATION BOUNDARY
              </span>
              <h1 className="text-xl font-extrabold text-white">
                UI Stage Exception Intercepted
              </h1>
              <p className="text-xs text-[#D4D4D8] mt-2 leading-relaxed">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleRecover}
              className="w-full py-3.5 px-6 rounded-full btn-blaze-orange text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recover Stage &amp; Preserve BCNF Ledger State</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
