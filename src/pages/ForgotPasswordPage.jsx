import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from '../router/Router';
import { AuthSidePanel } from '../components/AuthSidePanel';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Send, ExternalLink } from 'lucide-react';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [demoResetToken, setDemoResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setDemoResetToken(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await forgotPassword({ email: email.trim() });
      const genericMsg = 'If an account exists for this email, a password reset link has been sent.';
      setSuccessMessage(genericMsg);
      addToast('Reset instructions sent.', 'success');

      if (data.resetToken) {
        setDemoResetToken(data.resetToken);
      }
    } catch (err) {
      // Even if network or generic error, handle gracefully
      const msg = err.message || 'If an account exists for this email, a password reset link has been sent.';
      setSuccessMessage(msg);
      addToast('Reset instructions sent.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* Left Side: Brand & Visuals */}
        <AuthSidePanel />

        {/* Right Side: Forgot Password Form */}
        <div className="auth-right-panel">
          <div className="auth-header">
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Enter your registered email address and we'll help you reset your password.
            </p>
          </div>

          {successMessage && (
            <div className="alert-banner alert-success" role="status">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Notice:</strong> {successMessage}
              </div>
            </div>
          )}

          {demoResetToken && (
            <div className="test-helper-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExternalLink size={15} />
                <span>Simulated Email: Direct reset link available for testing</span>
              </div>
              <button
                type="button"
                className="test-helper-btn"
                onClick={() => navigate(`/reset-password?token=${demoResetToken}`)}
              >
                Open Reset Page &rarr;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {error && (
                <div className="validation-error-msg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              id="btn-send-reset"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer" style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
