import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Global React Error Boundary.
 * Catches unhandled render errors and shows a friendly fallback.
 * Wrap the entire app in main.jsx.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'Unknown error' };
  }

  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            An unexpected error occurred. Refresh the page or contact support if the problem persists.
          </p>
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-2 font-mono text-xs text-red-600">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = { children: PropTypes.node.isRequired };

export default ErrorBoundary;
