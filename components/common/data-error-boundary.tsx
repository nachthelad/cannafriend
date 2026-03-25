"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSuspenseCache } from "@/lib/suspense-utils";

interface DataErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface DataErrorBoundaryState {
  hasError: boolean;
  resetKey: number;
}

export class DataErrorBoundary extends React.Component<
  DataErrorBoundaryProps,
  DataErrorBoundaryState
> {
  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError(): Partial<DataErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[DataErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    clearSuspenseCache();
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm">Ocurrió un error al cargar los datos.</p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
