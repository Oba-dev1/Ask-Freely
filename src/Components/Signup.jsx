// src/Components/Signup.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useRecaptcha from '../hooks/useRecaptcha';
import { RECAPTCHA_SITE_KEY } from '../Firebase/config';
import { getFriendlyErrorMessage, retryWithBackoff } from '../utils/errorHandler';
import OfflineBanner from './OfflineBanner';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signup, signInWithGoogle, currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

  // Handle already logged in users
  useEffect(() => {
    // Only redirect if auth has finished loading
    if (authLoading) return;

    if (currentUser && userProfile) {
      // If user successfully just signed up, redirect them
      if (signupSuccess) {
        if (userProfile.profileCompleted) {
          navigate('/organizer/dashboard');
        } else {
          navigate('/profile-setup');
        }
      }
      // If user is already logged in but didn't just sign up,
      // redirect them to dashboard (they shouldn't be on signup page)
      else {
        if (userProfile.profileCompleted) {
          navigate('/organizer/dashboard', { replace: true });
        } else {
          navigate('/profile-setup', { replace: true });
        }
      }
    }
  }, [currentUser, userProfile, authLoading, navigate, signupSuccess]);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(formData.email), [formData.email]);
  const passwordValid = useMemo(() => formData.password.length >= 6, [formData.password]);
  const confirmValid = useMemo(() => formData.confirmPassword === formData.password && formData.confirmPassword.length > 0, [formData.confirmPassword, formData.password]);

  const formValid = emailValid && passwordValid && confirmValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: '#EF4444' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#]/.test(password)) score++;

    if (score <= 1) return { strength: 2, label: 'Fair', color: '#F59E0B' };
    if (score === 2) return { strength: 3, label: 'Good', color: '#10B981' };
    return { strength: 4, label: 'Strong', color: '#059669' };
  };

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification with retry
      const recaptchaToken = await retryWithBackoff(
        () => executeRecaptcha('google_signup'),
        2 // Max 2 retries for reCAPTCHA
      );

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for Google sign-up');
      console.log('🔵 Starting Google Sign-Up (redirect)...');
      await signInWithGoogle();
      // User will be redirected to Google sign-in page
      // After authentication, they'll be redirected back
    } catch (err) {
      console.error('❌ Google sign-up error:', err);
      // Use friendly error message utility
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (!formValid) return;

    try {
      setError('');
      setLoading(true);

      // Execute reCAPTCHA verification
      const recaptchaToken = await executeRecaptcha('signup');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ reCAPTCHA verified for signup');

      // Signup without organization name - will be collected in profile setup
      await signup(formData.email, formData.password, '');
      // Show success message instead of redirecting
      setSignupSuccess(true);
    } catch (err) {
      console.error(err);
      // Use friendly error message utility
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <OfflineBanner />
      <div className="auth-layout">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-image-container">
            <img
              src="https://res.cloudinary.com/dws3lnn4d/image/upload/v1764865450/male-business-executive-giving-speech_h4qxrj.jpg"
              alt="Ask Freely community"
              className="auth-image"
            />
            <div className="auth-image-overlay">
              <div className="brand">
                <div className="logo auth-logo">
                  <span className="logo-icon"><i className="fas fa-comments"></i></span>
                  <span className="logo-text">Ask Freely</span>
                </div>
                <p className="brand-tagline">Create Safe Spaces for Honest Conversations</p>
              </div>
              <div className="visual-caption">
                <p>"Transform your Q&amp;A sessions from awkward silences to meaningful dialogue."</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-container">
            <div className="auth-card">
              <header className="auth-header">
                <span className="logo-icon"><i className="fas fa-comments"></i></span>
                <h1>Start Hosting Better Conversations</h1>
                <p className="subtitle">Create your free account and launch your first anonymous Q&amp;A session in under 3 minutes. No credit card required.</p>
              </header>

              {error && <div className="error-banner" role="alert">{error}</div>}

              {signupSuccess ? (
                <div className="success-message">
                  <div className="success-icon">
                    <i className="fas fa-envelope-circle-check"></i>
                  </div>
                  <h3>Verify Your Email to Get Started</h3>
                  <p>
                    We've sent a verification link to <strong>{formData.email}</strong>
                  </p>
                  <p>
                    Click the link in the email to activate your account and start creating your first Q&amp;A session.
                  </p>
                  <p className="help-text">
                    Can't find the email? Check your spam/junk folder or promotions tab.
                  </p>
                  <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      Return to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="email">Work Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="you@organization.com"
                    aria-invalid={touched.email && !emailValid}
                    aria-describedby={touched.email && !emailValid ? 'email-error' : undefined}
                  />
                  {touched.email && !emailValid && (
                    <small id="email-error" className="input-error">Please enter a valid email address</small>
                  )}
                </div>

                <div className="form-group password-field">
                  <label htmlFor="password">Create Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      required
                      autoComplete="new-password"
                      minLength="6"
                      placeholder="At least 6 characters"
                      aria-invalid={touched.password && !passwordValid}
                      aria-describedby={touched.password && !passwordValid ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="password-strength-indicator">
                      <div className="strength-bar">
                        <div
                          className="strength-bar-fill"
                          style={{
                            width: `${(passwordStrength.strength / 4) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  {touched.password && !passwordValid && (
                    <small id="password-error" className="input-error">Password must be at least 6 characters long</small>
                  )}
                </div>

                <div className="form-group password-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPw2 ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={touched.confirmPassword && !confirmValid}
                      aria-describedby={touched.confirmPassword && !confirmValid ? 'confirm-error' : undefined}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPw2((s) => !s)}
                      aria-label={showPw2 ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {touched.confirmPassword && !confirmValid && (
                    <small id="confirm-error" className="input-error">Passwords must match</small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formValid}
                >
                  {loading ? 'Creating Your Account...' : 'Create Free Account'}
                </button>
              </form>
              )}

              {!signupSuccess && (
                <>
                  <div className="auth-divider"><span>Or sign up with</span></div>

              {/* Google Sign-Up */}
                  <button
                    type="button"
                    className="btn btn-google"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                  >
                    <span className="g-icon"><i className="fa-brands fa-google"></i></span>
                    Continue with Google
                  </button>

                  <div className="auth-links">
                    <p>Already have an account? <Link to="/login">Log in</Link></p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;
