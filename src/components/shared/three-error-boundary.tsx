"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThreeErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ThreeErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-border/40 bg-card/50 p-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertTriangle size={24} />
          </span>
          <div>
            <h3 className="font-heading text-[16px] font-bold text-foreground">
              3D View Tidak Tersedia
            </h3>
            <p className="mt-1 text-[12.5px] text-muted-foreground max-w-md">
              Browser atau device kamu tidak mendukung WebGL. Coba buka di
              browser lain atau device yang lebih baru.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="rounded-full"
          >
            <RefreshCw size={14} />
            Coba Lagi
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
