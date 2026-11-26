'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { FirestoreErrorInfo } from '@/lib/firebase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  firestoreError: FirestoreErrorInfo | null;
  rawMessage: string;
}

export class FirestoreErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    firestoreError: null,
    rawMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    try {
      const parsed = JSON.parse(error.message) as FirestoreErrorInfo;
      if (parsed && parsed.operationType && parsed.error) {
        return {
          hasError: true,
          firestoreError: parsed,
          rawMessage: parsed.error,
        };
      }
    } catch {
      // Non-JSON standard error
    }
    return {
      hasError: true,
      firestoreError: null,
      rawMessage: error.message || 'An unexpected runtime error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in FirestoreErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, firestoreError: null, rawMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      const { firestoreError, rawMessage } = this.state;
      return (
        <div className="p-6 my-4 rounded-md border border-red-500/40 bg-red-500/5 text-[var(--ds-foreground)] max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-semibold text-red-500">
                {firestoreError
                  ? `Database Security Policy Rejection (${firestoreError.operationType.toUpperCase()})`
                  : 'Application Runtime Exception'}
              </h3>
              <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                {rawMessage}
              </p>
              {firestoreError && (
                <div className="p-2.5 rounded bg-[var(--ds-surface-subtle)] border border-[var(--ds-border)] font-mono text-[11px] space-y-1">
                  <div>
                    <span className="text-[var(--ds-muted-foreground)]">Path: </span>
                    <span>{firestoreError.path || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--ds-muted-foreground)]">Authenticated UID: </span>
                    <span>{firestoreError.authInfo.userId || 'Unauthenticated Guest'}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[var(--ds-primary)] text-white hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Dismiss & Recover
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
