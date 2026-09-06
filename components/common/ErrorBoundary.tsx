"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Link } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // TODO: plug in Sentry / error tracking
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-900">
              Terjadi Kesalahan
            </h2>
            <p className="mt-1 text-sm text-red-700">
              {this.state.error?.message ?? "Komponen gagal dimuat"}
            </p>
          </div>

          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="w-full max-w-lg">
              <summary className="cursor-pointer text-xs text-red-500 hover:underline">
                Detail error (development)
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-red-900 p-3 text-left text-xs text-red-100">
                {this.state.error?.stack}
                {"\n\nComponent Stack:"}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Ke Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---- Page-level error component (for Next.js error.tsx) ----
export function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Oops! Ada yang salah
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          {error.message ??
            "Terjadi kesalahan yang tidak terduga. Tim kami sudah diberitahu."}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-slate-400">
            ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
