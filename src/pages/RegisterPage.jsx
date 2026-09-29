import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppearance } from '../context/AppearanceContext';
import { useNavigate, useLocation, Link } from '../router/Router';
import { VegSenseLogo } from '../components/branding/VegSenseLogo';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Wifi,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export function RegisterPage() {
  const { register, currentUser, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const { settings, toggleMode } = useAppearance();
  const navigate = useNavigate();
  const { searchParams } = useLocation();

  const paramEmail = searchParams.get('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);

  useEffect(() => {
    if (paramEmail && !email) {
      setEmail(paramEmail);
    }
  }, [paramEmail]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password must contain at least 8 characters.';
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

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must accept the Terms & Conditions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setAccountAlreadyExists(false);

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password
      });

      addToast('Account created successfully! Please sign in with your credentials.', 'success');
      navigate(`/login?email=${encodeURIComponent(email.trim())}&registered=true`);
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      const isDuplicate = err.code === 'USER_ALREADY_EXISTS' || msg.toLowerCase().includes('already exists');
      setAccountAlreadyExists(isDuplicate);
      setGeneralError(msg);
      addToast(msg, isDuplicate ? 'warning' : 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Left Visual Section */}
      <div className="login-visual-section">
        <div className="login-visual-bg" aria-hidden="true" />
        <div className="login-visual-overlay" aria-hidden="true" />
        <div className="login-visual-grid-overlay" aria-hidden="true" />

        <div className="visual-header">
          <div className="visual-brand-pill">
            <VegSenseLogo variant="mark" width="84px" height="84px" />
          </div>

          <div className="visual-title-block">
            <h1 className="visual-hero-title">
              Join VegSense Intelligence.
            </h1>
            <p className="visual-hero-subtitle">
              Intelligent vegetable storage monitoring and early spoilage detection for modern agriculture.
            </p>
          </div>

          <div className="feature-indicators-row">
            <div className="feature-indicator-badge">
              <span className="feature-indicator-icon">
                <Activity size={13} />
              </span>
              <span>Real-Time Monitoring</span>
            </div>
            <div className="feature-indicator-badge">
              <span className="feature-indicator-icon">
                <ShieldCheck size={13} />
              </span>
              <span>Smart Spoilage Detection</span>
            </div>
            <div className="feature-indicator-badge">
              <span className="feature-indicator-icon">
                <Wifi size={13} />
              </span>
              <span>IoT Connected Storage</span>
            </div>
          </div>
        </div>

        <div className="visual-body">
          <div className="telemetry-float-card" style={{ maxWidth: '420px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86efac' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f0fdf4' }}>Commercial IoT Precision</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>DHT22 + MQ-135 Early Spoilage Estimation</div>
              </div>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          <div className="visual-footer-bar">
            <span>VegSense Architecture • Ready for ESP32 Telemetry</span>
          </div>
        </div>
      </div>

      {/* Right Registration Card Section */}
      <div className="login-form-section">
        {/* Floating Quick Theme Toggle */}
        <div className="auth-top-toolbar">
          <button
            type="button"
            className="auth-theme-toggle-btn"
            onClick={toggleMode}
            title={settings.theme === 'night-monitor' ? 'Switch to Forest (Organic)' : 'Switch to Night Monitor (Dark Pro)'}
            aria-label="Toggle Theme"
          >
            {settings.theme === 'night-monitor' ? (
              <>
                <Sun size={14} color="#f59e0b" />
                <span>Forest (Organic)</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#10b981" />
                <span>Night Monitor</span>
              </>
            )}
          </button>
        </div>

        <div className="login-card-container">
          {/* Centered Official VegSense Logo (Section 4 & 14: 250-300px max width) */}
          <div className="login-card-top" style={{ textAlign: 'center' }}>
            <div className="auth-page-logo-container">
              <VegSenseLogo variant="full" maxWidth="270px" priority={true} />
            </div>

            <div className="one-time-notice-pill" style={{ margin: '0 auto 1rem' }}>
              <ShieldCheck size={14} />
              <span>One-Time Registration • After registering, only use Login</span>
            </div>

            <h2 className="login-card-title">Create Your Account</h2>
            <p className="login-card-subtitle">
              Register once to access and manage your intelligent vegetable storage system.
            </p>
          </div>

          {/* Active Session Notice if already logged in */}
          {isAuthenticated && (
            <div className="already-authenticated-banner">
              <div className="already-auth-title">
                <CheckCircle2 size={18} />
                <span>Currently Signed In</span>
              </div>
              <p className="already-auth-sub">
                You are currently signed in as <strong>{currentUser?.name || currentUser?.email}</strong> ({currentUser?.email}).
              </p>
              <div className="already-auth-buttons">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Continue to Dashboard
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    await logout();
                    addToast('Logged out to register a new account.', 'info');
                  }}
                >
                  Log Out to Switch
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Account Already Exists Banner with 1-click Login */}
          {accountAlreadyExists && (
            <div className="account-exists-banner">
              <div className="account-exists-header">
                <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 className="account-exists-title">An account with this email already exists. Please log in.</h4>
                  <p className="account-exists-desc">
                    The email <strong>{email}</strong> is already registered. Please sign in with your email and password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary account-exists-login-btn"
                onClick={() => navigate(`/login?email=${encodeURIComponent(email.trim())}`)}
              >
                <span>Proceed to Login with this Email</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Standard Error Banner */}
          {generalError && !accountAlreadyExists && (
            <div className="alert-banner alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{generalError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="reg-name" className="form-label">
                Full Name
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  className={`login-form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <div className="validation-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="reg-email" className="form-label">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className={`login-form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <div className="validation-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="reg-password" className="form-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a password"
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

            {/* Password Criteria checklist */}
            {password.length > 0 && (
              <div className="password-criteria-box" style={{ marginBottom: '1rem' }}>
                <div className={`criteria-item ${hasMinLength ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} color={hasMinLength ? 'var(--primary)' : 'var(--text-light)'} />
                  <span>Minimum 8 characters</span>
                </div>
                <div className={`criteria-item ${hasUpper ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} color={hasUpper ? 'var(--primary)' : 'var(--text-light)'} />
                  <span>At least 1 uppercase letter</span>
                </div>
                <div className={`criteria-item ${hasLower ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} color={hasLower ? 'var(--primary)' : 'var(--text-light)'} />
                  <span>At least 1 lowercase letter</span>
                </div>
                <div className={`criteria-item ${hasNumber ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} color={hasNumber ? 'var(--primary)' : 'var(--text-light)'} />
                  <span>At least 1 number</span>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="reg-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`login-form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
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

            {/* Terms checkbox */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="checkbox-label" htmlFor="reg-terms">
                <input
                  id="reg-terms"
                  type="checkbox"
                  className="checkbox-input"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: null }));
                  }}
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '0.85rem' }}>
                  I agree to the Terms & Conditions and Privacy Policy
                </span>
              </label>
              {errors.agreeTerms && (
                <div className="validation-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.agreeTerms}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-create-account"
              type="submit"
              className="btn-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Bottom sign in link */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          <div className="login-create-account-prompt">
            Already have an account?
          </div>
          <Link
            id="link-sign-in"
            href="/login"
            className="btn-create-account-link"
          >
            <span>Sign In</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
