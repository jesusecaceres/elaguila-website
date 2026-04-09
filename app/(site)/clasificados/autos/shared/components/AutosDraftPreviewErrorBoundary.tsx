"use client";

import type { ReactNode } from "react";
import { Component, type ErrorInfo } from "react";

type Props = { children: ReactNode; fallback: ReactNode; logLabel?: string };

type State = { hasError: boolean };

/**
 * Catches render errors in Autos draft preview routes so a bad draft cannot white-screen the page.
 */
export class AutosDraftPreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error(`[AutosDraftPreview:${this.props.logLabel ?? "preview"}]`, error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
