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
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
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

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password validation
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
          LEFT SIDE: Large Smart Vegetable Storage & IoT Visual Environment
          ========================================================================= */}
      <div className="login-visual-section">
        {/* Background Image Layer */}
        <div className="login-visual-bg" aria-hidden="true" />
        
        {/* Deep Forest Gradient & Atmosphere Overlay */}
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

        {/* Top Visual Header & Pill */}
        <div className="visual-header">
          <div className="visual-brand-pill">
            <BrandLogo size={28} showText={false} lightText={true} />
            <span className="visual-brand-pill-text">IoT Storage Protocol • Online</span>
          </div>

          <div className="visual-title-block">
            <h1 className="visual-hero-title">
              Intelligent Vegetable Storage
            </h1>
            <p className="visual-hero-subtitle">
              Smart monitoring. Early detection. Less waste.
            </p>
          </div>

          {/* Small Feature Indicators */}
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

        {/* Center / Body: Floating Sensor Telemetry Indicators */}
        <div className="visual-body">
          <div className="telemetry-floating-layer">
            {/* Telemetry Indicator 1: DHT22 Temperature & Humidity */}
            <div className="telemetry-float-card telemetry-card-animate-1">
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box">
                  <Gauge size={20} />
                </div>
                <div>
                  <div className="telemetry-card-title">DHT22 Climate Sensor</div>
                  <div className="telemetry-card-value">4.2°C • 88% RH</div>
                </div>
              </div>
              <div className="telemetry-card-status-pill">
                <span className="pulse-dot" />
                <span>Optimal State</span>
              </div>
            </div>

            {/* Telemetry Indicator 2: MQ-135 Gas & Air Quality Sensor */}
            <div className="telemetry-float-card telemetry-card-animate-2">
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box" style={{ background: 'rgba(56, 189, 248, 0.18)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}>
                  <Wind size={20} />
                </div>
                <div>
                  <div className="telemetry-card-title">MQ-135 Volatiles & Gas</div>
                  <div className="telemetry-card-value">14 ppm • Air Purity 99.4%</div>
                </div>
              </div>
              <div className="telemetry-card-status-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.15)' }}>
                <span className="pulse-dot" style={{ backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                <span>Fresh Produce</span>
              </div>
            </div>

            {/* Telemetry Indicator 3: ESP32 Hardware Status */}
            <div className="telemetry-float-card" style={{ padding: '0.75rem 1.125rem' }}>
              <div className="telemetry-card-left">
                <div className="telemetry-card-icon-box" style={{ width: '32px', height: '32px' }}>
                  <Cpu size={16} />
                </div>
                <div style={{ fontSize: '0.825rem' }}>
                  <span style={{ color: '#94a3b8' }}>Chamber Node #04: </span>
                  <strong style={{ color: '#f0fdf4' }}>ESP32 Gateway Connected (192.168.1.105)</strong>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 600 }}>24ms Latency</span>
            </div>
          </div>
        </div>

        {/* Bottom Visual Footer */}
        <div className="visual-footer">
          <div className="visual-footer-bar">
            <span>Prototype Sensor Matrix: DHT22 • MQ-135 • OLED</span>
            <div className="visual-led-status-group">
              <span className="led-status-item">
                <span className="led-indicator led-green" /> Fresh
              </span>
              <span className="led-status-item">
                <span className="led-indicator led-yellow" /> Warning
              </span>
              <span className="led-status-item">
                <span className="led-indicator led-red" /> Spoilage Alert
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Modern SaaS Login Card Section
          ========================================================================= */}
      <div className="login-form-section">
        <div className="login-card-container">
          {/* Mobile Header (displayed on small screens when visual panel is hidden) */}
          <div className="mobile-login-header">
            <BrandLogo size={36} showText={false} />
            <div>
              <div className="mobile-login-header-title">Intelligent Vegetable Storage</div>
              <div className="mobile-login-header-subtitle">Smart monitoring. Early detection. Less waste.</div>
            </div>
          </div>

          {/* Login Card Top Branding */}
          <div className="login-card-top">
            <div className="login-icon-badge">
              <BrandLogo size={32} showText={false} />
            </div>
            <h2 className="login-card-title">Welcome Back</h2>
            <p className="login-card-subtitle">
              Sign in to monitor your smart storage system.
            </p>
          </div>

          {/* Authentication General Error Banner */}
          {generalError && (
            <div className="alert-banner alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{generalError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Address Field */}
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

            {/* Password Field with Show/Hide Toggle */}
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

            {/* Options Row: Remember Me & Forgot Password Link */}
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

            {/* Main Action Button: Sign In */}
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

          {/* OR Divider */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          {/* Account Creation Section */}
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
