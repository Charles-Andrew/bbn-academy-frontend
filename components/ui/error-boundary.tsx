"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try again or refresh the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-muted p-4 rounded-md text-xs">
                  <summary className="cursor-pointer font-mono font-semibold mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/" className="gap-2">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children || null
  }
}

// Simple error boundary for specific components
export function SimpleErrorBoundary({ children, fallback }: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <p className="text-sm text-destructive">
              This component failed to load. Please try refreshing the page.
            </p>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Page-level error boundary
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}