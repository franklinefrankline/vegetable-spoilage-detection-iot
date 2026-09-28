import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from '../router/Router';
import { AuthSidePanel } from '../components/AuthSidePanel';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  // Password rule checks for real-time visual feedback
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordComplex = hasMinLength && hasUpper && hasLower && hasNumber;

  const validateForm = () => {
    const newErrors = {};

    // Full Name
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name is required.';
    }

    // Email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password
    if (!password) {
      newErrors.password = 'Password must contain at least 8 characters.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.';
    } else if (!hasUpper || !hasLower || !hasNumber) {
      newErrors.password = 'Password must contain one uppercase letter, one lowercase letter, and one number.';
    }

    // Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // Terms
    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must accept the Terms & Conditions.';
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password
      });

      addToast('Account created successfully.', 'success');
      navigate('/connect-device');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
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

        {/* Right Side: Registration Card */}
        <div className="auth-right-panel">
          <div className="auth-header">
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">
              Register to monitor and manage your intelligent vegetable storage system.
            </p>
          </div>

          {generalError && (
            <div className="alert-banner alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{generalError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full Name
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <User size={18} />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
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
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
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
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
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

            {/* Real-time Password Complexity Visual Indicator */}
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
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

            {/* Terms and Conditions Checkbox */}
            <div className="form-group">
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

            {/* Create Account Submit Button */}
            <button
              id="btn-create-account"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
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

          {/* Navigation to Login */}
          <div className="auth-footer">
            Already have an account?
            <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
