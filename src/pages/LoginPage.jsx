import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from '../router/Router';
import { BrandLogo } from '../components/BrandLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Activity,
  ShieldCheck,
  Wifi,
  Gauge,
  Wind,
  Cpu
} from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
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
      await login({
        email: email.trim(),
        password,
        rememberMe
      });

      addToast('Login successful.', 'success');
      navigate('/connect-device');
    } catch (err) {
      const msg = err.message || 'Invalid email or password.';
      setGeneralError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* =========================================================================
          LEFT SIDE: Smart vegetable storage visual & telemetry
          ========================================================================= */}
      <div className="login-visual-section">
        {/* Background Image Layer */}
        <div className="login-visual-bg" aria-hidden="true" />
        
        {/* Atmosphere Overlay */}
        <div className="login-visual-overlay" aria-hidden="true" />

        {/* Subtle Tech Micro-Grid Overlay */}
        <div className="login-visual-grid-overlay" aria-hidden="true" />

        {/* Subtle Floating Data Particles */}
        <div className="particles-layer" aria-hidden="true">
          <span className="data-particle p1" />
          <span className="data-particle p2" />
          <span className="data-particle p3" />
          <span className="data-particle p4" />
          <span className="data-particle p5" />
        </div>

        {/* Top Header Pill */}
        <div className="visual-header">
          <div className="visual-brand-pill">
            <BrandLogo size={28} showText={true} lightText={true} />
          </div>

          <div className="visual-title-block">
            <h1 className="visual-hero-title">
              Protect Every Harvest.
            </h1>
            <p className="visual-hero-subtitle">
              Monitor storage conditions and detect spoilage before it becomes waste.
            </p>
          </div>

          {/* Feature indicators */}
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

        {/* Center: Floating Sensor Information Cards */}
        <div className="visual-body">
          <div className="telemetry-floating-layer">
            {/* Card 1: Temperature & Humidity */}
            <div className="telemetry-float-card telemetry-card-animate-1">
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box">
                  <Gauge size={20} />
                </div>
                <div>
                  <div className="telemetry-card-title">Climate Monitoring (DHT22)</div>
                  <div className="telemetry-card-value">28.5°C • 72% RH</div>
                </div>
              </div>
              <div className="telemetry-card-status-pill">
                <span className="pulse-dot" />
                <span>Optimal</span>
              </div>
            </div>

            {/* Card 2: Gas / VOC Spoilage Detection */}
            <div className="telemetry-float-card telemetry-card-animate-2">
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box" style={{ background: 'rgba(56, 189, 248, 0.18)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}>
                  <Wind size={20} />
                </div>
                <div>
                  <div className="telemetry-card-title">Gas / VOC Level (MQ-135)</div>
                  <div className="telemetry-card-value">420 ppm • Normal Range</div>
                </div>
              </div>
              <div className="telemetry-card-status-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.15)' }}>
                <span className="pulse-dot" style={{ backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                <span>Fresh</span>
              </div>
            </div>

            {/* Card 3: Connected ESP32 Technology */}
            <div className="telemetry-float-card" style={{ padding: '0.75rem 1.125rem' }}>
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box" style={{ width: '32px', height: '32px' }}>
                  <Cpu size={16} />
                </div>
                <div style={{ fontSize: '0.825rem' }}>
                  <span style={{ color: '#94a3b8' }}>ESP32 Connected: </span>
                  <strong style={{ color: '#f0fdf4' }}>192.168.1.105 (Signal: Strong)</strong>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="visual-footer">
          <div className="visual-footer-bar">
            <span>VegSense Smart Storage Telemetry</span>
            <div className="visual-led-status-group">
              <span className="led-status-item">
                <span className="led-indicator led-green" /> Fresh
              </span>
              <span className="led-status-item">
                <span className="led-indicator led-yellow" /> Warning
              </span>
              <span className="led-status-item">
                <span className="led-indicator led-red" /> Spoilage Risk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Modern Login Card
          ========================================================================= */}
      <div className="login-form-section">
        <div className="login-card-container">
          {/* Mobile Header */}
          <div className="mobile-login-header">
            <BrandLogo size={36} showText={true} />
          </div>

          {/* Top Brand & Titles */}
          <div className="login-card-top">
            <div className="login-icon-badge">
              <BrandLogo size={32} showText={false} />
            </div>
            <h2 className="login-card-title">Welcome Back</h2>
            <p className="login-card-subtitle">
              Sign in to monitor your smart storage system.
            </p>
          </div>

          {/* Error Banner */}
          {generalError && (
            <div className="alert-banner alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{generalError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Address */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  autoComplete="current-password"
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

            {/* Options: Remember me & Forgot Password? */}
            <div className="login-card-options">
              <label className="checkbox-label" htmlFor="remember-me">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Remember me</span>
              </label>

              <Link href="/forgot-password" className="login-forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Main button: Sign In */}
            <button
              id="btn-sign-in"
              type="submit"
              className="btn-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Divider: OR */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          {/* Create Account link */}
          <div className="login-create-account-prompt">
            Don't have an account?
          </div>
          <Link
            id="link-create-account"
            href="/register"
            className="btn-create-account-link"
          >
            <span>Create Account</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
