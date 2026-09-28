import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation, Link } from '../router/Router';
import { AuthSidePanel } from '../components/AuthSidePanel';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { searchParams } = useLocation();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Check URL query parameters for token (e.g., ?token=...)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const validateForm = () => {
    const newErrors = {};

    if (!token.trim()) {
      newErrors.token = 'Reset token is required. Please use the link sent to your email.';
    }

    if (!password) {
      newErrors.password = 'Please enter your new password.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
    } else if (!hasUpper || !hasLower || !hasNumber) {
      newErrors.password = 'Password must contain one uppercase letter, one lowercase letter, and one number.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        token: token.trim(),
        password
      });

      setIsSuccess(true);
      addToast('Password reset successfully.', 'success');
    } catch (err) {
      const msg = err.message || 'Reset token is invalid or has expired.';
      setGeneralError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* Left Side: Brand & Visuals */}
        <AuthSidePanel />

        {/* Right Side: Reset Password Form */}
        <div className="auth-right-panel">
          <div className="auth-header">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Choose a strong, secure new password for your account.
            </p>
          </div>

          {generalError && (
            <div className="alert-banner alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{generalError}</div>
            </div>
          )}

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Password Reset Successfully
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Your account password has been updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/login')}
              >
                <span>Back to Login</span>
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Reset Token Input */}
              <div className="form-group">
                <label htmlFor="reset-token" className="form-label">
                  Security Reset Token
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <KeyRound size={18} />
                  </span>
                  <input
                    id="reset-token"
                    type="text"
                    className={`form-input ${errors.token ? 'input-error' : ''}`}
                    placeholder="Enter or paste reset token"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (errors.token) setErrors((prev) => ({ ...prev, token: null }));
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.token && (
                  <div className="validation-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.token}</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="reset-password" className="form-label">
                  New Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <Lock size={18} />
                  </span>
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="validation-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Password complexity helper */}
              {password.length > 0 && (
                <div className="password-criteria-box">
                  <div className={`criteria-item ${hasMinLength ? 'valid' : ''}`}>
                    <CheckCircle2 size={13} color={hasMinLength ? 'var(--primary)' : 'var(--text-light)'} />
                    <span>Minimum 8 characters</span>
                  </div>
                  <div className={`criteria-item ${hasUpper ? 'valid' : ''}`}>
                    <CheckCircle2 size={13} color={hasUpper ? 'var(--primary)' : 'var(--text-light)'} />
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`criteria-item ${hasLower ? 'valid' : ''}`}>
                    <CheckCircle2 size={13} color={hasLower ? 'var(--primary)' : 'var(--text-light)'} />
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`criteria-item ${hasNumber ? 'valid' : ''}`}>
                    <CheckCircle2 size={13} color={hasNumber ? 'var(--primary)' : 'var(--text-light)'} />
                    <span>At least 1 number (0-9)</span>
                  </div>
                </div>
              )}

              {/* Confirm New Password */}
              <div className="form-group">
                <label htmlFor="reset-confirm-password" className="form-label">
                  Confirm New Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <Lock size={18} />
                  </span>
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="validation-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* Submit Reset Button */}
              <button
                id="btn-reset-password"
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {!isSuccess && (
            <div className="auth-footer">
              <Link href="/login">Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
