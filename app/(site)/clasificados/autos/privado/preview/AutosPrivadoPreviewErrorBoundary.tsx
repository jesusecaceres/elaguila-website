"use client";

import type { ReactNode } from "react";
import { Component, type ErrorInfo } from "react";
import { AutosPrivadoPreviewEmptyState } from "../components/AutosPrivadoPreviewEmptyState";

type Props = { children: ReactNode };

type State = { hasError: boolean };

/**
 * Prevents a single render exception in Privado preview from white-screening the route.
 */
export class AutosPrivadoPreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[AutosPrivadoPreview]", error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <AutosPrivadoPreviewEmptyState />;
    }
    return this.props.children;
  }
}
