import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/**
 * Last-resort safety net so a render error in one tab cannot blank the whole
 * studio. The error boundary is deliberately simple: it shows what went wrong
 * and a way to recover, rather than a silent white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[postforge] render error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full border border-red-500/30 bg-red-500/5 rounded-2xl p-6 space-y-4 text-center">
          <h2 className="text-lg font-sans font-bold text-white uppercase">
            Something broke
          </h2>
          <p className="text-xs font-mono text-red-400 break-words">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-brand-accent text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-brand-accent/90 cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
