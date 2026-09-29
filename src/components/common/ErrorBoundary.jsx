import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary, #0b1220)',
            color: 'var(--text-primary, #ffffff)',
            fontFamily: 'inherit'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-card, #172033)',
              border: '1px solid var(--border, #263548)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Unexpected Application Error
            </h2>
            <p
              style={{
                color: 'var(--text-secondary, #9bafc2)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: '0 0 1.5rem'
              }}
            >
              VegSense encountered an unexpected runtime error while rendering this component. The rest of your storage telemetry remains safe.
            </p>

            {this.state.error && (
              <div
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--bg-secondary, #111827)',
                  border: '1px solid var(--border, #263548)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#f87171',
                  marginBottom: '1.5rem',
                  overflowX: 'auto'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--primary, #10b981)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-secondary, #111827)',
                  color: 'var(--text-primary, #ffffff)',
                  border: '1px solid var(--border, #263548)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
