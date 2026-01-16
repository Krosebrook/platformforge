/**
 * Lazy Loading Utilities
 * Provides optimized lazy loading for routes and components
 * with loading states and error boundaries
 */

import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Default loading component
 * Displayed while lazy components are loading
 */
export const DefaultLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-900 mx-auto mb-3" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Lazy load a component with custom loading fallback
 * @param {Function} importFunc - Dynamic import function
 * @param {React.Component} fallback - Optional custom loading component
 * @returns {React.Component} Lazy loaded component wrapped in Suspense
 */
export const lazyLoadComponent = (importFunc, fallback = <DefaultLoadingFallback />) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Preload a lazy component
 * Useful for prefetching on hover or other user interactions
 * @param {Function} importFunc - Dynamic import function
 */
export const preloadComponent = (importFunc) => {
  importFunc();
};

/**
 * Error boundary for lazy loaded components
 */
export class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Failed to load component
            </h2>
            <p className="text-gray-600 mb-4">
              Please refresh the page to try again
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}